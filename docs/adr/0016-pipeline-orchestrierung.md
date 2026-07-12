<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0016 — Pipeline-Orchestrierung (in-Prozess, Python-Connectors als Subprozess)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Kern-Baustein „Pipeline-Orchestrierung" ([ADR-0003](0003-plattformkern-und-modulschnitt.md));
  Sprachwahl ([ADR-0009](0009-programmiersprachen-typescript-python.md)); Backend
  ([ADR-0010](0010-backend-framework-nodejs-fastify.md)); Datenfluss
  ([ADR-0004](0004-kanonischer-datenfluss-medallion-provenance.md)); Provenance
  ([ADR-0006](0006-provenance-modell-w3c-prov.md)/[0007](0007-bitemporal-append-only-lifecycle.md));
  Qualitätsattribute QA1 (Nachvollziehbarkeit), QA3 (Wartbarkeit), QA5 (Self-Hostbarkeit),
  QA9 (Observability); Leitprinzip 4 (Reproduzierbarkeit); Prinzipien P1, P3, P5, P8, P11;
  Risiko R9 (einfaches Solo-Self-Host)

## Kontext und Problemstellung

OpenCivic muss aus heterogenen amtlichen Quellen (Portale, APIs, Dokumente) reproduzierbare
Bronze-Snapshots erzeugen und daraus Silver/Gold ableiten. Dafür braucht es eine
**Orchestrierung**: etwas, das Läufe plant, Connectors ausführt, Fehler/Retries behandelt und die
**Herkunft jedes Erzeugnisses** (Lineage, `code_version`, Input-Hashes) festhält.

Die harte Randbedingung ist das **Solo-Deployment-Profil** ([ADR-0002](0002-architekturstil-modular-monolith.md)):
Eine einzelne Person soll OpenCivic mit minimalem Betriebsaufwand self-hosten können (QA5, R9).
Zugleich ist die Fachlogik TypeScript, während die Daten-Connectors aus gutem Grund Python sind
([ADR-0009](0009-programmiersprachen-typescript-python.md)) — es gibt also eine **Sprachgrenze**, die überbrückt
werden muss, ohne den Kern an eine schwergewichtige, Python-zentrierte Orchestrierungsplattform zu
ketten.

Die Frage lautet also nicht nur „welcher Orchestrator?", sondern „wie orchestrieren wir, ohne eine
zweite Betriebswelt neben dem Node-Kern aufzumachen und ohne Reproduzierbarkeit zu opfern?".

## Betrachtete Optionen

- **Option A — Apache Airflow:** etablierter, mächtiger Workflow-Scheduler (DAGs, Retries, Web-UI).
- **Option B — Dagster / Prefect:** moderne, datenzentrierte Orchestratoren mit Asset-/Lineage-Fokus.
- **Option C — Cron + Skripte:** minimalistisch, Betriebssystem-Bordmittel.
- **Option D — Orchestrierung in-Prozess im Node-Kern, Python-Connectors als isolierte Subprozesse
  mit JSON-Contract über stdin/stdout.**

## Entscheidung

**Option D — in-Prozess-Orchestrierung im Node-Kern; Python-Connectors als isolierte Subprozesse.**

Die Orchestrierung ist bereits als **Kern-Baustein** vorgesehen ([ADR-0003](0003-plattformkern-und-modulschnitt.md))
und wird genau das: Code im selben Node.js/Fastify-Prozess ([ADR-0010](0010-backend-framework-nodejs-fastify.md)),
der Postgres, API und Kern teilt. Ein Solo-Betreiber braucht damit **keine** zusätzliche
Infrastruktur — kein Scheduler-Cluster, keine Orchestrator-DB, keinen Worker-Pool. Das ist der
direkte Ausdruck von QA5, P1 (boring & bewährt), P11 (10-Jahre-TCO) und der Entschärfung von R9.

