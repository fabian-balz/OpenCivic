<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0014 — Primäre Datenbank (PostgreSQL)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Qualitätsattribute QA1 (Nachvollziehbarkeit — höchste Priorität), QA3 (Wartbarkeit),
  QA5 (Portabilität/Self-Hostbarkeit), QA8 (Performance); Leitprinzipien P1 (boring & bewährt),
  P4 (lizenzkompatibel), P7 (Daten sind langlebiger als Code), P11 (TCO 10 Jahre); Risiko R9
  (Betriebskomplexität durch zu viele Systeme); baut auf
  [ADR-0006](0006-provenance-modell-w3c-prov.md), [ADR-0007](0007-bitemporal-append-only-lifecycle.md)
  und [ADR-0004](0004-kanonischer-datenfluss-medallion-provenance.md); vertieft in
  [Architektur 05 — Datenbanken, Suche & Vektorsuche](../architecture/05-data-storage.md)

## Kontext und Problemstellung

Das [Provenance-Datenmodell](../architecture/02-provenance-model.md) formuliert in
[§10](../architecture/02-provenance-model.md#10-anforderungen-an-die-speicherung-input-für-den-db-topic)
produktneutrale Speicheranforderungen: **append-only/Unveränderlichkeit**, **bitemporale Abfragen**
(`valid_time` × `system_time`), **Graph-Traversierung** der Herkunftskette (`Statement → … → Source`),
**Hash-Integrität** mit Objektspeicher-Verweis und **skalierbare Filter** über Jurisdiktion, Aspekt
und Zeit. Hinzu kommen flexible, aber typisierte Statement-Values.

Die Kern-Datenbank trägt die höchstpriorisierte Qualität der Plattform (QA1) und muss über 10+ Jahre
wartbar, überall self-hostbar (QA5) und lizenzkompatibel zum Split-Modell
([ADR-0001](0001-lizenzmodell-split.md)) sein. Zugleich gilt R9: jede zusätzliche Datenbank erhöht
Betriebs-, Backup- und Konsistenzaufwand überproportional. Die Frage ist daher nicht nur „welche
DB kann das?", sondern „mit **wie wenigen** Systemen erreichen wir alle Anforderungen?".

## Betrachtete Optionen

- **Option A — PostgreSQL als einzige Kern-Datenbank.**
- **Option B — MySQL/MariaDB als relationale Kern-DB.**
- **Option C — PostgreSQL für Relationales + dedizierter Graph-Store (Neo4j) für die Provenance-Kette.**
- **Option D — Dokumentendatenbank (MongoDB) für die flexiblen, versionierten Provenance-Objekte.**

## Entscheidung

**Option A — PostgreSQL als einzige Kern-Datenbank.**

PostgreSQL erfüllt **alle** Anforderungen aus §10 mit Bordmitteln und ohne ein zweites System:

- **Bitemporalität** über Range Types (`tstzrange`/`daterange`) mit GiST-Indizes und Exclusion
  Constraints — überlappungsfreie Gültigkeitsintervalle sind eine Integritätsgarantie auf DB-Ebene
  (QA1, P7).
- **Graph-Traversierung** der Herkunftskette über rekursive CTEs (`WITH RECURSIVE`). Die Kettentiefe
  ist gering (typisch 3–5 Kanten) — dafür ist eine spezialisierte Graph-Engine überzogen.
- **Flexible, typisierte Werte** über `JSONB` mit GIN-Index: das Kernschema bleibt stabil, Fachmodule
  entwickeln ihre Wertstrukturen weiter (QA3).
- **Append-only-Freundlichkeit** durch MVCC und Insert-only-Muster; `UPDATE/DELETE` lassen sich auf
  Historientabellen entziehen ([ADR-0007](0007-bitemporal-append-only-lifecycle.md)).
- **Eingebaute Volltextsuche** (`tsvector`), die das Solo-Profil ohne Zusatzinfrastruktur suchfähig
  macht (QA5).

PostgreSQL ist zugleich **maximal boring/langlebig** (P1): eines der am längsten gepflegten
Open-Source-Projekte, breite unabhängige Anbietervielfalt, klarer Support-Horizont, niedrige TCO
über 10 Jahre (P11). Die **PostgreSQL-Lizenz** (permissiv, MIT/BSD-artig) ist mit dem
Split-Lizenzmodell voll kompatibel (P4) und überall self-hostbar (QA5). Der Zugriff erfolgt über
**SQL** — eine Standardschnittstelle (P6) statt proprietärer Query-Sprache.

**Ein System statt vieler** (R9): Relationales, Dokumente (JSONB), Volltext und — später — Vektoren
(`pgvector`, siehe [ADR-0015](0015-suche-und-vektorsuche.md)) liegen transaktional konsistent in
**einer** Datenbank. Zusätzliche Systeme kommen erst hinzu, wenn ein Deployment-Profil sie
nachweislich braucht.

## Konsequenzen

- **Positiv:** Alle §10-Anforderungen ohne Zweitsystem erfüllt; niedrige Betriebs- und
  Backup-Komplexität; transaktionale Konsistenz über alle Datenarten; permissive Lizenz; überall
  self-hostbar; SQL als Standardschnittstelle; sehr lange erwartbare Lebensdauer.
- **Negativ / Kosten (ehrlich benannt):** Für **sehr tiefe** oder hochgradig vernetzte
  Graph-Abfragen sind rekursive CTEs weniger elegant und potenziell langsamer als eine native
  Graph-Engine — das ist der reale Preis gegenüber Option C. OpenCivic akzeptiert ihn bewusst, weil
  die Provenance-Kette flach ist; sollte ein Fachmodul künftig tiefe Graphstrukturen brauchen, ist
  das ein **isolierter** Anlass für einen neuen ADR, kein Grund, die Kern-DB heute anders zu wählen.
  Bei extremer horizontaler Schreib-Skalierung ist Postgres zudem aufwändiger zu sharden als manche
  verteilte Systeme — für die erwartete Größenordnung (öffentliche Haushaltsdaten, kein
  Konsumenten-Massenverkehr) jedoch nicht relevant.
- **Reversibilität (P8):** Hoch für den Zugriffsweg (SQL-Standard, portable Schemata), moderat für
  produktspezifische Features (Range Types, JSONB-Operatoren). Da „Daten langlebiger als Code" sind
  (P7), wäre eine spätere Migration primär eine Datenmigration — versioniert und planbar, aber nicht
  trivial. Der Trade-off wird zugunsten von Funktionsdichte heute eingegangen.

## Vor- und Nachteile der Optionen

### Option A — PostgreSQL *(gewählt)*

- 👍 Erfüllt alle §10-Anforderungen (Bitemporalität via Range Types, Graph via rekursive CTEs,
  JSONB, Volltext) in **einem** System — minimiert R9.
- 👍 Permissive Lizenz (P4), überall self-hostbar (QA5), extrem langlebig/boring (P1, P11),
  SQL-Standard (P6).
- 👎 Native Graph-Traversierung fehlt; tiefe Graphabfragen sind weniger elegant als in einer
  spezialisierten Engine (bewusst akzeptiert wegen flacher Provenance-Kette).

### Option B — MySQL/MariaDB

- 👍 Sehr weit verbreitet, großer Betriebs- und Talentpool, ebenfalls Open-Source und self-hostbar —
  ein ernstzunehmender „boring"-Kandidat (P1).
- 👎 Schwächere Range-Type-Unterstützung (keine gleichwertigen nativen Intervall-Datentypen für
  saubere Bitemporalität), historisch schwächere/rekursiv später nachgerüstete CTEs, kein so
  ausgereiftes JSONB-Indexing wie Postgres, und traditionell schwächer bei komplexen analytischen
  Queries. Für ein Modell, dessen Kern gerade Bitemporalität und Ableitungsketten sind, wiegen diese
  Lücken schwer.

### Option C — PostgreSQL + dedizierter Graph-Store (Neo4j)

- 👍 **Native Graph-Traversierung**: Für Herkunftsketten wäre eine Graph-Engine das konzeptionell
  passendste Werkzeug, mit ausdrucksstarken Pfad-Abfragen (Cypher) — hier ist die Alternative
  **tatsächlich stärker** als die gewählte Option.
- 👎 Zusätzliches Betriebssystem (widerspricht R9), Synchronisations- und Konsistenzfenster zwischen
  zwei Datenbanken, und Lizenz-/Governance-Fragen (Community-Edition GPL, erweiterte Funktionen
  kommerziell) berühren P3/P4. Vor allem aber **überzogen**: Die reale Kettentiefe (3–5 Kanten) ist
  mit rekursiven CTEs vollständig und performant abbildbar — die native Graph-Stärke zahlt sich erst
  bei tiefen, dicht vernetzten Graphen aus, die OpenCivic nicht hat.

### Option D — Dokumentendatenbank (MongoDB)

- 👍 Sehr flexibles, schemafreies Speichern der versionierten Provenance-Objekte; bequem für schnell
  wechselnde Wertstrukturen.
- 👎 Schwächere Konsistenz- und Transaktionsgarantien für **audit-kritische, bitemporale** Daten;
  keine nativen Range-Types/Exclusion-Constraints für überlappungsfreie Gültigkeit; Lizenz-Governance
  (SSPL) berührt P4. Für die höchstpriorisierte Qualität QA1 ist das ein Ausschlussgrund — und die
  gewünschte Dokumentenflexibilität liefert Postgres via JSONB ohnehin, ohne die
  Konsistenz aufzugeben.
