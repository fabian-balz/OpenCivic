// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Observability (ADR-0026): OpenTelemetry-Tracing über einen offenen, herstellerneutralen
// Standard (P6). Der Exporter ist austauschbar — jeder Betreiber kann ein beliebiges
// OTel-Backend anschließen (Grafana-Stack als Referenz, P3).

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, ConsoleSpanExporter, type SpanExporter } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode, type Tracer } from '@opentelemetry/api';
import type { FastifyInstance, FastifyRequest } from 'fastify';

export const TRACER_NAME = 'opencivic-api';

// Aktiver Provider (falls initialisiert). Wir holen den Tracer direkt vom Provider-Objekt statt
// über die globale Registrierung — das ist robust gegenüber mehreren @opentelemetry/api-Instanzen.
let activeProvider: NodeTracerProvider | undefined;

/**
 * Initialisiert den TracerProvider. Ohne Aufruf sind Spans No-ops (kein Zwang im Solo-Profil, R9).
 * Exporter ist injizierbar (Tests nutzen einen In-Memory-Exporter).
 */
export function setupTelemetry(exporter: SpanExporter = new ConsoleSpanExporter()): NodeTracerProvider {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: TRACER_NAME,
      [ATTR_SERVICE_VERSION]: '0.1.0',
    }),
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  activeProvider = provider;
  return provider;
}

function getTracer(): Tracer {
  return (activeProvider ?? trace.getTracerProvider()).getTracer(TRACER_NAME);
}

const spans = new WeakMap<FastifyRequest, ReturnType<Tracer['startSpan']>>();

/**
 * Instrumentiert die Root-App: ein Server-Span je Request (Methode, Route, Statuscode).
 * Direkt auf der Root-Instanz — Fastify-Root-Hooks propagieren zu allen (auch später
 * registrierten) Routen; ein gekapseltes Plugin würde die Modul-Routen NICHT erfassen.
 */
export function instrumentApp(app: FastifyInstance): void {
  const tracer = getTracer();

  app.addHook('onRequest', async (req) => {
    const span = tracer.startSpan(`${req.method} ${req.url}`, {
      attributes: { 'http.request.method': req.method, 'url.path': req.url },
    });
    spans.set(req, span);
  });

  app.addHook('onResponse', async (req, reply) => {
    const span = spans.get(req);
    if (span) {
      span.setAttribute('http.response.status_code', reply.statusCode);
      if (reply.statusCode >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
      spans.delete(req);
    }
  });

  app.addHook('onError', async (req, _reply, err) => {
    const span = spans.get(req);
    if (span) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    }
  });
}
