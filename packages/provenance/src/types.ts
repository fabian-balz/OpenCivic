// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Domänentypen des Provenance-Modells (ADR-0006). Auf W3C-PROV gemappt:
// Source/SourceVersion/DatasetVersion/Statement = Entity, Activity, Agent.

export type Jurisdiction = {
  code: string;
  parentCode: string | null;
  level: 'country' | 'state' | 'district' | 'municipality';
  name: string;
};

export type Agent = {
  id: string;
  kind: 'software' | 'organization' | 'person';
  name: string;
  identifier: string | null;
};

export type StatementLifecycle = 'active' | 'superseded' | 'retracted';

/** Eine atomare, zitierbare Aussage. */
export type Statement = {
  id: string;
  subjectRef: string;
  subjectLabel: string;
  aspect: string;
  value: unknown;
  unit: string | null;
  validFrom: string; // ISO-Datum, untere Grenze von valid_time
  validTo: string | null; // ISO-Datum, obere (exklusive) Grenze
  jurisdictionCode: string;
  nature: 'primary' | 'derived';
  datasetVersionId: string;
  recordLocator: string;
  lifecycle: StatementLifecycle;
};

/** Menschenlesbarer Beleg zu einer Aussage. */
export type Citation = {
  statementId: string;
  source: {
    id: string;
    name: string;
    type: string;
    canonicalUri: string | null;
    jurisdiction: string;
    publisher: { id: string; name: string; kind: string };
  };
  sourceVersion: {
    id: string;
    retrievedAt: string;
    contentHash: string;
    mediaType: string;
    upstreamVersionLabel: string | null;
    license: string | null;
  };
  datasetVersion: {
    id: string;
    layer: string;
    codeVersion: string;
    producedAt: string;
  };
};

/** Vollständige Herkunftsauflösung: menschenlesbares Citation-Objekt + W3C-PROV-JSON. */
export type ProvenanceResolution = {
  citation: Citation;
  provJson: ProvDocument;
};

// Minimaler W3C-PROV-JSON-Ausschnitt (ADR-0006), exportierbar/interoperabel.
export type ProvDocument = {
  prefix: Record<string, string>;
  entity: Record<string, Record<string, unknown>>;
  agent: Record<string, Record<string, unknown>>;
  wasDerivedFrom: Record<string, { 'prov:generatedEntity': string; 'prov:usedEntity': string }>;
  wasAttributedTo: Record<string, { 'prov:entity': string; 'prov:agent': string }>;
};
