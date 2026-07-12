<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0024 — IaC & Orchestrierung (OpenTofu + Kubernetes/k3s)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** [Architekturziel 5](../foundation/07-architekturziele.md) (Reproduzierbarkeit),
  [Architekturziel 6](../foundation/07-architekturziele.md) (Self-Hosting als Grad);
  Qualitätsattribute QA5 (Portabilität/Cloud-Neutralität/Self-Hosting), QA3 (Wartbarkeit);
  Entscheidungsprinzipien P2 (offene Standards), P3 (keine harten Cloud-Abhängigkeiten),
  P4 (lizenzkompatible Abhängigkeiten), P8 (Reversibilität);
  [Leitprinzip 9](../foundation/03-leitprinzipien.md) (Souveränität);
  Risiken [R9](../foundation/09-risiken.md) (Komplexität schreckt ab),
  [R10](../foundation/09-risiken.md) (Technologie-Veraltung); baut auf
  [ADR-0002](0002-architekturstil-modular-monolith.md) (Deployment-Profile) auf.

## Kontext und Problemstellung

Infrastruktur muss deklarativ, versioniert und reproduzierbar beschrieben sein
([Leitprinzip 4](../foundation/03-leitprinzipien.md)) — nicht per Klick oder Shell-Historie. Für
das Scale-Profil aus [ADR-0002](0002-architekturstil-modular-monolith.md) braucht es zusätzlich
eine echte Orchestrierung mit Selbstheilung, horizontaler Skalierung und Hochverfügbarkeit.
Gleichzeitig gilt eine harte Nebenbedingung: OpenCivic darf sich **weder an einen Cloud-Anbieter
noch an einen Werkzeug-Anbieter** binden, der die Bedingungen später einseitig ändern kann (P2,
P3, P4). Und die kleinen Betreiber — Einzelpersonen, Kommunen, Vereine — dürfen von dieser
Komplexität nicht abgeschreckt werden ([R9](../foundation/09-risiken.md)).

Zu entscheiden sind also zwei Dinge: **womit** Infrastruktur beschrieben wird (IaC-Werkzeug) und
**worauf** sie im Scale-Fall läuft (Orchestrierung).

## Betrachtete Optionen

**IaC-Werkzeug:**

- **Option A — Terraform (HashiCorp):** das verbreitetste IaC-Werkzeug mit dem größten
  Provider-Ökosystem.
- **Option B — OpenTofu (Linux Foundation):** herstellerneutraler, lizenzkompatibler Fork von
  Terraform.
- **Option C — Pulumi:** IaC in echten Programmiersprachen (TypeScript, Python …).

**Orchestrierung (Scale):**

- **Option D — Kubernetes / k3s:** CNCF-Standard mit breiter Multi-Vendor-Basis; k3s als
  leichtgewichtige Distribution.
- **Option E — HashiCorp Nomad:** einfacherer Orchestrator als Kubernetes.
- **Option F — reines Docker-Compose auch im Scale-Profil.**

## Entscheidung

**IaC via OpenTofu (Option B); Scale-Orchestrierung über Kubernetes mit k3s als leichtem Einstieg
(Option D). Solo/Standard bleiben Docker-Compose.**

OpenTofu ist der lizenzkompatible Ausweg aus einem konkreten Governance-Risiko: HashiCorps Wechsel
von der MPL zur **Business Source License (BSL)** ist genau das Single-Vendor-Lizenzrisiko, das
P2/P3/P4 ausschließen sollen. OpenTofu ist API-kompatibel, steht unter dem neutralen Dach der Linux
Foundation und wird von mehreren unabhängigen Beteiligten getragen. Das ist **dieselbe
Entscheidungsmechanik**, die diese Architekturphase bereits bei
[OpenSearch statt Elasticsearch](0015-suche-und-vektorsuche.md) (SSPL) und
[Nx statt Turborepo](0023-build-task-tooling.md) angewandt hat — ein bewusst durchgehaltener roter
Faden, kein Einzelfall.

Kubernetes ist für das Scale-Profil der herstellerneutrale De-facto-Standard: eine breite,
unabhängige Anbieterbasis bedeutet, dass dieselbe Deklaration auf Bare-Metal, k3s oder jedem
konformen Managed-Cluster läuft (P3; [Leitprinzip 9](../foundation/03-leitprinzipien.md)). **k3s**
liefert genau diese Kubernetes-API als ressourcensparsame Single-Binary-Distribution — der schonende
Einstieg für Self-Hoster und Kommunen, ohne die volle K8s-Betriebslast.

