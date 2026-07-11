<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0026 — Observability (OpenTelemetry + Grafana-Stack)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** [Architekturziel 9](../foundation/07-architekturziele.md) (Beobachtbarkeit eingebaut);
  Qualitätsattribute QA9 (Observability), QA1 (Nachvollziehbarkeit), QA5 (Self-Hosting);
  Entscheidungsprinzipien P6 (Standardschnittstellen), P3 (keine Cloud-Abhängigkeiten),
  P2 (offene Standards); [Leitprinzip 9](../foundation/03-leitprinzipien.md) (Souveränität);
  Risiken [R3](../foundation/09-risiken.md) (Quellen ändern sich / Connector-Fehler);
  bezieht sich auf [ADR-0002](0002-architekturstil-modular-monolith.md) (Profile),
  [ADR-0016](0016-pipeline-orchestrierung.md) (Connectors).

## Kontext und Problemstellung

Beobachtbarkeit ist ein Architekturziel, kein Nachgedanke
([Architekturziel 9](../foundation/07-architekturziele.md); QA9). In einem modularen Monolithen mit
Extraktions-Nähten ([ADR-0002](0002-architekturstil-modular-monolith.md)) und Python-Connectors als
Subprozessen ([ADR-0016](0016-pipeline-orchestrierung.md)) verläuft eine Anfrage bzw. ein
Ingest-Vorgang über mehrere Grenzen — ohne verteiltes Tracing ist eine Störung kaum
nachvollziehbar. Besonders kritisch: Ein still driftender oder fehlschlagender Connector kann die
**Datenqualität** beschädigen, bevor jemand es merkt ([R3](../foundation/09-risiken.md)). Zugleich
darf die Lösung self-hostbar und anbieterneutral sein (P3, P6;
[Leitprinzip 9](../foundation/03-leitprinzipien.md)) und den kleinen Betreiber nicht überfordern.

## Betrachtete Optionen

- **Option A — OpenTelemetry-Instrumentierung + selbst-hostbarer Grafana-Stack** (Prometheus, Loki,
  Tempo).
- **Option B — proprietäre APM-SaaS** (z. B. Datadog o. ä.).
- **Option C — ELK-Ansatz für Logs** (mit OpenSearch statt Elasticsearch, konsistent zu
  [ADR-0015](0015-suche-und-vektorsuche.md)).
- **Option D — nur strukturierte Logs, ohne verteiltes Tracing.**

## Entscheidung

**Option A — OpenTelemetry durchgängig instrumentiert, Grafana-Stack als Referenz-Backend.**

Instrumentiert wird der gesamte Stack — Kern, Fachmodule und Connectors — mit **OpenTelemetry**
(Traces, Metriken, Logs). OTel ist ein offener, herstellerneutraler Standard und damit exakt die
von P6 geforderte Standardschnittstelle. Der entscheidende Nebeneffekt: Weil die Instrumentierung
neutral ist, kann **jeder Betreiber ein anderes Backend anschließen**, ohne Anwendungscode zu ändern
(P3; [Leitprinzip 9](../foundation/03-leitprinzipien.md)).

Referenz-Backend ist der selbst-hostbare **Grafana-Stack**: Prometheus (Metriken), Loki (Logs),
Tempo (Traces), Grafana (Dashboards) — kohärent, weil alle vier auf dieselbe Datenphilosophie und
denselben Label-Ansatz wie Prometheus aufsetzen. Das Backend ist je Deployment-Profil
([ADR-0002](0002-architekturstil-modular-monolith.md)) skalierbar: **Solo** kann Observability
minimal fahren oder ganz abschalten, **Standard** betreibt einen schlanken, **Scale** den vollen
Stack.

Alle Logs sind **strukturiert** und über **Trace-IDs korreliert**. Damit werden insbesondere
Provenance- und Ingest-Ereignisse observierbar: Ein fehlschlagender Connector ist sichtbar, bevor
er die Datenqualität beschädigt — die konkrete technische Gegenmaßnahme zu
[R3](../foundation/09-risiken.md). Observability dient hier also nicht nur dem Betrieb, sondern
direkt der obersten Qualität QA1.

## Konsequenzen

- **Positiv:** Herstellerneutrale Instrumentierung (P6, P3); vollständig self-hostbar (QA5);
  verteiltes Tracing über die Modul-/Connector-Grenzen; Ingest-Fehler früh sichtbar (R3, QA1);
  profil-skalierbar, damit für Solo keine Last (R9).
- **Negativ / Kosten (ehrlich benannt):** Der Grafana-Stack (Prometheus + Loki + Tempo + Grafana +
  OTel-Collector) ist im Vollausbau **mehrere zu betreibende Komponenten** — reale Betriebslast im
  Scale-Profil. Deshalb ist er bewusst optional und profilabhängig, nicht für alle verpflichtend.
- **Reversibilität (P8):** Sehr hoch — genau der Sinn von OTel. Ein Backend-Wechsel (auch zu einem
  kommerziellen) berührt nur die Collector-Konfiguration, nicht den instrumentierten Code.

## Vor- und Nachteile der Optionen

### Option A — OpenTelemetry + Grafana-Stack *(gewählt)*

- 👍 Offener Standard, self-hostbar, anbieterneutral austauschbar; Traces + Metriken + Logs aus
  einem kohärenten Stack; profil-skalierbar.
- 👎 Vollausbau = mehrere Komponenten; mehr Betriebswissen als eine schlüsselfertige SaaS.

### Option B — proprietäre APM-SaaS (Datadog o. ä.)

- 👍 Schlüsselfertig, ausgereifte UI, minimaler Einrichtungsaufwand, starke Korrelations- und
  Alerting-Features „out of the box" — der ehrliche Komfort- und Reifevorteil.
- 👎 Anbieter-Lock-in und laufende Kosten, **nicht self-hostbar** — ein klarer Verstoß gegen P3/QA5
  und [Leitprinzip 9](../foundation/03-leitprinzipien.md). Für eine Souveränitäts-Plattform als
  *verpflichtendes* Backend ausgeschlossen. Dank OTel bleibt es als *optionales* Backend für
  einzelne Betreiber aber jederzeit anschließbar.

### Option C — ELK/OpenSearch für Logs

- 👍 Sehr mächtige Log-Suche und -Analyse; mit OpenSearch statt Elasticsearch wäre es lizenzkonform
  und konsistent zu [ADR-0015](0015-suche-und-vektorsuche.md) — der ehrlich stärkste Punkt, zumal
  OpenSearch ohnehin im Standard/Scale-Profil vorhanden ist.
- 👎 Deckt primär Logs ab; für Metriken und Traces bräuchte es weitere Bausteine. Der Grafana-Stack
  ist insgesamt leichtgewichtiger und über Prometheus/Tempo/Loki kohärenter für die drei Signale
  aus einer Hand. (OTel erlaubt es einem Betreiber dennoch, Logs nach OpenSearch zu routen.)

### Option D — nur strukturierte Logs, ohne Traces

- 👍 Am einfachsten zu betreiben; für ein rein monolithisches System oft ausreichend.
- 👎 Für die verteilten Extraktions-Profile und die Subprozess-Connectors unzureichend: Ohne
  verteiltes Tracing lässt sich eine Störung über die Modul-/Prozessgrenzen kaum zuordnen — genau
  die Fälle, die für QA1 und R3 zählen, blieben blind.
