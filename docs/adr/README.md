<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Architecture Decision Records (ADRs)

Jede wichtige technische oder strukturelle Entscheidung wird hier als **ADR** dokumentiert —
begründet gegen die [Leitprinzipien](../foundation/03-leitprinzipien.md) und
[Entscheidungsprinzipien](../foundation/08-entscheidungsprinzipien.md), stets mit mindestens
einer ernsthaft betrachteten Alternative samt Vor- und Nachteilen.

## Format

Wir nutzen [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records).
Vorlage: [`template.md`](template.md).

## Konventionen

- Dateiname: `NNNN-kurztitel.md` (fortlaufende, nullgepolsterte Nummer).
- Status: `Proposed` → `Accepted` → ggf. `Deprecated`/`Superseded by NNNN`.
- Eine Entscheidung wird nicht editiert, sondern durch einen neuen ADR ersetzt (Nachvollziehbarkeit).

## Register

| ADR | Titel | Status |
|---|---|---|
| [0001](0001-lizenzmodell-split.md) | Split-Lizenzmodell (AGPL-3.0 + Apache-2.0) | Accepted |
| [0002](0002-architekturstil-modular-monolith.md) | Architekturstil: Modularer Monolith mit Extraktions-Nähten | Accepted |
| [0003](0003-plattformkern-und-modulschnitt.md) | Plattformkern vs. Fachmodule (Modulschnitt) | Accepted |
| [0004](0004-kanonischer-datenfluss-medallion-provenance.md) | Kanonischer Datenfluss: Medallion + Provenance-First | Accepted |
| [0005](0005-repo-strategie-monorepo.md) | Repo-Strategie: Monorepo | Accepted (provisorisch) |
| [0006](0006-provenance-modell-w3c-prov.md) | Provenance-Modell auf Basis von W3C PROV | Accepted |
| [0007](0007-bitemporal-append-only-lifecycle.md) | Bitemporalität, Append-Only-Historie & Statement-Lifecycle | Accepted |
| [0008](0008-jurisdiktions-und-referenzdaten-achse.md) | Jurisdiktions- und Referenzdaten-Achse | Accepted |
| [0009](0009-programmiersprachen-typescript-python.md) | Programmiersprachen: TypeScript (primär) + Python (Connectors) | Accepted |
| [0010](0010-backend-framework-nodejs-fastify.md) | Backend-Laufzeit & Framework: Node.js + Fastify | Accepted |
| [0011](0011-frontend-framework-sveltekit.md) | Frontend-Framework: SvelteKit | Accepted |
