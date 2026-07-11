<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0015 — Suche & Vektorsuche (Postgres-FTS/pgvector → OpenSearch/Qdrant)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Qualitätsattribute QA3 (Wartbarkeit), QA5 (Portabilität/Self-Hostbarkeit),
  QA7 (Interoperabilität), QA8 (Performance/Skalierbarkeit); Leitprinzipien P1 (boring & bewährt),
  P2 (offene Standards), P3 (keine harten Anbieter-Abhängigkeiten), P4 (lizenzkompatibel),
  P8 (Reversibilität), P11 (TCO 10 Jahre); Risiko R9 (Betriebskomplexität); baut auf
  [ADR-0014](0014-primaere-datenbank-postgresql.md), [ADR-0003](0003-plattformkern-und-modulschnitt.md)
  (Such-Abstraktion) und [ADR-0002](0002-architekturstil-modular-monolith.md) (Deployment-Profile);
  vertieft in [Architektur 05](../architecture/05-data-storage.md)

## Kontext und Problemstellung

OpenCivic braucht zwei Klassen von Suche: **Volltext-/Facettensuche** über Datensätze und Statements
(z. B. Haushalts-Exploration in OpenBudget, QA8) und — ab **CivicAI/RAG in Phase 4** — **Vektorsuche**
(semantisches Retrieval für Embeddings). Beides muss über die drei Deployment-Profile
([ADR-0002](0002-architekturstil-modular-monolith.md)) hinweg funktionieren: Solo (eine kleine
Kommune, minimale Infrastruktur, QA5) bis Scale (große Korpora, hohe Last).

Das Spannungsfeld: Eine leistungsfähige dedizierte Such-Engine erhöht Betriebskomplexität (R9) und
darf im Solo-Profil nicht Pflicht sein. Zugleich darf die Wahl keine harten Anbieter- oder
Lizenz-Abhängigkeiten einführen (P3, P4) — ein Punkt, der bei Such-Engines akut ist, seit Elastic
Elasticsearch auf die **SSPL** relizenziert hat.

## Betrachtete Optionen

- **Option A — Gestaffelt: Postgres-FTS + pgvector (Solo/Standard) → OpenSearch + optional Qdrant (Scale).**
- **Option B — Elasticsearch als Such-Engine für Standard/Scale.**
- **Option C — Reine Postgres-FTS in allen Profilen, auch Scale.**
- **Option D — Leichtgewichtige Such-Engine (Typesense/Meilisearch) für alle Profile.**

## Entscheidung

**Option A — gestaffelte Suche entlang der Deployment-Profile, gekapselt hinter der
Such-Abstraktion des Kerns** ([ADR-0003](0003-plattformkern-und-modulschnitt.md)).

| Profil | Volltext/Facetten | Vektor (ab Phase 4) |
|---|---|---|
| **Solo** | Postgres-FTS (`tsvector`) | `pgvector` in derselben Postgres |
| **Standard** | OpenSearch (Apache-2.0) | `pgvector` |
| **Scale** | OpenSearch (Apache-2.0) | Qdrant (Apache-2.0), optional |

Fachmodule sprechen ausschließlich gegen das Kern-Interface (`index()`, `query()`, `facet()`);
welches Backend antwortet, ist Konfiguration, nicht Code. So nutzen Solo und Standard **denselben
Modul-Code** (QA3, P8).

**OpenSearch statt Elasticsearch** ist die zentrale, bewusst begründete Festlegung: Elasticsearch
steht seit der Relizenzierung unter **SSPL** — einer Single-Vendor-Copyleft-Lizenz, die nicht
OSI-konform ist und Self-Hosting/Weiterverbreitung rechtlich belastet. Das ist genau das
Governance-Risiko, das die Prinzipien ausschließen sollen:

- **P2 (offene Standards):** OpenSearch ist Apache-2.0 und herstellerneutral entwickelt.
- **P3 (keine harten Anbieter-Abhängigkeiten):** SSPL koppelt die Zukunft an einen einzelnen
  kommerziellen Anbieter.
- **P4 (lizenzkompatibel):** SSPL verträgt sich nicht mit dem Split-Lizenzmodell
  ([ADR-0001](0001-lizenzmodell-split.md)) und unbeschwertem Self-Hosting.

