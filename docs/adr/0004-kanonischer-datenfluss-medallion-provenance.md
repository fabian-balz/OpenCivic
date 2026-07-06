<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0004 — Kanonischer Datenfluss: Medallion (Bronze/Silver/Gold) + Provenance-First

- **Status:** Accepted
- **Datum:** 2026-07-06
- **Bezug:** Architekturziele 3, 4, 5; Qualitätsattribute QA1 (Provenance/Auditability);
  Leitprinzipien 2 (Quellenzwang), 4 (Reproduzierbarkeit); Risiken R3 (Link-Rot), R11 (Integrität)

## Kontext und Problemstellung

Der wichtigste Wert von OpenCivic ist **Vertrauen**: Jede angezeigte Aussage muss bis zur
amtlichen Originalquelle zurückführbar und **reproduzierbar** sein. Amtliche Quellen ändern sich,
verschwinden oder liefern unsaubere Daten (R3). Es braucht einen einheitlichen Weg von der Quelle
bis zur Anzeige, der Rohdaten bewahrt und Herkunft lückenlos festhält.

## Betrachtete Optionen

- **Option A — Direkter Import Quelle → Anwendungs-DB:** Connector schreibt normalisierte Daten
  direkt in die produktive Datenbank.
- **Option B — Medallion (Bronze/Silver/Gold) ohne dediziertes Provenance-Modell:** Roh-,
  Zwischen- und Zielschichten, Herkunft nur implizit über Ordner/Namen.
- **Option C — Medallion + Provenance-First:** drei Schichten **plus** ein querschnittlicher
  Provenance-Store (*Quelle → Version → Aussage*), in den jede Schicht schreibt und den die API liest.

## Entscheidung

**Option C.**

Kanonischer Fluss:
`Amtliche Quelle → OpenData-Connector → 🥉 Bronze → 🥈 Silver → 🥇 Gold → API → Präsentation`.

- **🥉 Bronze:** roher, **unveränderlicher** Snapshot der Quelle inkl. **Hash**, Abrufzeitpunkt und
  Quell-/Lizenzmetadaten. Deterministisch und wiederholbar (P7, Leitprinzip 4).
- **🥈 Silver:** normalisierte, bereinigte Daten in kanonischen Schemata; **jeder** Satz verlinkt
  auf seinen Bronze-Ursprung.
- **🥇 Gold:** abfrageoptimierte, aggregierte Domänensichten je Modul; ebenfalls provenance-verlinkt.
- **Provenance-Store (querschnittlich):** kein Silo — jede Schicht schreibt Herkunfts- und
  Versionskanten hinein; die API liest daraus und hängt an jede Antwort einen Beleg.
- **Events:** `dataset.updated` (aus Bronze) triggert Silver/Gold-Neuberechnung und
  Suchreindizierung über den Event-Bus (entkoppelt Ingest von Präsentation, Architekturziel 4).

Begründung: Der unveränderliche, gehashte Bronze-Snapshot macht jede Ableitung reproduzierbar und
liefert einen Audit-Trail, selbst wenn die Quelle später verschwindet oder sich ändert (R3, R11).
Der First-Class-Provenance-Store operationalisiert den Quellenzwang (Leitprinzip 2, QA1).

## Konsequenzen

- **Positiv:** Reproduzierbarkeit & Auditierbarkeit; Robustheit gegen Link-Rot; jede Aussage
  belegt; Re-Prozessierung möglich, ohne die Quelle erneut abzurufen; Integritätsprüfung via Hash.
- **Negativ / Kosten:** Mehr Speicher (Rohdaten werden dauerhaft gehalten) und eine zusätzliche
  Verarbeitungsstufe → Gegenmaßnahme: Objektspeicher für Bronze (günstig), Kompression, Retention-
  Policies pro Quelle; im Solo-Profil kleinere Defaults.
- **Verpflichtung:** Jedes Modul muss beim Schreiben nach Silver/Gold die Provenance-Kanten pflegen
  (per Kern-SDK erzwungen).

## Vor- und Nachteile der Optionen

### Option A — Direkter Import in die Anwendungs-DB

- 👍 Einfach, wenig Speicher.
- 👎 Nicht reproduzierbar; kein Roh-Audit-Trail; bei Quellenänderung/Link-Rot ist der Ursprung
  verloren (R3); widerspricht Leitprinzip 4 und QA1 fundamental.

### Option B — Medallion ohne Provenance-Modell

- 👍 Rohdaten bleiben erhalten; klare Verarbeitungsstufen.
- 👎 Herkunft nur implizit → schwer maschinell belegbar; „Aussage X stammt aus Quelle Y v.Z" ist
  nicht als abfragbares Modell vorhanden; Quellenzwang nicht durchsetzbar.

### Option C — Medallion + Provenance-First *(gewählt)*

- 👍 Erfüllt QA1 und Reproduzierbarkeit vollständig; robust gegen Link-Rot; jede Antwort belegbar.
- 👎 Höherer Speicher- und Modellierungsaufwand (akzeptiert — es ist der Kernwert der Plattform).
