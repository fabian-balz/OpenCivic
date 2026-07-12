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

🌱 **Phase 2 — MVP (Walking Skeleton).** Fundament (Vision → Roadmap) und Architektur (27 ADRs)
stehen. Der erste lauffähige, quellenbelegte Durchstich **OpenData → OpenBudget** ist umgesetzt:
Import-Pipeline → Provenance-Speicher → API → barrierefreies, mobiles Frontend → Suche. Siehe
[`docs/architecture/13-mvp-openbudget.md`](docs/architecture/13-mvp-openbudget.md).

## Schnellstart (lokal, ohne Docker)

Voraussetzungen: Node ≥ 22, pnpm, Python ≥ 3.11, lokales PostgreSQL 16.

```bash
make install      # Abhängigkeiten (pnpm; Poetry optional)
make db-up        # lokalen PostgreSQL-Cluster starten (Solo-Profil)
make migrate      # Datenbankschema anwenden
make ingest       # Beispiel-Haushalt importieren (Bronze → Statements mit Provenance)
make test         # vitest (Quellenzwang, Citation, Suche, API) + pytest (Connector)
make api          # API auf http://127.0.0.1:3001  (/v1/..., /openapi.json)
```

Web-Frontend: `make web-build`, dann `cd apps/web && OPENCIVIC_API_URL=http://127.0.0.1:3001 node build`
(SSR auf http://127.0.0.1:3000 — funktioniert auch ohne JavaScript).

`make verify` führt DB → Migration → Ingest → Tests am Stück aus.

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
