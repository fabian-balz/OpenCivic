<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0017 — Event-Bus (Postgres-Outbox → NATS)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Kern-Baustein „Event-Bus" ([ADR-0003](0003-plattformkern-und-modulschnitt.md));
  Deployment-Profile ([ADR-0002](0002-architekturstil-modular-monolith.md)); Datenbank
  ([ADR-0014](0014-primaere-datenbank-postgresql.md)); Datenfluss
  ([ADR-0004](0004-kanonischer-datenfluss-medallion-provenance.md)); Provenance/Lifecycle
  ([ADR-0007](0007-bitemporal-append-only-lifecycle.md)); Qualitätsattribute QA1
  (Nachvollziehbarkeit/Auditability), QA5 (Self-Hostbarkeit), QA8 (Skalierbarkeit),
  QA9 (Observability); Prinzipien P1, P2, P3, P4, P8, P11; Architekturziel 4
  (Entkopplung Ingest ↔ Präsentation); Risiko R9

## Kontext und Problemstellung

OpenCivic soll **Ingest von Präsentation entkoppeln** (Architekturziel 4): Wenn ein Datensatz
fortgeschrieben wird (`dataset.updated`), müssen Silver/Gold-Neuberechnung und Suchreindizierung
angestoßen werden — aber der Orchestrator soll die Suche nicht kennen und umgekehrt. Das verlangt
einen **Event-Mechanismus**.

Zwei Randbedingungen prägen die Wahl:

1. **Audit-Relevanz (QA1).** Events wie `statement.retracted` oder `dataset.published` sind
   nachvollziehbarkeitskritisch. Ein Event darf **nicht verloren gehen**; wir brauchen mindestens
   **einmalige Zustellung** und **Durability**. Der klassische Fehler — Daten in einer Transaktion
   committen und *danach* außerhalb publizieren — kann bei einem Absturz dazwischen den Datensatz
   ändern, ohne dass ein Konsument es erfährt. Das ist inakzeptabel.
2. **Solo-Einfachheit (QA5, R9).** Ein Solo-Betreiber soll **kein** zusätzliches Broker-System
   betreiben müssen.

Die Anforderungen ziehen also in verschiedene Richtungen: harte Zustellgarantien *und* null
Zusatzinfrastruktur im kleinsten Profil, aber echte Broker-Fähigkeiten, wenn es größer wird.

## Betrachtete Optionen

- **Option A — Apache Kafka** als durchgängiger Event-Bus.
- **Option B — Redis Streams.**
- **Option C — RabbitMQ.**
- **Option D — Transaktionales Outbox-Pattern in Postgres (Solo) → NATS JetStream (Standard/Scale).**

## Entscheidung

**Option D — Transaktionale Outbox in Postgres als Fundament; NATS (JetStream) als Broker ab
Standard/Scale.**

Im **Solo-Profil** ist der Event-Bus kein eigenes System, sondern eine `outbox`-Tabelle in der
ohnehin vorhandenen Postgres ([ADR-0014](0014-primaere-datenbank-postgresql.md)). Das Event wird in
**derselben Transaktion** wie der Datenschreibvorgang geschrieben — entweder committen beide oder
keiner. Damit ist das Problem verlorener Events **strukturell** gelöst, ohne eine Zeile
Zusatzinfrastruktur (P1 boring, P3 keine Zusatzabhängigkeit, QA5, R9). Ein In-Process-Relay pollt die
Outbox und stellt zu; `FOR UPDATE SKIP LOCKED` macht das später auch nebenläufig sicher.

Ab dem **Standard/Scale-Profil** wird der Relay zum **Publisher auf NATS (JetStream)**. Die Outbox
**bleibt die Quelle der Wahrheit** — sie garantiert weiterhin genau ein Event je committetem
Fachdatum, NATS übernimmt nur den skalierbaren Transport an mehrere, verteilte Konsumenten. Das ist
ein **additiver Ausbau, kein Umbau** (P8 Reversibilität). NATS wurde als Broker gewählt, weil es als
**Single-Binary**, **Apache-2.0**-lizenziert (P2/P4 — kritisch fürs Split-Lizenzmodell und
Self-Hosting) und leichtgewichtig self-hostbar ist (P3, QA5, P11), während JetStream die geforderte
**Durability** und **mindestens-einmal-Zustellung** liefert (QA1).

