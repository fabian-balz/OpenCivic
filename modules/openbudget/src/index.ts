// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// OpenBudget-Fachmodul (ADR-0003): besitzt seine Domänen-Routen und nutzt den Provenance-Kern.
// Die Routen werden über ein Fastify-Plugin beigesteuert — der Erweiterungspunkt der Plattform.

import type { FastifyPluginAsync } from 'fastify';
import type { ModuleManifest } from '@opencivic/module-sdk';
import { listBudgetStatements } from '@opencivic/provenance';

const apiPlugin: FastifyPluginAsync = async (app) => {
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
};

const manifest: ModuleManifest = {
  id: 'openbudget',
  title: 'OpenBudget',
  version: '0.1.0',
  apiPlugin,
};

export default manifest;
