// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Verbindung zum Provenance-Store (PostgreSQL, ADR-0014). Verbindungszeichenfolge via DATABASE_URL.

import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | undefined;

/** Liefert den (lazily initialisierten) Connection-Pool. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgresql://postgres@127.0.0.1:5433/opencivic',
    });
  }
  return pool;
}

/** Führt eine parametrisierte Query aus. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params as never[]);
}

/** Schließt den Pool (für Tests/CLI-Ende). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