Der vollständige Ablauf (Outbox-Sequenz, Event-Katalog, Profile) steht in
[docs/architecture/06-etl-events.md](../architecture/06-etl-events.md#4-event-system).

## Konsequenzen

- **Positiv:** Keine verlorenen Events per Konstruktion (QA1). Solo kommt mit null zusätzlichen
  Ops-Komponenten aus (QA5, R9, P1). Der Übergang zu NATS ist additiv und ändert keine
  Anwendungslogik (P8). Lizenz und Betriebsmodell passen zu Self-Host und Split-Lizenz (P2/P4).
- **Negativ / Kosten (ehrlich benannt):** Die Outbox erkauft ihre Einfachheit mit **Poll-Latenz**
  und dem Bedarf an **idempotenten Konsumenten** (Zustellung ist *mindestens* einmal, also können
  Duplikate auftreten — Konsumenten müssen deduplizieren). Und wir betreiben **zwei
  Zustellwege** (In-Process-Poll vs. NATS) über die Profile hinweg, die beide getestet sein wollen —
  gegenüber „von Anfang an ein Broker" ist das mehr Oberfläche. Bewusst akzeptiert, weil die
  Solo-Einfachheit höher wiegt.
- **Reversibilität (P8):** hoch. Weil die Outbox der stabile Ursprung bleibt, ist der Broker
  austauschbar: NATS ließe sich später durch Kafka oder einen anderen Transport ersetzen, ohne die
  Schreibpfade oder die Zustellgarantie anzutasten — nur der Publisher-Teil des Relays ändert sich.

## Vor- und Nachteile der Optionen

### Option A — Apache Kafka

- 👍 Herausragender Durchsatz, riesiges Ökosystem (Connect, Streams), **Log-Retention/Replay** ab
  Werk — man kann den Event-Strom als revisionssichere Historie behandeln, was zu unserem
  Audit-Anspruch konzeptionell gut passt. **Das ist Kafkas stärkstes, ehrlich anzuerkennendes
  Argument.**
- 👎 Erheblicher Ops-Overhead (Broker-Betrieb, Koordination via ZooKeeper bzw. KRaft, Tuning,
  Storage-Management) — für unsere Lastprofile überzogen und ein direkter Angriff auf die
  Solo-Einfachheit (R9, QA5, P1, P11). Kafka löst zudem **nicht** das Kern-Problem der atomaren
  Kopplung von Datenschreibvorgang und Event; man bräuchte trotzdem eine Outbox davor.

### Option B — Redis Streams

- 👍 Sehr einfach in Betrieb und Nutzung, schnell, geringe Latenz, Consumer-Groups vorhanden —
  attraktiv als leichter Broker.
- 👎 **Schwächere Durability-Garantien** für audit-kritische Events (Persistenz hängt an
  RDB/AOF-Konfiguration und ist historisch auf Cache-Workloads getrimmt); zudem berührt die
  Lizenzlage von Redis in neueren Versionen unseren P4-Anspruch. Für QA1-relevante Ereignisse wollen
  wir stärkere Garantien, als Redis Streams komfortabel zusichern.

### Option C — RabbitMQ

- 👍 Reifer, weit verbreiteter Message-Broker mit flexiblem Routing, Acknowledgements und
  solider Durability — funktional voll ausreichend und gut verstanden.
- 👎 Schwerer als NATS im Betrieb (Erlang-Runtime, komplexeres Betriebs-/Cluster-Modell,
  Queue-/Exchange-Topologie), ohne für unsere Zwecke einen Vorteil zu bieten, den NATS JetStream
  nicht auch liefert (P1/P11). Löst — wie Kafka — die atomare Event-Kopplung nicht ohne Outbox.

### Option D — Postgres-Outbox → NATS JetStream *(gewählt)*

- 👍 Atomare Event-Erzeugung ohne Zusatzsystem im Solo-Profil; additiver, reversibler Übergang zu
  einem leichtgewichtigen, Apache-2.0-lizenzierten Single-Binary-Broker mit Durability und
  ≥ 1×-Zustellung.
- 👎 Poll-Latenz und idempotente Konsumenten als Preis; zwei Zustellwege über die Profile hinweg —
  bewusst akzeptierter Trade-off zugunsten von QA5/R9 und der höher priorisierten
  Nachvollziehbarkeit (QA1), mit klar reversiblem Pfad zu einem stärkeren Broker (P8), falls Last
  oder Replay-Bedarf es erzwingen.
