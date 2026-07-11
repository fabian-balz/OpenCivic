<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# OpenCivic — Architektur

Dieses Verzeichnis beschreibt die Architektur von OpenCivic. Es baut direkt auf dem
[strategischen Fundament](../foundation/) auf: Jede Architekturaussage ist an ein
[Qualitätsattribut](../foundation/06-qualitaetsattribute.md) oder
[Entscheidungsprinzip](../foundation/08-entscheidungsprinzipien.md) rückgebunden.

> **Status:** Phase 1 (Architektur). Noch kein Anwendungscode — Architekturentwurf und
> Entscheidungen. Wir arbeiten iterativ, Topic für Topic.

## Aufbau

| Dokument | Inhalt |
|---|---|
| [01 — Makro-Architektur & Modulschnitt](01-macro-architecture.md) | Architekturstil, Plattformkern vs. Fachmodule, kanonischer Datenfluss, Modul-Kommunikation, Deployment-Profile |
| [02 — Provenance-Datenmodell](02-provenance-model.md) | Quelle → Version → Aussage; W3C-PROV-Mapping, Bitemporalität, Lifecycle, Jurisdiktions-/Referenzachse, Zitierbarkeit |
| [03 — Programmiersprachen, Backend, Frontend](03-languages-backend-frontend.md) | TypeScript + Python, Node.js/Fastify, SvelteKit — begründet gegen die priorisierten Qualitätsattribute |
| [04 — API-Design & -Versionierung](04-api-design.md) | REST + OpenAPI 3.1, Provenance/Citation an der Schnittstelle, URI-Pfad-Major-Versionierung |
| [05 — Datenbanken, Suche & Vektorsuche](05-data-storage.md) | PostgreSQL als Kern-DB (bitemporal, JSONB, CTEs), pgvector, Postgres-FTS → OpenSearch/Qdrant |
| [06 — ETL-Orchestrierung & Event-System](06-etl-events.md) | In-Prozess-Orchestrierung, Python-Connectors als Subprozess, Postgres-Outbox → NATS |
| [07 — Authentifizierung & Autorisierung](07-auth.md) | OIDC + pluggable IdP, RBAC je Modul, Datensparsamkeit |
| [08 — KI-Integration & RAG (CivicAI)](08-ki-rag.md) | Provider-abstrahierte LLM-Schicht, striktes Zitier-RAG mit Post-Generation-Validator |
| [09 — Plugin- & Erweiterungssystem](09-plugin-system.md) | Fastify-Plugin-Mechanismus als Extension-Point, Manifest-Contract, kein Runtime-Hot-Loading |
| [10 — i18n, a11y, Performance, Offline & SEO](10-i18n-a11y-performance.md) | ICU/Intl, WCAG-2.2-AA-CI-Gate, Core-Web-Vitals, Read-Only-PWA, schema.org aus Provenance |
| [11 — Repo- & Build-System](11-repo-build-system.md) | pnpm-Workspaces + Nx, Poetry — vertieft die Monorepo-Strategie |
| [12 — Infrastruktur, IaC, CI/CD, Observability & Security](12-infrastructure-operations.md) | OpenTofu + Kubernetes/k3s, portable CI/CD, OpenTelemetry/Grafana, SBOM/Sigstore |

Damit ist die Architektur-Phase (Phase 1) inhaltlich vollständig für den MVP-Durchstich.

## Methodik

- **C4-Modell** (Kontext → Container → Komponente) zur Beschreibung, dargestellt mit **Mermaid**
  (rendert direkt auf GitHub, ist reiner Text und damit versionier- und diff-bar — offene
  Standards, Prinzip 6 & 2).
- **ADRs** ([`../adr/`](../adr/)) halten jede tragende Entscheidung fest — mit Kontext,
  betrachteten Optionen und Vor-/Nachteilen. Diagramme zeigen das *Was*, ADRs begründen das *Warum*.

## Tragende Architektur-Entscheidungen

| ADR | Entscheidung |
|---|---|
| [0002](../adr/0002-architekturstil-modular-monolith.md) | Modularer Monolith mit Service-Extraktions-Nähten |
| [0003](../adr/0003-plattformkern-und-modulschnitt.md) | Plattformkern vs. Fachmodule (Modulschnitt) |
| [0004](../adr/0004-kanonischer-datenfluss-medallion-provenance.md) | Kanonischer Datenfluss: Medallion + Provenance-First |
| [0005](../adr/0005-repo-strategie-monorepo.md) | Repo-Strategie: Monorepo (provisorisch) |
| [0006](../adr/0006-provenance-modell-w3c-prov.md) | Provenance-Modell auf Basis von W3C PROV |
| [0007](../adr/0007-bitemporal-append-only-lifecycle.md) | Bitemporalität, Append-Only-Historie & Statement-Lifecycle |
| [0008](../adr/0008-jurisdiktions-und-referenzdaten-achse.md) | Jurisdiktions- und Referenzdaten-Achse |
| [0009](../adr/0009-programmiersprachen-typescript-python.md) | Programmiersprachen: TypeScript (primär) + Python (Connectors) |
| [0010](../adr/0010-backend-framework-nodejs-fastify.md) | Backend-Laufzeit & Framework: Node.js + Fastify |
| [0011](../adr/0011-frontend-framework-sveltekit.md) | Frontend-Framework: SvelteKit |
| [0012](../adr/0012-api-stil-rest-openapi.md) | API-Stil & Contract-Format: REST + OpenAPI 3.1 |
| [0013](../adr/0013-api-versionierung.md) | API-Versionierung: URI-Pfad-Major + additive Evolution |
| [0014](../adr/0014-primaere-datenbank-postgresql.md) | Primäre Datenbank: PostgreSQL |
| [0015](../adr/0015-suche-und-vektorsuche.md) | Suche & Vektorsuche: Postgres-FTS/pgvector → OpenSearch/Qdrant |
| [0016](../adr/0016-pipeline-orchestrierung.md) | Pipeline-Orchestrierung: in-Prozess, Python-Connectors als Subprozess |
| [0017](../adr/0017-event-bus.md) | Event-Bus: Postgres-Outbox → NATS |
| [0018](../adr/0018-authn-authz-oidc-rbac.md) | AuthN/AuthZ: OIDC + pluggable IdP, RBAC |
| [0019](../adr/0019-llm-abstraktion-striktes-rag.md) | LLM-Provider-Abstraktion & striktes Zitier-RAG |
| [0020](../adr/0020-plugin-erweiterungsmechanismus.md) | Plugin-Erweiterungsmechanismus (Fastify + Manifest) |
| [0021](../adr/0021-i18n-icu-intl.md) | Internationalisierung: ICU MessageFormat + Web-Intl |
| [0022](../adr/0022-web-plattform-baseline.md) | Web-Plattform-Baseline: a11y/Performance/Offline/SEO |
| [0023](../adr/0023-build-task-tooling.md) | Build-/Task-Tooling: pnpm-Workspaces + Nx, Poetry |
| [0024](../adr/0024-iac-kubernetes.md) | IaC & Orchestrierung: OpenTofu + Kubernetes/k3s |
| [0025](../adr/0025-ci-cd.md) | CI/CD: GitHub Actions mit portabler CI-Logik |
| [0026](../adr/0026-observability-opentelemetry.md) | Observability: OpenTelemetry + Grafana-Stack |
| [0027](../adr/0027-security-baseline.md) | Security-Baseline: SBOM, Scanning, Sigstore, reproduzierbare Builds |
