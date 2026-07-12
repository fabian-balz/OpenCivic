// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Integrationstest gegen einen laufenden PostgreSQL (make db-up && make migrate).
// Beweist die Grundinvariante Quellenzwang und die vollständige Citation-Kette.

import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import {
  runIngest,
  listBudgetStatements,
  resolveProvenance,
  getPool,
  closePool,
} from '../src/index.ts';

beforeAll(async () => {
  // Idempotenter Ingest des Samples (deterministischer Zeitstempel).
  await runIngest({ retrievedAt: '2026-02-01T09:00:00.000Z' });
});

afterAll(async () => {
  await closePool();
});

describe('OpenBudget-Provenance', () => {
  it('importiert Budget-Aussagen', async () => {
    const statements = await listBudgetStatements();
    expect(statements.length).toBeGreaterThan(0);
    const s = statements[0]!;
    expect(s.aspect).toBe('ansatz');
    expect(s.unit).toBe('EUR');
    expect(s.nature).toBe('primary');
  });

  it('löst für jede Aussage die vollständige Kette bis zur Quelle auf (Quellenzwang)', async () => {
    const statements = await listBudgetStatements();
    for (const s of statements) {
      const res = await resolveProvenance(s.id);
      expect(res, `Aussage ${s.id} ohne auflösbare Quelle`).not.toBeNull();
      const c = res!.citation;
      expect(c.sourceVersion.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(c.source.jurisdiction).toBe('DE');
      expect(c.datasetVersion.layer).toBe('gold');
      // PROV-JSON enthält die Ableitungskette Statement→DatasetVersion→SourceVersion→Source
      expect(Object.keys(res!.provJson.wasDerivedFrom).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Volltextsuche filtert Aussagen', async () => {
    // Deutsche FTS stemmt, zerlegt aber keine Komposita: "Kommunen" ist ein eigenständiges Token.
    const hits = await listBudgetStatements({ q: 'Kommunen' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.subjectLabel.toLowerCase().includes('kommun'))).toBe(true);
  });

  it('verweigert ein Statement ohne auflösbare Quelle (Trigger erzwingt Quellenzwang)', async () => {
    const client = await getPool().connect();
    let rejected = false;
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO dataset (id, module, name) VALUES ('urn:oc:dataset:_t','_t','t')
         ON CONFLICT (id) DO NOTHING`,
      );
      await client.query(
        `INSERT INTO dataset_version (id, dataset_id, layer, schema_version, pipeline_run_id, code_version)
         VALUES ('dv:noinput','urn:oc:dataset:_t','gold','1','r','c') ON CONFLICT (id) DO NOTHING`,
      );
      await client.query(
        `INSERT INTO statement
           (id, subject_ref, subject_label, aspect, value, valid_time, jurisdiction_code, nature, dataset_version_id, record_locator)
         VALUES ('stmt:orphan','s','l','ansatz','{}'::jsonb,
                 daterange('2025-01-01','2026-01-01','[)'),'DE','primary','dv:noinput','loc')`,
      );
      await client.query('COMMIT'); // DEFERRED-Trigger muss hier abbrechen
    } catch {
      rejected = true;
      try {
        await client.query('ROLLBACK');
      } catch {
        /* Transaktion bereits beendet */
      }
    } finally {
      client.release();
    }
    expect(rejected).toBe(true);
  });
});
