// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Lesezugriffe auf den Provenance-Store: Budget-Aussagen (mit Volltextsuche) und die
// vollständige Herkunftsauflösung (Citation + W3C-PROV-JSON, ADR-0006).

import { query } from './db.ts';
import type { Statement, ProvenanceResolution, ProvDocument } from './types.ts';

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapStatement(r: Record<string, unknown>): Statement {
  return {
    id: r.id as string,
    subjectRef: r.subject_ref as string,
    subjectLabel: r.subject_label as string,
    aspect: r.aspect as string,
    value: r.value,
    unit: (r.unit as string | null) ?? null,
    validFrom: r.valid_from as string,
    validTo: (r.valid_to as string | null) ?? null,
    jurisdictionCode: r.jurisdiction_code as string,
    nature: r.nature as 'primary' | 'derived',
    datasetVersionId: r.dataset_version_id as string,
    recordLocator: r.record_locator as string,
    lifecycle: r.lifecycle as Statement['lifecycle'],
  };
}

const STATEMENT_COLUMNS = `
  s.id, s.subject_ref, s.subject_label, s.aspect, s.value, s.unit,
  lower(s.valid_time)::text AS valid_from, upper(s.valid_time)::text AS valid_to,
  s.jurisdiction_code, s.nature, s.dataset_version_id, s.record_locator, s.lifecycle`;

/** Aktuelle Budget-Aussagen (Modul openbudget), optional volltextgefiltert. */
export async function listBudgetStatements(opts: { q?: string; limit?: number } = {}): Promise<Statement[]> {
  const params: unknown[] = [];
  let where = `d.module = 'openbudget' AND s.lifecycle = 'active' AND s.sys_to IS NULL`;
  if (opts.q && opts.q.trim() !== '') {
    params.push(opts.q.trim());
    where += ` AND s.search_vector @@ websearch_to_tsquery('german', $${params.length})`;
  }
  params.push(opts.limit ?? 100);
  const res = await query(
    `SELECT ${STATEMENT_COLUMNS}
       FROM statement s
       JOIN dataset_version dv ON dv.id = s.dataset_version_id
       JOIN dataset d ON d.id = dv.dataset_id
      WHERE ${where}
      ORDER BY (s.value->>'amount')::numeric DESC NULLS LAST
      LIMIT $${params.length}`,
    params,
  );
  return res.rows.map(mapStatement);
}

/** Einzelne Aussage per ID. */
export async function getStatement(id: string): Promise<Statement | null> {
  const res = await query(
    `SELECT ${STATEMENT_COLUMNS} FROM statement s WHERE s.id = $1`,
    [id],
  );
  return res.rows[0] ? mapStatement(res.rows[0]) : null;
}

/**
 * Löst die vollständige Herkunftskette einer Aussage auf: Statement → DatasetVersion →
 * SourceVersion → Source → Publisher. Liefert ein menschenlesbares Citation-Objekt und
 * ein interoperables W3C-PROV-JSON. Kern des Quellenzwangs (Leitprinzip 2, QA1).
 */
export async function resolveProvenance(statementId: string): Promise<ProvenanceResolution | null> {
  const res = await query(
    `SELECT
        s.id  AS statement_id,
        src.id AS source_id, src.name AS source_name, src.type AS source_type,
        src.canonical_uri, src.jurisdiction_code,
        ag.id AS pub_id, ag.name AS pub_name, ag.kind AS pub_kind,
        sv.id AS sv_id, sv.retrieved_at, sv.content_hash, sv.media_type,
        sv.upstream_version_label, sv.license,
        dv.id AS dv_id, dv.layer, dv.code_version, dv.produced_at
       FROM statement s
       JOIN dataset_version dv       ON dv.id  = s.dataset_version_id
       JOIN dataset_version_input dvi ON dvi.dataset_version_id = dv.id
       JOIN source_version sv        ON sv.id  = dvi.source_version_id
       JOIN source src               ON src.id = sv.source_id
       JOIN agent ag                 ON ag.id  = src.publisher_id
      WHERE s.id = $1
      LIMIT 1`,
    [statementId],
  );
  const r = res.rows[0];
  if (!r) return null;

  const citation: ProvenanceResolution['citation'] = {
    statementId: r.statement_id as string,
    source: {
      id: r.source_id as string,
      name: r.source_name as string,
      type: r.source_type as string,
      canonicalUri: (r.canonical_uri as string | null) ?? null,
      jurisdiction: r.jurisdiction_code as string,
      publisher: { id: r.pub_id as string, name: r.pub_name as string, kind: r.pub_kind as string },
    },
    sourceVersion: {
      id: r.sv_id as string,
      retrievedAt: toIso(r.retrieved_at),
      contentHash: r.content_hash as string,
      mediaType: r.media_type as string,
      upstreamVersionLabel: (r.upstream_version_label as string | null) ?? null,
      license: (r.license as string | null) ?? null,
    },
    datasetVersion: {
      id: r.dv_id as string,
      layer: r.layer as string,
      codeVersion: r.code_version as string,
      producedAt: toIso(r.produced_at),
    },
  };

  const provJson: ProvDocument = {
    prefix: { oc: 'urn:oc:', prov: 'http://www.w3.org/ns/prov#' },
    entity: {
      [citation.statementId]: { 'oc:kind': 'Statement' },
      [citation.datasetVersion.id]: { 'oc:kind': 'DatasetVersion', 'oc:layer': citation.datasetVersion.layer },
      [citation.sourceVersion.id]: {
        'oc:kind': 'SourceVersion',
        'oc:contentHash': citation.sourceVersion.contentHash,
        'oc:retrievedAt': citation.sourceVersion.retrievedAt,
      },
      [citation.source.id]: { 'oc:kind': 'Source', 'oc:name': citation.source.name },
    },
    agent: {
      [citation.source.publisher.id]: {
        'prov:type': citation.source.publisher.kind,
        'oc:name': citation.source.publisher.name,
      },
    },
    wasDerivedFrom: {
      _dv: { 'prov:generatedEntity': citation.statementId, 'prov:usedEntity': citation.datasetVersion.id },
      _sv: { 'prov:generatedEntity': citation.datasetVersion.id, 'prov:usedEntity': citation.sourceVersion.id },
      _src: { 'prov:generatedEntity': citation.sourceVersion.id, 'prov:usedEntity': citation.source.id },
    },
    wasAttributedTo: {
      _pub: { 'prov:entity': citation.source.id, 'prov:agent': citation.source.publisher.id },
    },
  };

  return { citation, provJson };
}
