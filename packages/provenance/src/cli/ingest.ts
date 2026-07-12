// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// CLI-Einstieg für den OpenBudget-Ingest.

import { runIngest } from '../ingest.ts';
import { closePool } from '../db.ts';

runIngest()
  .then(async (res) => {
    console.log('Ingest abgeschlossen:');
    console.log(`  source_version : ${res.sourceVersionId}`);
    console.log(`  dataset_version: ${res.datasetVersionId}`);
    console.log(`  statements     : ${res.statementCount}`);
    console.log(`  content_hash   : ${res.contentHash}`);
    await closePool();
  })
  .catch(async (err) => {
    await closePool();
    console.error('Ingest fehlgeschlagen:', err);
    process.exit(1);
  });
