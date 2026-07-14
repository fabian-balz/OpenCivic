// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// a11y-Gate (ADR-0022). Nutzt den vorinstallierten Chromium (kein Download).
// Server (API + SSR-Web) werden extern von scripts/a11y.sh gestartet.

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.WEB_BASE_URL ?? 'http://127.0.0.1:3000',
    // Lokal: vorinstallierter Chromium via PW_CHROMIUM. In CI ungesetzt → Playwright nutzt den
    // per `playwright install chromium` bereitgestellten Browser.
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM || undefined,
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
