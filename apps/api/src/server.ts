// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import { buildApp } from './app.ts';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '127.0.0.1';

const app = await buildApp();
app
  .listen({ port: PORT, host: HOST })
  .then((addr) => console.log(`OpenCivic API läuft auf ${addr}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
