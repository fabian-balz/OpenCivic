// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Ingest-Orchestrierung (ADR-0016): ruft den Python-OpenData-Connector als Subprozess über den
// JSON-Contract auf, verifiziert den Bronze-Hash (Integrität, R11), bewahrt die Rohbytes
// unverändert (Bronze) und leitet Silver/Gold + Statements mit lückenloser Provenance ab.
// Alles in einer Transaktion — der DEFERRED Quellenzwang-Trigger prüft beim Commit.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { getPool } from './db.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const CONNECTOR_DIR = join(REPO_ROOT, 'connectors', 'openbudget-de');
const DEFAULT_SAMPLE = join(REPO_ROOT, 'data', 'samples', 'bundeshaushalt-2025-excerpt.csv');

type BronzeEnvelope = {
  connector: string;
  connector_version: string;
  source: {
    urn: string;
    name: string;
    type: string;
    canonical_uri: string;
    license: string;
    jurisdiction: string;
    publisher: { kind: string; name: string; identifier: string };
  };
  retrieved_at: string;
  upstream_version_label: string;
  media_type: string;
  byte_size: number;
  content_hash: string;
  content_base64: string;
};

export type IngestResult = {
  sourceVersionId: string;
  datasetVersionId: string;
  statementCount: number;
  contentHash: string;
};

function gitCodeVersion(): string {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return r.status === 0 ? `git:${r.stdout.trim()}` : 'uncommitted';
}

function runConnector(samplePath: string, retrievedAt: string): BronzeEnvelope {
  const proc = spawnSync(
    'python3',
    ['-m', 'openbudget_de', '--source', samplePath, '--retrieved-at', retrievedAt],
    { cwd: CONNECTOR_DIR, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  if (proc.status !== 0) {
    throw new Error(`Connector fehlgeschlagen (exit ${proc.status}): ${proc.stderr}`);
  }
  return JSON.parse(proc.stdout) as BronzeEnvelope;
}

/** Parst die (Sample-)Budget-CSV zu Silver-Zeilen. */
function parseBudgetCsv(raw: string): Array<Record<string, string>> {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  const header = lines[0]!.split(';');
  return lines.slice(1).map((line) => {
    const cols = line.split(';');
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

/**
 * Führt den vollständigen Ingest aus: Connector → Bronze (verifiziert) → Silver/Gold →
 * Statements. Deterministische IDs (aus dem Inhalts-Hash) machen den Lauf idempotent
 * (Reproduzierbarkeit, Leitprinzip 4).
 */
export async function runIngest(
  opts: { samplePath?: string; retrievedAt?: string } = {},
): Promise<IngestResult> {
  const samplePath = opts.samplePath ?? DEFAULT_SAMPLE;
  const retrievedAt = opts.retrievedAt ?? process.env.INGEST_RETRIEVED_AT ?? new Date().toISOString();

  const bronze = runConnector(samplePath, retrievedAt);

  // Integrität: Hash der Rohbytes eigenständig nachrechnen (Vertrauen ist nicht genug, R11).
  const rawBytes = Buffer.from(bronze.content_base64, 'base64');
  const recomputed = 'sha256:' + createHash('sha256').update(rawBytes).digest('hex');
  if (recomputed !== bronze.content_hash) {
    throw new Error(`Hash-Mismatch: Connector ${bronze.content_hash} ≠ berechnet ${recomputed}`);
  }
  const short = recomputed.slice('sha256:'.length, 'sha256:'.length + 12);

  // Bronze unverändert ablegen (Objektspeicher-Ersatz im Solo-Profil).
  const bronzeDir = join(REPO_ROOT, '.bronze');
  mkdirSync(bronzeDir, { recursive: true });
  const storageRef = `.bronze/${short}.csv`;
  writeFileSync(join(REPO_ROOT, storageRef), rawBytes);

  const src = bronze.source;
  const sourceVersionId = `${src.urn}#${short}`;
  const datasetId = 'urn:oc:dataset:openbudget';
  const datasetVersionId = `urn:oc:dataset:openbudget:gold#${short}`;
  const pipelineRunId = `run:${short}`;
  const codeVersion = gitCodeVersion();

  const rows = parseBudgetCsv(rawBytes.toString('utf8'));

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    // Stammdaten (idempotent)
    await client.query(
      `INSERT INTO agent (id, kind, name, identifier) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`,
      [src.publisher.identifier, src.publisher.kind, src.publisher.name, src.publisher.identifier],
    );
    await client.query(
      `INSERT INTO jurisdiction (code, parent_code, level, name) VALUES ($1,NULL,'country',$2)
       ON CONFLICT (code) DO NOTHING`,
      [src.jurisdiction, 'Deutschland (Bund)'],
    );
    await client.query(
      `INSERT INTO source (id, name, type, publisher_id, canonical_uri, default_license, jurisdiction_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [src.urn, src.name, src.type, src.publisher.identifier, src.canonical_uri, src.license, src.jurisdiction],
    );

    // Bronze-Snapshot
    await client.query(
      `INSERT INTO source_version
         (id, source_id, retrieved_at, content_hash, storage_ref, media_type, byte_size, upstream_version_label, license)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [sourceVersionId, src.urn, bronze.retrieved_at, bronze.content_hash, storageRef,
        bronze.media_type, bronze.byte_size, bronze.upstream_version_label, src.license],
    );

    // Dataset + Gold-Version + Lineage
    await client.query(
      `INSERT INTO dataset (id, module, name) VALUES ($1,'openbudget',$2)
       ON CONFLICT (id) DO NOTHING`,
      [datasetId, 'Bundeshaushalt (OpenBudget)'],
    );
    await client.query(
      `INSERT INTO dataset_version (id, dataset_id, layer, schema_version, pipeline_run_id, code_version, content_hash)
       VALUES ($1,$2,'gold','1',$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
      [datasetVersionId, datasetId, pipelineRunId, codeVersion, bronze.content_hash],
    );
    await client.query(
      `INSERT INTO dataset_version_input (dataset_version_id, source_version_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [datasetVersionId, sourceVersionId],
    );

    // Gold: eine Aussage je Haushaltstitel (aspect = 'ansatz').
    let count = 0;
    for (const row of rows) {
      const recordLocator = `epl${row.epl}/kap${row.kapitel}/titel${row.titel}`;
      const statementId = `urn:oc:stmt:${short}:${row.kapitel}-${row.titel}`;
      const amount = Number(row.soll_2025_eur);
      const value = {
        amount,
        currency: 'EUR',
        label: row.zweckbestimmung,
        einzelplan: row.epl,
        einzelplan_bezeichnung: row.epl_bezeichnung,
      };
      await client.query(
        `INSERT INTO statement
           (id, subject_ref, subject_label, aspect, value, unit, valid_time,
            jurisdiction_code, nature, dataset_version_id, record_locator, lifecycle)
         VALUES ($1,$2,$3,'ansatz',$4::jsonb,'EUR',daterange($5::date,$6::date,'[)'),
                 $7,'primary',$8,$9,'active')
         ON CONFLICT (id) DO NOTHING`,
        [statementId, `titel:${row.kapitel}-${row.titel}`, row.zweckbestimmung,
          JSON.stringify(value), '2025-01-01', '2026-01-01',
          row.jurisdiction_ags || 'DE', datasetVersionId, recordLocator],
      );
      count += 1;
    }

    await client.query('COMMIT'); // <- hier prüft der DEFERRED Quellenzwang-Trigger
    return { sourceVersionId, datasetVersionId, statementCount: count, contentHash: bronze.content_hash };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
