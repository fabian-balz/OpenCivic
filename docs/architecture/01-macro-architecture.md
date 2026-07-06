<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 01 — Makro-Architektur & Modulschnitt

Dieses Dokument beschreibt das Skelett von OpenCivic auf Makro-Ebene: Architekturstil,
die Grenze zwischen **Plattformkern** und **Fachmodulen**, den kanonischen **Datenfluss**,
die **Modul-Kommunikation** und die **Deployment-Profile**. Es zeigt das *Was*; das *Warum*
steht in den verlinkten ADRs.

Jede Aussage ist an ein [Qualitätsattribut](../foundation/06-qualitaetsattribute.md) (QA1–QA10)
oder [Entscheidungsprinzip](../foundation/08-entscheidungsprinzipien.md) (P1–P11) rückgebunden.

---

## 1. Systemkontext (C4 Level 1)

Wer und was interagiert mit OpenCivic?

```mermaid
flowchart TB
    citizen["Bürger:in / Journalist:in / NGO / Forschung<br/>(Primärnutzende, mobile-first)"]
    dev["Entwickler:in / GovTech-Dritte<br/>(nutzen offene API & SDKs)"]
    operator["Betreiber:in / Kommune<br/>(self-hostet OpenCivic)"]

    subgraph oc["OpenCivic-Plattform"]
        sys["Plattformkern + Fachmodule<br/>erfasst, bewahrt, erklärt, befähigt"]
    end

    sources["Amtliche Quellen<br/>Haushalts-/Gesetzes-/Statistik-Portale,<br/>Open-Data-APIs, Amtsblätter"]
    idp["Externer Identity Provider<br/>(OIDC, optional)"]
    ai["KI-Anbieter / lokales Modell<br/>(austauschbar, nur CivicAI)"]

    citizen -->|"stellt Fragen, folgt Belegen"| sys
    dev -->|"konsumiert API/SDK"| sys
    operator -->|"betreibt & konfiguriert"| sys
    sources -->|"reproduzierbarer Import"| sys
    sys -.->|"delegiert Login (optional)"| idp
    sys -.->|"quellenbelegte Antworten (RAG)"| ai
```

**Kernaussagen**
- Der **Nordstern** ist die Primärnutzerin; alles ist zuerst für sie gedacht (QA2, mobile-first).
- Amtliche Quellen sind **eingehend**, nie ausgehend — OpenCivic schreibt nie in staatliche Systeme.
- Externer IdP und KI-Anbieter sind **optional und austauschbar** (P3, R12) — die Plattform
  funktioniert ohne sie (nur CivicAI benötigt ein Modell).

---

## 2. Architekturstil: Modularer Monolith mit Extraktions-Nähten

