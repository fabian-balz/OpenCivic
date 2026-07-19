// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Belegt, dass die API OpenTelemetry-Spans je Request erzeugt (ADR-0026).

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import type { FastifyInstance } from 'fastify';
import { setupTelemetry } from '../src/telemetry.ts';
import { buildApp } from '../src/app.ts';

const exporter = new InMemorySpanExporter();
let app: FastifyInstance;
let provider: ReturnType<typeof setupTelemetry>;

beforeAll(async () => {
  provider = setupTelemetry(exporter);
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await provider.shutdown();
});

describe('Observability', () => {
  it('erzeugt einen Server-Span mit Methode, Pfad und Statuscode', async () => {
    exporter.reset();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBeGreaterThan(0);
    const span = spans.find((s) => s.name.includes('/health'));
    expect(span, 'kein Span für /health').toBeDefined();
    expect(span!.attributes['http.response.status_code']).toBe(200);
    expect(span!.attributes['http.request.method']).toBe('GET');
  });
});
