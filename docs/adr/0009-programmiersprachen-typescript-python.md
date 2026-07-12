<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0009 — Programmiersprachen: TypeScript (primär) + Python (gebunden auf Connectors)

- **Status:** Accepted
- **Datum:** 2026-07-09
- **Bezug:** Entscheidungsprinzip P5 (wenige Sprachen, klar begründet), P1 (boring & bewährt);
  Risiken R7 (Bus-Factor/Finanzierung), R9 (Komplexität schreckt Contributor ab); Qualitätsattribut
  QA1 (Nachvollziehbarkeit); [ADR-0003](0003-plattformkern-und-modulschnitt.md) (Modulschnitt)

## Kontext und Problemstellung

OpenCivic ist ein community-getriebenes Projekt für 10+ Jahre. Die Sprachwahl muss gleichzeitig
(a) Sprachwildwuchs vermeiden (P5), (b) einen möglichst breiten, langfristig verfügbaren
Contributor-Pool ansprechen (R7/R9 sind explizite Risiken unseres eigenen Fundaments — nicht
abstrakte Softwarequalität, sondern Projektüberleben), (c) die Ende-zu-Ende-Typsicherheit des
Provenance-Contracts (QA1) unterstützen, und (d) für die Domäne der OpenData-Connectors
(Behörden-Datenformate: CSV/XML/PDF/Excel) praktikabel sein.

## Betrachtete Optionen

- **Option A — Go durchgängig** für den gesamten Backend-Teil.
- **Option B — TypeScript durchgängig**, auch für Connectors.
- **Option C — TypeScript primär (Kern, Fachmodule, Frontend, SDKs) + Python gebunden auf
  OpenData-Connectors**, entlang der bestehenden Pipeline-Grenze aus ADR-0003.

## Entscheidung

**Option C.**

TypeScript trägt den weit überwiegenden Teil des Systems — Plattformkern, Fachmodule, Frontend,
generierte SDKs. Das ist die einzige realistische Ein-Sprachen-Lösung, da das Frontend ohnehin
JavaScript/TypeScript benötigt; ein Go- oder Python-Backend würde zwangsläufig zwei Sprachen
bedeuten, ohne den Contributor-Pool-Vorteil einer einzigen Sprache zu erhalten.

Python wird **bewusst begrenzt** auf OpenData-Connectors zugelassen: Diese sind bereits durch
[ADR-0003](0003-plattformkern-und-modulschnitt.md) als isolierte Einheiten geschnitten, die nur
über die Pipeline-Orchestrierungs-Schnittstelle mit dem Kern sprechen (Bronze-Snapshots rein,
kein direkter Codeaufruf). Die Sprachgrenze verläuft exakt entlang dieser bestehenden
Architekturnaht — keine neue Kopplungsfläche, kein Sprachwildwuchs quer durch ein Modul.
Begründung für Python speziell hier: Kein anderes Ökosystem deckt Behörden-Datenformate
(CSV/XML/PDF/Excel-Parsing, pandas, geopandas für OpenStatistics-Geodaten) vergleichbar gut ab.
Da Connectors der wahrscheinlichste „erste Beitrag" neuer Freiwilliger sind, zählt hier
Domänenpassung mehr als Stack-Einheitlichkeit.

## Konsequenzen

- **Positiv:** Größtmöglicher Contributor-Pool für den Hauptteil des Systems (mitigiert R7/R9);
  geteilte Typen zwischen Backend und Frontend machen den Provenance-Contract compilergeprüft
  (QA1); Connectors profitieren vom besten verfügbaren Werkzeug für ihre Domäne.
- **Negativ / Kosten:** Zwei Toolchains/CI-Pfade statt einer (TS + Python-Lint/Test/Package);
  Contributor, die sowohl Kern als auch Connectors bearbeiten wollen, brauchen beide Sprachen —
  ein bewusst akzeptierter, eng begrenzter Fall.
- **Absicherung gegen Wildwuchs:** Jede künftige dritte Sprache muss sich einzeln rechtfertigen
  (P5) und braucht einen eigenen ADR mit derselben Beweislast wie hier für Python.

## Vor- und Nachteile der Optionen

### Option A — Go durchgängig

- 👍 Self-Hosting als Single-Binary; kleinere Dependency-Bäume und damit geringere
  Angriffsfläche (R11); strikte Backward-Compat-Garantie (Go-1-Versprechen) unterstützt QA3.
- 👎 Kleinerer Contributor-Pool als TypeScript — direktes Gegenargument zu R7/R9; da das Frontend
  ohnehin TypeScript benötigt, bedeutet Go de facto ebenfalls zwei Sprachen, ohne die geteilten
  Typen zwischen Backend und Frontend zu bekommen; der Single-Binary-Vorteil ist teilweise
  entwertet, weil laut [ADR-0002](0002-architekturstil-modular-monolith.md) ohnehin containerisiert
  deployt wird — der Betreiber installiert nie manuell eine Laufzeitumgebung.

### Option B — TypeScript durchgängig (auch Connectors)

- 👍 Maximale Sprachreinheit, eine einzige Toolchain für das gesamte Projekt.
- 👎 Deutlich schwächeres Ökosystem für Behörden-Datenformat-Parsing als Python; verteuert genau
  die Beitragsart (neue Connectoren), die am häufigsten von neuen Freiwilligen geleistet wird —
  kontraproduktiv gegenüber R9.

### Option C — TypeScript primär + Python gebunden auf Connectors *(gewählt)*

- 👍 Kombiniert größten Contributor-Pool für den Kern mit dem besten Werkzeug für die
  Connector-Domäne; Sprachgrenze folgt einer bestehenden Architekturgrenze statt sie neu zu
  schaffen.
- 👎 Zwei Toolchains zu pflegen — akzeptiert, weil eng auf einen klar abgegrenzten Modulbereich
  begrenzt.
