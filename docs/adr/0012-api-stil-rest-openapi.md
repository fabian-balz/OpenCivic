<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0012 — API-Stil & Contract-Format (REST + OpenAPI 3.1)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Architekturziel 2 (API-first); Qualitätsattribute QA1 (Nachvollziehbarkeit),
  QA2 (Barrierefreiheit/Zugänglichkeit), QA4 (Sicherheit), QA7 (Interoperabilität),
  QA8 (Performance/Skalierbarkeit); Leitprinzipien P1 (boring & bewährt), P2 (offene Standards),
  P6 (Standardschnittstellen); [ADR-0010](0010-backend-framework-nodejs-fastify.md) (Fastify Schema-First),
  [ADR-0006](0006-provenance-modell-w3c-prov.md) (Provenance), [ADR-0002](0002-architekturstil-modular-monolith.md)
  (Extraktions-Nähte); folgt [ADR-0013](0013-api-versionierung.md); Risiko R-DoS (Angriffsfläche der
  öffentlichen API)

## Kontext und Problemstellung

OpenCivic braucht eine **öffentliche** Programmierschnittstelle, über die Bürger:innen,
Journalist:innen, andere Behörden und Drittsoftware auf staatliche Fakten und deren Herkunft
zugreifen. Diese API ist bei OpenCivic kein reines Integrationsdetail, sondern selbst
**Transparenz-Instrument**: Wer eine Zahl anzweifelt, muss ihre Herkunft über dieselbe Schnittstelle
bis zur amtlichen Quelle auflösen können ([Provenance-Modell §8](../architecture/02-provenance-model.md#8-zitierbarkeit-beleg-an-der-schnittstelle),
QA1).

Damit stellt sich vor der Technikwahl eine ungewöhnliche Priorisierung: Die primäre Zielgruppe ist
teilweise **nicht-technisch**. Eine Journalistin muss die API mit Browser und `curl` erkunden
können, ohne ein Client-Framework zu installieren oder ein Schema-Query zu formulieren. Gleichzeitig
soll der Contract **maschinenlesbar und versionierbar** sein (Architekturziel 2), gut mit Fastifys
Schema-First-Ansatz ([ADR-0010](0010-backend-framework-nodejs-fastify.md)) zusammenspielen und
HTTP-Caching für Performance/Skalierung (QA8) nicht verbauen. Zu entscheiden sind daher zwei
gekoppelte Fragen: **API-Stil** und **Contract-Format**.

## Betrachtete Optionen

- **Option A — REST + OpenAPI 3.1** als Contract-Format (aus JSON Schema generiert).
- **Option B — GraphQL** (ein Endpoint, typisiertes Schema, client-definierte Queries).
- **Option C — gRPC** (Protobuf-Contracts, HTTP/2, Binärprotokoll).

## Entscheidung

**Option A — REST mit OpenAPI 3.1 als Contract-Format.**

REST bildet die Kern-Entitäten des Provenance-Modells auf ressourcenorientierte, in Browser und
`curl` **erkundbare** Pfade ab — das ist die technische Einlösung von QA2 gegenüber
nicht-technischen Zielgruppen und wirkt unmittelbar auf QA1: Der Weg von einer Zahl zu ihrem Beleg
(`GET /v1/provenance/{statementId}`) funktioniert ohne SDK, ohne Login, mit sichtbarer URL. Fakthaltige
Antworten referenzieren `Statement`-IDs; der Citation-/Provenance-Endpoint liefert die volle Kette
als PROV-JSON/JSON-LD plus menschenlesbares Citation-Objekt
([ADR-0006](0006-provenance-modell-w3c-prov.md)).

**OpenAPI 3.1** als Contract-Format nutzt Fastifys Schema-First direkt: OpenAPI 3.1 ist an JSON
Schema angeglichen, und Fastify validiert Requests/Responses ohnehin gegen JSON Schema
([ADR-0010](0010-backend-framework-nodejs-fastify.md)). Derselbe Schema-Satz validiert zur Laufzeit
und beschreibt den öffentlichen Vertrag — Doku und Implementierung können nicht auseinanderlaufen.
SDKs werden später aus diesem Contract **generiert** (Codegen) und stehen unter Apache-2.0
(Split-Lizenz, [ADR-0001](0001-lizenzmodell-split.md)).

REST ist zudem „boring & bewährt" (P1), baut auf offenen Standardschnittstellen (P2, P6), und seine
`GET`-Ressourcen sind auf Standard-Infrastruktur (CDN/Reverse-Proxy) **cachebar** — Rückenwind für
QA8. Die ressourcenorientierte Fläche hat außerdem eine **kleinere DoS-Angriffsfläche** als frei
formulierbare Queries (QA4).

Die öffentliche API bleibt REST. **gRPC** wird nicht verworfen, sondern für einen anderen Ort
reserviert: als mögliche **interne** Transportoption zwischen extrahierten Services
([ADR-0002](0002-architekturstil-modular-monolith.md) Nähte). Das ist eine spätere, reversible
Entscheidung (P8) und berührt die Bürger-API nicht.

## Konsequenzen

- **Positiv:** Beleg an der Schnittstelle ist ohne Spezialwerkzeug auflösbar (QA1/QA2); HTTP-Caching
  für Skalierung (QA8); ein Schema-Satz für Laufzeit-Validierung, Doku und SDK-Codegen (P10);
  offene, weit verbreitete Standards (P1/P2/P6); kleinere Angriffsfläche als generische Query-APIs
  (QA4).
- **Negativ / Kosten (ehrlich benannt):** Für **stark verlinkte** Abfragen (z. B. „gib mir zu jedem
  Statement gleich Source, Publisher und DatasetVersion") ist REST weniger elegant als GraphQL und
  neigt zu Over-/Under-Fetching bzw. mehreren Requests oder `expand`-Parametern. Das ist der
  **Hauptnachteil** gegenüber Option B und ein echtes Argument, das bewusst zugunsten von
  Browsbarkeit, Caching und Angriffsfläche zurückgestellt wird. Gegenmaßnahme: gezielt eingebettete
  Repräsentationen und der dedizierte Provenance-Endpoint, der die häufigste Verkettung in **einem**
  Aufruf liefert.
- **Reversibilität:** Ein GraphQL-Layer ließe sich später **additiv** vor derselben Domänenschicht
  ergänzen, ohne die REST-API abzulösen (P8) — die Entscheidung schließt Option B nicht dauerhaft
  aus, sie priorisiert nur den ersten, öffentlichen Zugang. Der Wechsel des Contract-Formats
  (OpenAPI → anderes) wäre teurer, weil SDKs, Doku und Tests daran hängen.

## Vor- und Nachteile der Optionen

### Option A — REST + OpenAPI 3.1 *(gewählt)*

- 👍 In Browser & `curl` erkundbar — direkte Einlösung von QA2 für nicht-technische Zielgruppen und,
  über den auflösbaren Beleg-Pfad, von QA1.
- 👍 `GET`-Ressourcen sind HTTP-cachebar (QA8); Standard-HTTP läuft in jedem Deployment-Profil und
  hinter jedem CDN (QA5).
- 👍 OpenAPI 3.1 sitzt passgenau auf Fastifys JSON-Schema-Validierung
  ([ADR-0010](0010-backend-framework-nodejs-fastify.md)); ein Schema-Satz für Validierung, Doku,
  Codegen (P6, P10).
- 👍 „Boring & bewährt" (P1), riesiges Tooling-Ökosystem.
- 👎 Weniger elegant bei stark verlinkten Graph-Abfragen; Over-/Under-Fetching-Neigung — hier ist
  GraphQL tatsächlich stärker.

### Option B — GraphQL

- 👍 **Flexible, client-definierte Queries** und **ein einziger Endpoint** — genau ein Roundtrip für
  tief verschachtelte, stark verlinkte Daten; für den Herkunftsgraph (`Statement → DatasetVersion →
  SourceVersion → Source`) konzeptionell sehr passend. Das ist der ernsthafteste Vorteil gegenüber
  der getroffenen Wahl und wird nicht kleingeredet.
- 👍 Typisiertes Schema mit exzellenter Introspektion und Tooling.
- 👎 **Caching ist schwieriger:** POST-basierte Queries sind nicht ohne Weiteres HTTP-cachebar —
  Nachteil bei QA8 auf Standard-Infrastruktur.
- 👎 **Größere DoS-Angriffsfläche:** beliebig tiefe/teure Queries erfordern Query-Cost-Analyse,
  Tiefenlimits und Persisted Queries als Gegenmaßnahmen (Zusatzkomplexität, QA4).
- 👎 **Höhere Einstiegshürde** und schlechter „einfach browsbar" — eine Journalistin kann eine
  GraphQL-Query nicht so trivial in die Adresszeile tippen wie eine REST-URL (QA2).

### Option C — gRPC

- 👍 **Hohe Performance** (HTTP/2, Binär-Protobuf) und **starke, streng typisierte Contracts**;
  ausgezeichnet für dienstinterne Kommunikation und damit ein realer Kandidat für den **internen**
  Transport bei künftiger Modul-Extraktion ([ADR-0002](0002-architekturstil-modular-monolith.md)).
- 👎 **Nicht direkt im Browser nutzbar** (benötigt gRPC-Web-Proxy und generierte Clients) — damit
  als **öffentliche Bürger-API** ungeeignet, weil es QA1/QA2 (Erkundbarkeit ohne Spezialwerkzeug)
  frontal verfehlt.
- 👎 Binärformat ist nicht mit `curl` inspizierbar; höhere Betriebs-/Einstiegskomplexität für Dritte.