Das Standard-Deployment ist **ein Prozess** (ein „Deployable"), in dem Kern und Fachmodule als
klar getrennte Module leben. Die Grenzen sind **hart** (nur über öffentliche Contracts), sodass
ein Modul bei Bedarf ohne Umbau zu einem eigenständigen Dienst **extrahiert** werden kann.

- **Warum:** erfüllt „Self-Hosting als Grad" (QA5, Architekturziel 6) — Solo-Betreiber starten mit
  einem Container; geringe Contributor-Komplexität (R9); Wartbarkeit (QA3); boring & bewährt (P1).
- **Nicht Microservices-ab-Tag-1:** verfrühter Ops-/Contributor-Overhead, zerstört den einfachen
  Self-Host (R8/R9).
- **Nicht Monolith-ohne-Grenzen:** würde zum „Big Ball of Mud", verletzt Modularität (Leitprinzip 7).

Details & Alternativen: [ADR-0002](../adr/0002-architekturstil-modular-monolith.md).

---

## 3. Container- & Modul-Landkarte (C4 Level 2)

```mermaid
flowchart TB
    subgraph client["Präsentation"]
        web["Web-App<br/>mobile-first, PWA, progressive enhancement (QA2)"]
        sdk["Generierte SDKs / API-Clients<br/>(Apache-2.0)"]
    end

    subgraph deployable["OpenCivic-Deployable (Standard: 1 Prozess)"]
        gw["API-Gateway / BFF<br/>Contract, Versionierung, AuthZ, Rate-Limit"]

        subgraph core["Plattformkern (stabil, langsam veränderlich)"]
            prov["Provenance & Source Registry ★<br/>Quelle → Version → Aussage"]
            dsr["Dataset-/Versionierungs-Registry<br/>Bronze/Silver/Gold-Metadaten, Hashes, Lineage"]
            idn["Identity & Access"]
            search["Such-Abstraktion"]
            l10n["Localization<br/>Locale / Jurisdiktion / Währung / Kalender"]
            orch["Pipeline-Orchestrierung (Schnittstelle)"]
            bus["Event-Bus (async, Outbox)"]
            reg["Plugin-/Modul-Registry"]
            obs["Observability (querschnittlich)"]
        end

        subgraph modules["Fachmodule (schnell veränderlich, ersetzbar)"]
            odata["OpenData<br/>Connector-SDK + Connector-Plugins"]
            budget["OpenBudget ★ (MVP)"]
            future["OpenLaw · OpenStatistics · OpenMunicipality<br/>Process-/Bureaucracy-Explorer · CivicAI"]
        end
    end

    subgraph data["Speicher (profilabhängig)"]
        raw["Objektspeicher<br/>Bronze: rohe Snapshots"]
        db["Relationale DB<br/>Silver/Gold + Provenance"]
        idx["Suchindex"]
    end

    web --> gw
    sdk --> gw
    gw --> modules
    gw --> core
    modules --> core
    odata --> raw
    core --> db
    search --> idx
    modules -.->|"async Events"| bus
    bus -.-> orch
```

### Plattformkern — Verantwortlichkeiten

| Kern-Baustein | Verantwortung | Bezug |
|---|---|---|
| **Provenance & Source Registry** ★ | Herzstück: registriert Quellen und verkettet *Quelle → Version → Aussage*; jede Aussage ist belegbar | QA1, Leitprinzip 2 |
| **Dataset-/Versionierungs-Registry** | Verwaltet Datensätze & -versionen über Bronze/Silver/Gold inkl. Hashes und Lineage | QA1, Architekturziel 5 |
| **Identity & Access** | AuthN (OIDC, optional extern) + AuthZ; hortet keine PII | QA4, Leitprinzip 6 |
| **Such-Abstraktion** | Einheitliche Suchschnittstelle, Backend austauschbar | QA7, P3 |
| **Localization** | Locale, **Jurisdiktion**, Währung, Kalender — die i18n-Achse ab Tag 1 | QA10, DACH-first-Entscheidung |
| **Pipeline-Orchestrierung** | Schnittstelle für ETL-Jobs (Scheduler-Adapter, austauschbar) | Architekturziel 4, P3 |
| **Event-Bus (Outbox)** | Zuverlässige asynchrone Ereignisse zwischen Ingest, Speicher und Suche | QA3, entkoppelt Schichten |
| **Plugin-/Modul-Registry** | Registriert Module & Connectoren über stabile Extension-Points | Architekturziel 10 |
| **API-Gateway / BFF** | Ein Eintrittspunkt: Contract, Versionierung, AuthZ, Rate-Limit | Architekturziel 2, QA7 |
| **Observability** | Strukturierte Logs, Metriken, Traces (offene Standards) | QA9, P6 |

### Fachmodule — Regeln

- Jedes Fachmodul **besitzt** sein Domänenmodell, seine Connectoren, seine **versionierte**
  API-Fläche und seine UI-Views.
- Jedes Fachmodul **muss** Provenance, Identity, Search und Localization des Kerns nutzen —
  **kein Eigenbau** dieser Querschnittsfunktionen (verhindert Wildwuchs, sichert QA1).
- Module sind **lose gekoppelt** und untereinander nur über öffentliche Contracts/Events
  sichtbar (Leitprinzip 7, Architekturziel 1).

Details & Alternativen: [ADR-0003](../adr/0003-plattformkern-und-modulschnitt.md).

---

## 4. Kanonischer Datenfluss — Medallion + Provenance-First

Jeder Weg von der amtlichen Quelle bis zur Anzeige durchläuft dieselben, reproduzierbaren Stufen.
Rohdaten werden **unverändert** bewahrt; jede abgeleitete Aussage ist bis zur Originalquelle
rückverfolgbar.

```mermaid
flowchart LR
    src["Amtliche Quelle"]
    conn["OpenData-Connector<br/>(deterministisch, P7)"]
    bronze["🥉 Bronze<br/>roher, unveränderlicher Snapshot<br/>+ Hash + Abrufzeit + Quell-/Lizenzmetadaten"]
    silver["🥈 Silver<br/>normalisiert; jeder Satz → Bronze verlinkt"]
    gold["🥇 Gold<br/>abfrageoptimierte Domänensichten"]
    api["API (contract-first, versioniert)"]
    ui["Web · SDK · Dritte"]

    src --> conn --> bronze --> silver --> gold --> api --> ui

    prov["Provenance-Store<br/>Quelle → Version → Aussage"]
    bronze -. schreibt .-> prov
    silver -. schreibt .-> prov
    gold -. schreibt .-> prov
    api -. liest/verlinkt Belege .-> prov

    idx["Suchindex"]
    evt(["Event: dataset.updated"])
    bronze --> evt
    evt -.-> silver
    evt -.-> gold
    evt -.-> idx
```

**Kernaussagen**
- **Bronze ist unveränderlich** und gehasht → Reproduzierbarkeit (Leitprinzip 4) und Audit-Trail
  bei Quellenänderung/Link-Rot (R3).
- Der **Provenance-Store ist kein Silo**, sondern wird aus jeder Stufe beschrieben und von der API
  gelesen — so trägt jede Antwort einen Beleg (QA1, Leitprinzip 2).
- **Trennung Ingest ↔ Speicher ↔ Präsentation** (Architekturziel 4): Ein Ingest-Lauf blockiert nie
  die Auslieferung; Events triggern Neuberechnung & Reindizierung.
- *Verworfene Alternative:* direkter Quelle→DB-Import ohne Roh-Snapshot — nicht reproduzierbar,
  kein Audit-Trail.

Details & Alternativen: [ADR-0004](../adr/0004-kanonischer-datenfluss-medallion-provenance.md).

---

## 5. Modul-Kommunikation

| Art | Wie | Wofür |
|---|---|---|
| **Synchron** | Nur über die **öffentliche** API/Schnittstelle eines Moduls (nie interne Interna) — gilt auch in-Prozess | Anfrage/Antwort, Lesezugriffe |
| **Asynchron** | **Event-Bus + Outbox-Pattern** | Ingest-/Pipeline-Ereignisse: „Dataset aktualisiert" → Silver/Gold neu berechnen → Suche reindizieren |

Das Outbox-Pattern sichert zuverlässige Zustellung (kein verlorenes Event bei Absturz) und hält
Ingest von Präsentation entkoppelt. Auch im monolithischen Solo-Profil gilt dieselbe Regel — nur
die Bus-Implementierung ist dort in-Prozess statt über einen externen Broker.

---

## 6. Deployment als Grad — dieselbe Codebasis, drei Profile

```mermaid
flowchart TB
    subgraph solo["Profil: Solo (1 Container)"]
        s1["Monolith + In-Prozess-Events<br/>eine relationale DB + eingebettete Suche"]
    end
    subgraph std["Profil: Standard (Compose)"]
        m1["Monolith"]
        m2["Relationale DB"]
        m3["Objektspeicher"]
        m4["Suchindex"]
        m5["Message-Broker"]
        m1 --- m2 & m3 & m4 & m5
    end
    subgraph scale["Profil: Scale (Kubernetes / Nomad)"]
        c1["API-Gateway"]
        c2["Extrahierte Module<br/>(nach Bedarf)"]
        c3["Kern-Dienste"]
        c4["Verwaltete/geclusterte Datenhaltung"]
        c1 --> c2 & c3 --> c4
    end

    solo -->|"wächst zu"| std -->|"wächst zu"| scale
```

- **Solo:** ein `docker compose up`, minimale Abhängigkeiten — für Kommunen, Vereine, Einzelpersonen.
- **Standard:** entkoppelte Datenhaltung + externer Broker — für produktive mittlere Instanzen.
- **Scale:** Module werden entlang ihrer bereits harten Grenzen als Dienste extrahiert und
  horizontal skaliert — für große Betreiber.

Alle drei laufen aus **derselben Codebasis**, gesteuert per Konfiguration (QA5, Architekturziel 6,
P3 keine harte Cloud-Bindung). Details: [ADR-0002](../adr/0002-architekturstil-modular-monolith.md).

---

## 7. Was hier bewusst noch offen ist

Dieses Dokument legt den *Schnitt* fest, nicht die *Technologien*. Konkrete Wahl von Sprachen,
Datenbank, Suchmaschine, Broker, KI-Schicht usw. folgt in eigenen Topics/ADRs — jeweils gegen
dieselben Qualitätsattribute begründet. Das **Provenance-Datenmodell** (Struktur von
*Quelle → Version → Aussage* inkl. Jurisdiktions-Achse) ist der nächste, inhaltlich zentrale
Schritt.
