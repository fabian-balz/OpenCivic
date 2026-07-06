<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# OpenCivic

> **Staatliches Handeln verständlich, transparent und nachvollziehbar machen — faktenbasiert, quellenbelegt, ohne politische Meinung.**

OpenCivic ist eine langfristig angelegte, community-getriebene Open-Source-Plattform.
Sie ist die offene Infrastruktur-Schicht zwischen amtlichen Rohdaten (Haushalte, Gesetze,
Statistiken, Verwaltungsprozesse) und dem Verständnis der Öffentlichkeit — ein digitales
Gemeingut im Geist von OpenStreetMap und Wikipedia.

**Leitsatz über allem:** *Zeige die Quelle, nicht die Meinung.* Jede dargestellte Information
verweist nachvollziehbar auf ein amtliches Original.

---

## Status

🚧 **Phase 0 — Konzeption.** Das Projekt befindet sich in der Fundamentphase. Es gibt noch
keinen Anwendungscode. Aktuell entstehen die strategischen Grundlagen und Architektur­entscheidungen.

## Was hier (noch) nicht ist — Nicht-Ziele

OpenCivic ist **keine** Meinungs-, Bewertungs- oder Faktencheck-Plattform, **kein** soziales
Netzwerk, **keine** Prognose-KI, **kein** Data Broker und **kein** Ersatz für amtliche
Primärquellen. Details in [`docs/foundation/05-nicht-ziele.md`](docs/foundation/05-nicht-ziele.md).

## Geplante Module

| Modul | Zweck |
|---|---|
| **OpenData** | Reproduzierbare Importer für öffentliche Daten (Fundament aller Module) |
| **OpenBudget** | Öffentliche Haushalte verständlich darstellen (erstes MVP-Modul) |
| **OpenLaw** | Gesetze verständlich und versioniert darstellen |
| **OpenStatistics** | Amtliche Statistiken zugänglich machen |
| **OpenMunicipality** | Kommunale Transparenz & Self-Hosting für Kommunen |
| **Process Explorer** | Verwaltungsprozesse visualisieren |
| **Bureaucracy Explorer** | Zuständigkeiten und Verwaltungsstrukturen navigierbar machen |
| **CivicAI** | Quellenbelegte KI-Assistenten (striktes RAG, keine Antwort ohne Beleg) |

## Dokumentation

Das strategische Fundament (Vision → Roadmap) liegt in
[`docs/foundation/`](docs/foundation/). Empfohlener Einstieg:
[`docs/foundation/README.md`](docs/foundation/README.md).

Die **Architektur** liegt in [`docs/architecture/`](docs/architecture/) — Einstieg:
[Makro-Architektur & Modulschnitt](docs/architecture/01-macro-architecture.md).

Architektur- und Technologieentscheidungen werden als **ADRs** unter
[`docs/adr/`](docs/adr/) dokumentiert — jede Entscheidung begründet, mit Alternativen.

## Mitmachen

OpenCivic ist community-getrieben und lebt von Beiträgen: Code, Daten-Konnektoren,
Übersetzungen und Dokumentation. Contribution-Richtlinien und Governance folgen in Phase 0/1.

## Lizenz

OpenCivic nutzt ein **Split-Lizenzmodell** (siehe [`LICENSING.md`](LICENSING.md) und
[ADR-0001](docs/adr/0001-lizenzmodell-split.md)):

- **Anwendungen & Server:** `AGPL-3.0-or-later` — schützt das Gemeingut vor proprietärer
  SaaS-Übernahme.
- **Bibliotheken, SDKs, API-Clients & Datenmodelle/Schemata:** `Apache-2.0` — maximale
  Verbreitung in Verwaltung, Forschung und Wirtschaft.

Jede Datei trägt ihre Lizenz per SPDX-Header ([REUSE](https://reuse.software/)-konform).
