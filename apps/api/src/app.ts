// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// OpenCivic-API: REST + OpenAPI 3.1 (ADR-0012), URI-Pfad-Major-Versionierung /v1 (ADR-0013).
// Jede fakthaltige Antwort trägt einen Provenance-Verweis — der Quellenzwang ist an der
// Schnittstelle sichtbar (QA1, Leitprinzip 2).

import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import { listBudgetStatements, getStatement, resolveProvenance } from '@opencivic/provenance';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'OpenCivic API',
        version: '1.0.0',
        description:
          'Öffentliche, quellenbelegte API für OpenBudget. Jede Aussage ist über /v1/provenance/{id} bis zur Quelle nachvollziehbar.',
      },
      servers: [{ url: '/' }],
    },
  });

  app.get('/health', { schema: { hide: true } }, async () => ({ status: 'ok' }));

  app.get('/openapi.json', { schema: { hide: true } }, async () => app.swagger());

  // Liste der aktuellen Budget-Aussagen, optional volltextgefiltert (Postgres-FTS, ADR-0015).
  app.get(
    '/v1/budget/statements',
    {
      schema: {
        description: 'Aktuelle OpenBudget-Aussagen; optionale Volltextsuche via q.',
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Volltext-Suchbegriff' },
            limit: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
          },
        },
      },
    },
    async (req) => {
      const { q, limit } = req.query as { q?: string; limit?: number };
      const items = await listBudgetStatements({ q, limit });
      return {
        count: items.length,
        items: items.map((s) => ({ ...s, provenance: { href: `/v1/provenance/${s.id}` } })),
      };
    },
  );

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