**Vektorsuche** folgt „ein System, so lange es reicht": Solo/Standard nutzen `pgvector` in **derselben**
PostgreSQL ([ADR-0014](0014-primaere-datenbank-postgresql.md)) — Embeddings liegen transaktional
konsistent neben ihren Statements, kein viertes System, kein Sync. **Qdrant (Apache-2.0)** kommt erst
im Scale-Profil und nur bei sehr großen Vektormengen hinzu — die Entscheidung bleibt bis zum echten
Bedarf offen (P8), ganz im Sinne von R9.

## Konsequenzen

- **Positiv:** Solo läuft ohne jede Zusatzinfrastruktur (QA5); Skalierung ist additiv, nicht
  disruptiv; keine SSPL-/Single-Vendor-Bindung (P2–P4); Vektorsuche wird erst eingeführt, wenn sie
  gebraucht wird; ein stabiles Modul-Interface über alle Profile (QA3).
- **Negativ / Kosten (ehrlich benannt):** Zwei bis drei mögliche Backends bedeuten, dass die
  Such-Abstraktion **mehrere Implementierungen** pflegen und testen muss, und dass Facetten-/Ranking-
  Semantik zwischen Postgres-FTS und OpenSearch nicht bit-identisch ist — subtile Ergebnisunterschiede
  beim Profilwechsel sind möglich und müssen durch Contract-Tests abgesichert werden. OpenSearch hat
  zudem ein **kleineres Ökosystem** als Elasticsearch (der reale Preis gegen Option B).
- **Reversibilität (P8):** Hoch. Die Kapselung hinter der Such-Abstraktion macht einen Backend-Tausch
  (z. B. Qdrant statt pgvector, oder ein anderes FTS-Backend) zu einer lokalen Änderung; der
  Index lässt sich aus der Kern-DB jederzeit neu aufbauen (die DB ist die Source of Truth, der Index
  ist abgeleitet).

## Vor- und Nachteile der Optionen

### Option A — Gestaffelt: Postgres-FTS/pgvector → OpenSearch/Qdrant *(gewählt)*

- 👍 Solo ohne Zusatzinfrastruktur (QA5); additive Skalierung; ausschließlich Apache-2.0-Bausteine
  (P2–P4); Vektor erst bei Bedarf (R9); ein Modul-Interface über alle Profile (QA3, P8).
- 👎 Mehrere Backend-Implementierungen hinter der Abstraktion; nicht bit-identische
  Ranking-/Facetten-Semantik zwischen Profilen; OpenSearch-Ökosystem kleiner als das von Elasticsearch.

### Option B — Elasticsearch

- 👍 **Größtes Such-Ökosystem und Feature-Set** der Branche: umfangreiche Plugins, Tooling,
  Dokumentation, Talentpool — in reiner Funktions- und Ökosystembreite ist Elasticsearch OpenSearch
  hier **tatsächlich überlegen**.
- 👎 **SSPL-Lizenz** — für OpenCivic ein Ausschlusskriterium: unvereinbar mit P2/P3/P4 und dem
  Split-Lizenzmodell. Die Funktionsüberlegenheit ändert daran nichts, weil Lizenz-Governance hier
  über Feature-Tiefe steht.

### Option C — Reine Postgres-FTS in allen Profilen

- 👍 **Maximal ein System** (stärkstes R9-Argument): keine zweite Such-Engine, kein Sync, keine
  zusätzliche Betriebslast — für kleine bis mittlere Korpora vollauf ausreichend und am „boringsten"
  (P1).
- 👎 Skaliert und facettiert bei **großen Korpora** schlechter: verteiltes Sharding, tiefe
  Aggregationen/Facetten und sehr hohe Query-Last sind nicht die Stärke von Postgres-FTS. Für das
  Scale-Profil und tiefe Datenexploration (QA8) reicht es nicht — deshalb dort OpenSearch.

### Option D — Typesense/Meilisearch

- 👍 Einfach zu betreiben, sehr schnell, gute Out-of-the-box-Relevanz und Tippfehlertoleranz;
  Apache-2.0/MIT — lizenzseitig unproblematisch.
- 👎 Kleineres Ökosystem und geringere **Analytics-/Facetten-Tiefe** für die datenexplorative Suche
  über Haushalts- und Provenance-Daten; weniger ausgereifte Aggregationen als OpenSearch. Für die
  angestrebte Tiefe der Datenexploration (QA8) die schwächere Wahl, obwohl der Betrieb einfacher wäre.
