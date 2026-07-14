// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// OpenCivic-API: REST + OpenAPI 3.1 (ADR-0012), URI-Pfad-Major-Versionierung /v1 (ADR-0013).
// Jede fakthaltige Antwort trägt einen Provenance-Verweis — der Quellenzwang ist an der
// Schnittstelle sichtbar (QA1, Leitprinzip 2).

import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import { getStatement, resolveProvenance } from '@opencivic/provenance';
import { ModuleRegistry } from '@opencivic/module-sdk';
import openbudget from '@opencivic/module-openbudget';
import { instrumentApp } from './telemetry.ts';

/** Registriert die aktiven Fachmodule (ADR-0003/0020). Neue Module hier ergänzen. */
export function buildRegistry(): ModuleRegistry {
  return new ModuleRegistry().register(openbudget);
}

export async function buildApp(
  registry: ModuleRegistry = buildRegistry(),
  options: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });

  // Observability zuerst, damit jeder Request einen Span erhält (ADR-0026).
  instrumentApp(app);

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'OpenCivic API',
        version: '1.0.0',
        description:
          'Öffentliche, quellenbelegte API. Jede Aussage ist über /v1/provenance/{id} bis zur Quelle nachvollziehbar.',
      },
      servers: [{ url: '/' }],
    },
  });

  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    modules: registry.all().map((m) => ({ id: m.id, version: m.version })),
  }));

  app.get('/openapi.json', { schema: { hide: true } }, async () => app.swagger());

  // Fachmodule steuern ihre Domänen-Routen als Fastify-Plugins bei (Extension-Point, ADR-0020).
  for (const module of registry.all()) {
    await app.register(module.apiPlugin);
  }

  // Provenance-Kernrouten (modulübergreifend).
  app.get('/v1/statements/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const s = await getStatement(id);
    if (!s) return reply.code(404).send({ error: 'not_found', id });
    return { ...s, provenance: { href: `/v1/provenance/${s.id}` } };
  });

  // Vollständiger Beleg: menschenlesbares Citation-Objekt + W3C-PROV-JSON (ADR-0006).
  app.get('/v1/provenance/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await resolveProvenance(id);
    if (!res) return reply.code(404).send({ error: 'not_found', id });
    return res;
  });

  return app;
}
