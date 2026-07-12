// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // DB-Integrationstests teilen sich eine Datenbank → nicht parallel über Dateien laufen lassen.
    fileParallelism: false,
  },
});
