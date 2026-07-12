// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// API-Integrationstest: bootet Fastify gegen die Test-DB und prüft, dass Budget-Aussagen
// ausgeliefert werden und ihre Provenance-Kette bis zum Quell-Hash auflösbar ist.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { runIngest, closePool } from '@opencivic/provenance';

let app: FastifyInstance;

beforeAll(async () => {
  await runIngest({ retrievedAt: '2026-02-01T09:00:00.000Z' });
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await closePool();
});

describe('OpenCivic API', () => {
  it('GET /health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /openapi.json liefert eine gültige OpenAPI-3.1-Spezifikation', async () => {
    const res = await app.inject({ method: 'GET', url: '/openapi.json' });
    expect(res.statusCode).toBe(200);
    const spec = res.json();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/v1/budget/statements']).toBeDefined();
  });

  it('GET /v1/budget/statements liefert Aussagen mit Provenance-Verweis', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/budget/statements' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.count).toBeGreaterThan(0);
    expect(body.items[0].provenance.href).toMatch(/^\/v1\/provenance\//);
  });

  it('Kette API → Provenance löst bis zum Quell-Hash auf (Quellenzwang end-to-end)', async () => {
    const list = await app.inject({ method: 'GET', url: '/v1/budget/statements?q=Kommunen' });
    const first = list.json().items[0];
    expect(first).toBeDefined();

    const prov = await app.inject({ method: 'GET', url: first.provenance.href });
    expect(prov.statusCode).toBe(200);
    const { citation } = prov.json();
    expect(citation.sourceVersion.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(citation.source.publisher.name).toContain('Sample');
  });

  it('GET /v1/provenance/:id für unbekannte ID → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/provenance/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });
});
