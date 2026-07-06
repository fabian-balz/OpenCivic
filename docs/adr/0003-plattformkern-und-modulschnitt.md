<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0003 — Plattformkern vs. Fachmodule (Modulschnitt)

- **Status:** Accepted
- **Datum:** 2026-07-06
- **Bezug:** Architekturziele 1, 3, 10; Qualitätsattribute QA1 (Provenance), QA3 (Wartbarkeit),
  QA10 (i18n); Leitprinzipien 2 (Quellenzwang), 7 (Modularität)

## Kontext und Problemstellung

Der [modulare Monolith](0002-architekturstil-modular-monolith.md) braucht einen klaren Schnitt:
Was ist **stabiler Plattformkern**, was ist **austauschbares Fachmodul**? Ein falscher Schnitt
führt entweder zu einem aufgeblähten Kern (unbeweglich) oder zu Fachmodulen, die
Querschnittsfunktionen (v. a. Provenance) je eigen und uneinheitlich nachbauen — was den
Quellenzwang (Leitprinzip 2) und die Nachvollziehbarkeit (QA1) unterläuft.

## Betrachtete Optionen

- **Option A — Dünner Kern (nur Gateway/Auth), alles andere im Modul:** Module bringen Provenance,
  Suche, i18n selbst mit.
- **Option B — Dicker Kern (auch Domänenlogik):** der Kern kennt Haushalte, Gesetze etc.
- **Option C — Kern = geteilte Fähigkeiten, Module = Domäne:** der Kern stellt Provenance,
  Datensatz-Versionierung, Identity, Suche, Localization, Orchestrierung, Event-Bus, Registry und
  Observability bereit; Fachmodule besitzen ausschließlich ihre Domäne und nutzen den Kern.

## Entscheidung

**Option C.**

**Plattformkern (stabil, langsam veränderlich):**
Identity & Access · **Provenance & Source Registry** (Herz) · Dataset-/Versionierungs-Registry
(Bronze/Silver/Gold-Metadaten, Hashes, Lineage) · Such-Abstraktion · API-Gateway/BFF · Event-Bus
(Outbox) · Pipeline-Orchestrierungs-Schnittstelle · Localization (Locale/Jurisdiktion/Währung/
Kalender) · Plugin-/Modul-Registry · Observability.

**Fachmodule (schnell veränderlich, ersetzbar):**
OpenData (Connector-SDK + Connector-Plugins) · **OpenBudget** (MVP) · später OpenLaw,
OpenStatistics, OpenMunicipality, Process-Explorer, Bureaucracy-Explorer, CivicAI.

**Regeln:**
1. Ein Fachmodul besitzt sein Domänenmodell, seine Connectoren, seine **versionierte** API-Fläche
   und seine UI-Views.
2. Ein Fachmodul **muss** Provenance, Identity, Search und Localization des Kerns nutzen — kein
   Eigenbau dieser Querschnitte.
3. Der Kern enthält **keine** Domänenlogik (weiß nichts über Haushaltstitel oder Paragraphen).
4. Module sehen einander nur über öffentliche Contracts/Events.

Begründung: So bleibt der Kern klein und langlebig (QA3, P1), während der Quellenzwang **einmal
zentral** korrekt implementiert und von allen genutzt wird (QA1). Die Jurisdiktions-Achse sitzt im
Kern (Localization) — passend zur DACH-first/i18n-ready-Entscheidung (QA10).

## Konsequenzen

- **Positiv:** Einheitliche Provenance & i18n über alle Module; Module unabhängig entwickel-,
  test- und ersetzbar; neue Module erben die Plattformfähigkeiten.
- **Negativ / Kosten:** Der Kern wird zur geteilten Abhängigkeit — Änderungen an Kern-Contracts
  brauchen sorgfältige Versionierung und betreffen viele Module (Gegenmaßnahme: stabile,
  versionierte Kern-Contracts; Monorepo für atomare Cross-Cuts, siehe
  [ADR-0005](0005-repo-strategie-monorepo.md)).
- **Offen:** die genaue innere Struktur des Provenance-Modells ist ein eigener, nächster Topic.

## Vor- und Nachteile der Optionen

### Option A — Dünner Kern

- 👍 Module maximal autonom.
- 👎 Provenance/i18n werden n-fach uneinheitlich nachgebaut → gefährdet QA1 und Konsistenz;
  Duplizierung widerspricht Wartbarkeit (QA3).

### Option B — Dicker Kern mit Domänenlogik

- 👍 Weniger Module am Anfang.
- 👎 Kern wird unbeweglich und muss sich mit jeder Domäne ändern; verletzt Modularität/
  Ersetzbarkeit (Leitprinzip 7); schlechte Langlebigkeit.

### Option C — Kern = Fähigkeiten, Module = Domäne *(gewählt)*

- 👍 Stabiler, kleiner Kern; zentral garantierter Quellenzwang; austauschbare Module.
- 👎 Geteilte Kern-Contracts erfordern Versionierungsdisziplin.
