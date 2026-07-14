// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import { buildApp } from './app.ts';
import { setupTelemetry } from './telemetry.ts';
import { closePool } from '@opencivic/provenance';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '127.0.0.1';

// OpenTelemetry aktivieren, sofern nicht abgeschaltet (Solo darf minimal fahren, R9).
const provider = process.env.OTEL_SDK_DISABLED === 'true' ? undefined : setupTelemetry();

// Strukturiertes Logging (JSON) via Fastify/pino.
const app = await buildApp(undefined, { logger: true });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Graceful Shutdown');
  await app.close();
  await provider?.shutdown().catch(() => {});
  await closePool();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

app
  .listen({ port: PORT, host: HOST })
  .then((addr) => app.log.info(`OpenCivic API läuft auf ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
