<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# OpenCivic — Strategisches Fundament (Phase 0)

Dieses Verzeichnis enthält die strategischen Grundlagen von OpenCivic. Sie stehen **vor** jeder
Architektur- und Technologieentscheidung und sind der Maßstab, an dem alle späteren Entscheidungen
(dokumentiert als [ADRs](../adr/)) gemessen werden.

> **Kein Code, keine finale Architektur in dieser Phase.** Zuerst gemeinsames Verständnis.

## Kapitel

| # | Kapitel | Inhalt |
|---|---|---|
| 01 | [Vision](01-vision.md) | Wohin wir langfristig wollen |
| 02 | [Mission](02-mission.md) | Was wir konkret tun |
| 03 | [Leitprinzipien](03-leitprinzipien.md) | Unverhandelbare Grundsätze |
| 04 | [Zielgruppen](04-zielgruppen.md) | Für wen wir bauen |
| 05 | [Nicht-Ziele](05-nicht-ziele.md) | Was wir bewusst *nicht* tun |
| 06 | [Qualitätsattribute](06-qualitaetsattribute.md) | Priorisierte „-ilities" |
| 07 | [Architekturziele](07-architekturziele.md) | Strukturelle Zielbilder |
| 08 | [Technische Entscheidungsprinzipien](08-entscheidungsprinzipien.md) | Wie wir Technik wählen |
| 09 | [Risiken](09-risiken.md) | Was schiefgehen kann + Gegenmaßnahmen |
| 10 | [Roadmap](10-roadmap.md) | Ergebnisorientierte Phasen |

## Getroffene strategische Entscheidungen

Drei Weichenstellungen sind gesetzt und prägen die Architekturphase:

- **Lizenzmodell: Split** — AGPL-3.0 (Apps/Server) + Apache-2.0 (Libs/SDKs/Datenmodelle).
  Siehe [ADR-0001](../adr/0001-lizenzmodell-split.md) und [`LICENSING.md`](../../LICENSING.md).
- **Fokus: DACH-first, i18n-ready** — konkret an Deutschland (ggf. AT/CH) ausgerichtet,
  Architektur aber ab Tag 1 internationalisierbar.
- **Erst-Modul (MVP): OpenData → OpenBudget** — vertikaler Durchstich als Referenzarchitektur.

## Nächster Schritt

**Phase 1 — Architektur & Referenz-Datenmodell:** Plattformkern, Provenance-Datenmodell,
API-Design-Standards und der gesamte Tech-Stack werden als begründete ADRs mit Alternativen
und Vor-/Nachteilen entworfen.
