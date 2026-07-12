// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Öffentliche API des Provenance-Kerns.

export { getPool, query, closePool } from './db.ts';
export { listBudgetStatements, getStatement, resolveProvenance } from './repository.ts';
export { runIngest } from './ingest.ts';
export type {
  Statement,
  Citation,
  ProvenanceResolution,
  ProvDocument,
  Agent,
  Jurisdiction,
} from './types.ts';