Die Python-Connectors werden als **kurzlebige, isolierte Subprozesse** aufgerufen. Die Kopplung ist
ausschließlich ein **versionierter JSON-Contract über `stdin`/`stdout`** (Details und Beispiele in
[docs/architecture/06-etl-events.md](../architecture/06-etl-events.md#23-contract-über-stdinstdout)).
Das hält die Sprachgrenze sauber (P5, P6): Node und Python teilen keinen Speicher, keine Laufzeit,
kein Framework — nur ein Datenschema. Ein hängender oder abstürzender Connector reißt den Kern nicht
mit (Fehlerisolation, QA3), und der Subprozess ist die einzige Komponente, die ungeprüfte externe
Inhalte anfasst — er lässt sich mit reduzierten Rechten einsperren (P9).

Reproduzierbarkeit ist eingebaut, nicht angeflanscht: Jeder Lauf persistiert `code_version` und die
`content_hash`-Werte seiner Inputs über das Provenance-Modell
([ADR-0006](0006-provenance-modell-w3c-prov.md)/[0007](0007-bitemporal-append-only-lifecycle.md)),
womit Leitprinzip 4 und QA1 direkt bedient werden.

## Konsequenzen

- **Positiv:** Solo läuft mit einem Container + Postgres, null Zusatz-Ops (QA5, R9, P11). Klare
  Sprach- und Prozessgrenze zu den Connectors (QA3, P5, P9). Reproduzierbarkeit und Lineage sind
  strukturell erzwungen (QA1, Leitprinzip 4). Volle Kontrolle über den Contract statt Anpassung an
  ein fremdes DAG-Framework.
- **Negativ / Kosten (ehrlich benannt):** Wir bauen **selbst**, was Airflow/Dagster fertig
  mitbringen — Scheduler, Retry-/Backoff-Logik, eine Betriebs-UI für Läufe. Das ist der
  **Hauptnachteil** gegenüber Option A/B: reifer Funktionsumfang und ein großes fertiges Ökosystem
  an Operatoren/Integrationen stehen dort sofort bereit, bei uns ist es Eigenbau, der wachsen muss.
  Gegenmaßnahme: bewusst kleiner Anfangsumfang (Zeitplan, Timeout, Retry, Lauf-Log) und Ausbau nach
  Bedarf; die Observability liegt ohnehin auf OpenTelemetry (QA9).
- **Reversibilität (P8):** hoch. Weil die Connectors bereits **eigenständige Subprozesse mit
  stabilem JSON-Contract** sind, könnten sie später von einem externen Orchestrator (z. B. Airflow im
  Scale-Profil) aufgerufen werden, ohne die Connectors selbst zu ändern — nur der aufrufende Teil
  würde ersetzt. Die Entscheidung sperrt den Weg zu Option A/B also nicht zu, sie verschiebt ihn nur
  hinter eine echte Skalierungsnotwendigkeit.

## Vor- und Nachteile der Optionen

### Option A — Apache Airflow

- 👍 Sehr mächtiger, kampferprobter Scheduler: reiche Retry-/Backfill-Semantik, Abhängigkeits-DAGs,
  eine ausgereifte Web-UI zum Beobachten und Neustarten von Läufen, riesiges Operator-Ökosystem —
  all das müssten wir sonst selbst bauen. **Das ist das ernsthafteste Gegenargument zur getroffenen
  Wahl.**
- 👎 Schwergewichtiger, Python-zentrierter Fremdkörper mit eigener Metadaten-DB, Scheduler,
  Webserver und Worker-Prozessen — realistisch **4+ Betriebskomponenten**. Das zerstört die
  Solo-Einfachheit (R9, QA5) und zieht eine zweite Orchestrierungswelt neben den Node-Kern, die
  gepflegt, aktualisiert und abgesichert werden muss (P11 TCO, P1).

### Option B — Dagster / Prefect

- 👍 Modern und **datenzentriert**: Asset-/Lineage-Konzepte liegen nah an unserem Medallion-Denken,
  gute Developer-Experience, Typisierung, sauberes Retry-Modell — konzeptionell die eleganteste der
  fremden Optionen.
- 👎 Zusätzliche Laufzeit/Dienste und eine spürbare **Abo-/Cloud-Gravitation** (die attraktiven
  Features drängen zum gehosteten Angebot) — Spannung zu P3 (keine harten Cloud-Abhängigkeiten).
  Wie Airflow bleibt es eine **zweite Orchestrierungswelt** neben dem Node-Kern und damit ein
  Python-Betriebsstrang, den es sonst nicht gäbe (P5, P11).

### Option C — Cron + Skripte

- 👍 Denkbar minimalistisch, keine zusätzliche Software, überall verfügbar, trivial zu verstehen.
- 👎 Keine Lineage, keine strukturierte Retry-/Fehler-Semantik, keine Lauf-Klammer über
  Erzeugnisse — **schwache Reproduzierbarkeit**, was direkt QA1 und Leitprinzip 4 verletzt. Man
  müsste all das nachrüsten und stünde am Ende bei einer schlechteren Variante von Option D.

### Option D — in-Prozess-Orchestrierung + Python-Connectors als Subprozess *(gewählt)*

- 👍 Null Zusatz-Ops im Solo-Profil; saubere Sprach-/Prozessgrenze; Reproduzierbarkeit und Lineage
  strukturell erzwungen; volle Kontrolle über einen versionierten Contract; reversibel Richtung
  externer Orchestrator.
- 👎 Scheduler-/Retry-/UI-Funktionsumfang ist Eigenbau statt fertiges Ökosystem — bewusst
  akzeptierter Trade-off zugunsten von QA5, P1 und P11, mit Airflow als klar benanntem Ausweg,
  falls die Betriebsanforderungen das später rechtfertigen.
