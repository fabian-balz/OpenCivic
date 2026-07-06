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
