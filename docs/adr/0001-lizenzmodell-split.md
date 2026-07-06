<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0001 — Split-Lizenzmodell (AGPL-3.0 + Apache-2.0)

- **Status:** Accepted
- **Datum:** 2026-07-06
- **Bezug:** Leitprinzipien 3 (Radikale Offenheit), 7 (Modularität), 9 (Souveränität);
  Nicht-Ziele (kein proprietärer Single-Vendor-SaaS); Risiko R6 (Governance-Capture)

## Kontext und Problemstellung

OpenCivic ist als digitales Gemeingut für 10+ Jahre angelegt. Die Lizenzwahl muss zwei teils
gegensätzliche Kräfte ausbalancieren:

1. **Schutz des Gemeinguts** — verhindern, dass Dritte die Serversoftware nehmen, proprietär
   erweitern und als geschlossenen SaaS anbieten, ohne Verbesserungen zurückzugeben.
2. **Maximale Verbreitung** — Verwaltung, Forschung und Wirtschaft sollen die Datenmodelle,
   Schemata, SDKs und API-Clients möglichst reibungslos integrieren können; hier schrecken
   starke Copyleft-Pflichten ab und behindern Interoperabilität.

Eine einzige Lizenz für alles erfüllt immer nur eine dieser Kräfte gut.

## Betrachtete Optionen

- **Option A — AGPL-3.0 durchgängig:** stärkstes Copyleft für alles.
- **Option B — Apache-2.0 durchgängig:** permissiv für alles.
- **Option C — Split:** AGPL-3.0-or-later für Anwendungen/Server, Apache-2.0 für Bibliotheken,
  SDKs, API-Clients und Datenmodelle/Schemata.

## Entscheidung

**Option C (Split).**

- **`AGPL-3.0-or-later`** für **Anwendungen und Server** (die deploybaren Fachmodule und der
  Plattformkern). Das Netzwerk-Copyleft der AGPL schließt die „SaaS-Lücke" der GPL und schützt
  das Gemeingut gegen proprietäre Hosting-Übernahme (adressiert R6).
- **`Apache-2.0`** für **Bibliotheken, SDKs, API-Clients und Datenmodelle/Schemata**. Permissiv
  und mit ausdrücklicher Patentlizenz maximiert es Integration und Interoperabilität — genau dort,
  wo Verbreitung wichtiger ist als Copyleft-Schutz.

Begründung entlang der Ziele: Der Schutz greift dort, wo Wertschöpfung und Lock-in-Gefahr sitzen
(die laufende Anwendung), während die Bausteine, die andere in ihre — auch proprietären —
Systeme einbetten sollen, bewusst freigegeben werden. Das folgt bewährter Praxis vergleichbarer
Commons-Projekte und hält die Neutralitäts-/Souveränitätsversprechen technisch ein.

## Konsequenzen

- **Positiv:** Gemeingut ist gegen proprietären SaaS geschützt; gleichzeitig niedrige Hürde für
  Integration von Modellen/SDKs in Verwaltung & Wirtschaft; klare, kommunizierbare Regel.
- **Negativ / Kosten:** Die Grenze „ist dies Anwendung oder Bibliothek?" muss pro Paket bewusst
  gezogen und dokumentiert werden; Contributor müssen die Regel verstehen.
- **Umsetzung:** [REUSE](https://reuse.software/)-Konformität — **jede** Datei trägt einen
  SPDX-Header (`SPDX-License-Identifier`), Volltexte liegen unter [`LICENSES/`](../../LICENSES/),
  die Policy steht in [`LICENSING.md`](../../LICENSING.md). Ein CI-Check (später) erzwingt die
  Konformität.
- **Risiken & Gegenmaßnahmen:** Lizenz-Inkompatibilität bei Abhängigkeiten → Entscheidungsprinzip 4
  (nur kompatible Abhängigkeiten) + automatisierte Lizenzprüfung in Phase 1/3.

## Vor- und Nachteile der Optionen

### Option A — AGPL-3.0 durchgängig

- 👍 Maximaler Schutz des gesamten Codes gegen proprietäre SaaS-Nutzung.
- 👎 Schreckt viele Behörden und Firmen von der Integration von SDKs/Datenmodellen ab; behindert
  gerade die gewünschte breite Nutzung der offenen Datenmodelle.

### Option B — Apache-2.0 durchgängig

- 👍 Maximale Adoption und Rechtssicherheit; einfachste Integration überall.
- 👎 Erlaubt proprietäre Forks/geschlossene SaaS-Angebote ohne Rückgabe an die Community —
  widerspricht dem Gemeingut-Schutz und Risiko R6.

### Option C — Split *(gewählt)*

- 👍 Bestmögliche Balance: Schutz dort, wo Lock-in droht; Offenheit dort, wo Verbreitung zählt.
- 👎 Erfordert bewusste, dokumentierte Zuordnung pro Paket und etwas mehr Erklärungsaufwand.