Entscheidend ist die Staffelung: **Kubernetes ist nicht Pflicht.** Solo- und Standard-Betreiber
bleiben bei Docker-Compose aus [ADR-0002](0002-architekturstil-modular-monolith.md); ein einziges
`docker compose up` genügt ([R9](../foundation/09-risiken.md)). Orchestrierung greift erst dort, wo
Selbstheilung und HA wirklich gebraucht werden.

## Konsequenzen

- **Positiv:** Kein Lizenz- oder Anbieter-Klumpenrisiko im Infrastruktur-Unterbau (P2/P3/P4);
  cloud-neutrale, reproduzierbare Deklaration (QA5, Leitprinzip 4); ein gradueller Pfad von
  Compose über k3s bis Kubernetes ohne Architekturbruch (Architekturziel 6).
- **Negativ / Kosten (ehrlich benannt):** OpenTofu hat ein **jüngeres, kleineres Ökosystem** als
  Terraform; einzelne kommerzielle Provider oder Tutorials sind zuerst auf Terraform ausgerichtet.
  Kubernetes bringt selbst als k3s eine reale Lernkurve und Betriebslast mit — deshalb ist es
  bewusst auf das Scale-Profil begrenzt und nicht der Standardpfad.
- **Reversibilität (P8):** Hoch für IaC — OpenTofu ist zu Terraform-HCL kompatibel, ein
  Rückwechsel wäre technisch möglich (wird aus Lizenzgründen aber nicht gewollt). Mittel für die
  Orchestrierung: Compose- und Kubernetes-Deklarationen sind getrennte Artefakte, die nebeneinander
  gepflegt werden; ein Betreiber kann auf seinem Profil bleiben.

## Vor- und Nachteile der Optionen

### Option A — Terraform

- 👍 Größtes IaC-Ökosystem, meiste Provider, umfangreichste Community und Dokumentation — das
  stärkste sachliche Argument für Terraform und ein echtes Gegenargument zur getroffenen Wahl.
- 👎 BSL-Lizenz: Ein Einzelanbieter kann die Nutzungsbedingungen ändern — für eine
  Souveränitäts-Plattform ein **Ausschlusskriterium** (P2/P3/P4), unabhängig von der technischen
  Qualität.

### Option B — OpenTofu *(gewählt)*

- 👍 Lizenzkompatibel (MPL, Linux Foundation), herstellerneutral, API-kompatibel zu Terraform —
  löst das Governance-Risiko, ohne die HCL-Kompetenz der Community zu entwerten.
- 👎 Jüngeres, kleineres Ökosystem; leichter Nachlauf bei brandneuen Provider-Features gegenüber
  Terraform — bewusst akzeptiert.

### Option C — Pulumi

- 👍 IaC in echten Programmiersprachen (TypeScript passte zur [Sprachwahl](0009-programmiersprachen-typescript-python.md)),
  volle Testbarkeit und Schleifen/Abstraktionen ohne HCL-Grenzen — in der Ausdrucksstärke der
  ehrlich stärkste Ansatz.
- 👎 Stärkere Anbieter-Gravitation über den gehosteten State-Service; die volle Erfahrung ist auf
  das kommerzielle Angebot ausgerichtet — Spannung zu P3. Der HCL-Standard ist zudem branchenweit
  verbreiteter (P2).

### Option D — Kubernetes / k3s *(gewählt für Scale)*

- 👍 Herstellerneutraler CNCF-Standard mit breitester Multi-Vendor-Basis → maximale
  Cloud-Neutralität (P3); k3s macht denselben Standard klein und self-hostbar (R9).
- 👎 Reale Komplexität und Betriebslast — deshalb bewusst auf Scale begrenzt, nicht als
  Standardpfad erzwungen.

### Option E — HashiCorp Nomad

- 👍 Deutlich einfacher zu betreiben als Kubernetes — der ehrlich stärkste Punkt für kleine bis
  mittlere Cluster, die keine volle K8s-Komplexität wollen.
- 👎 Erheblich kleineres Ökosystem und schmalere Anbieterbasis; zudem ebenfalls unter
  HashiCorp-BSL-Governance — dasselbe Lizenzrisiko wie Terraform, das die Wahl untergräbt.

### Option F — Docker-Compose auch im Scale

- 👍 Maximale Einfachheit, ein Werkzeug über alle Profile.
- 👎 Keine echte Orchestrierung: keine Selbstheilung, kein automatisches horizontales Skalieren,
  keine HA über Knoten — für das Scale-Profil unzureichend. Genau dafür bleibt Compose auf
  Solo/Standard beschränkt.
