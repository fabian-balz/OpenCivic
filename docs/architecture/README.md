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

Weitere Topics folgen als eigene Dokumente/ADRs (Sprachen/Backend/Frontend, API-Design &
-Versionierung, Datenbanken/Suche/Vektor, ETL/Events, Auth, KI/RAG, Infra/IaC/CI-CD/
Observability/Security, Plugin-System, i18n/a11y/Performance/Offline/SEO).

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
