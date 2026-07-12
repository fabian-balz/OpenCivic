<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Datenquelle: `bundeshaushalt-2025-excerpt.csv`

> ⚠️ **Wichtig — kein amtliches Dokument.** Diese CSV ist ein **illustratives, synthetisches
> Beispiel-Sample** zu Entwicklungs- und Testzwecken für das OpenBudget-MVP. Die Zahlen sind
> **frei erfunden** und stellen **keine amtlichen Haushaltsdaten** dar. Sie dienen ausschließlich
> dazu, den vertikalen Durchstich (Import → Provenance → API → Frontend) reproduzierbar zu
> demonstrieren.

## Warum ein Sample statt Live-Daten?

Für den ersten Walking Skeleton (Roadmap Phase 2) ist ein committetes Sample die ehrliche Wahl:

- **Reproduzierbarkeit** (Leitprinzip 4): Der Import liefert bei jedem Lauf dasselbe Ergebnis,
  unabhängig von Netz oder Portal-Verfügbarkeit.
- **Testbarkeit** (QA6): Der komplette Datenfluss ist deterministisch prüfbar.
- **Kein Rechte-/Link-Rot-Risiko im MVP** (R3/R4).

Die Struktur bildet die reale Systematik des Bundeshaushalts nach (Einzelplan → Kapitel → Titel),
sodass der Connector später **ohne Modelländerung** auf die echte Quelle umgestellt werden kann.

## Struktur (Spalten)

| Spalte | Bedeutung |
|---|---|
| `epl` | Einzelplan-Nummer (z. B. 06) |
| `epl_bezeichnung` | Bezeichnung des Einzelplans/Ressorts |
| `kapitel` | Kapitel innerhalb des Einzelplans |
| `titel` | Haushaltstitel |
| `titelart` | Art (Zuschuss, Investition, …) |
| `zweckbestimmung` | Zweckbestimmung des Titels |
| `soll_2025_eur` | Ansatz (Soll) für das Haushaltsjahr 2025 in Euro |
| `jurisdiction_ags` | Jurisdiktion (hier `DE` = Bund) |

## Spätere echte Quelle (Ausblick)

Der reale Connector zielt auf das offene Haushaltsportal des Bundes (z. B. maschinenlesbare
Datensätze des Bundeshaushalts). Bei Umstellung bleibt das Provenance-Modell unverändert; es ändert
sich nur, woher der Connector die Bronze-Rohdaten bezieht — Herkunft, Abrufzeitpunkt, Hash und Lizenz
werden dann von der echten Quelle übernommen.
