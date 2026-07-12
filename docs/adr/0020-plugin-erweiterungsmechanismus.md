<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0020 — Erweiterungsmechanismus (Fastify-Plugins + Manifest, kein Runtime-Hot-Loading)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Architekturziel 10 („Erweiterbarkeit ohne Fork"); Qualitätsattribute QA1
  (Nachvollziehbarkeit), QA3 (Wartbarkeit/Evolvierbarkeit), QA4 (Sicherheit/Datenschutz);
  Leitprinzipien P1 (boring & bewährt), P5 (wenige Sprachen/Nähte), P8 (Reversibilität),
  P9 (sichere Voreinstellungen); Risiko R11 (Ausführung nicht vertrauenswürdigen Codes);
  [ADR-0002](0002-architekturstil-modular-monolith.md), [ADR-0003](0003-plattformkern-und-modulschnitt.md),
  [ADR-0010](0010-backend-framework-nodejs-fastify.md), [ADR-0016](0016-pipeline-orchestrierung.md)

## Kontext und Problemstellung

Architekturziel 10 fordert **„Erweiterbarkeit ohne Fork"**: Dritte sollen Fachmodule (OpenLaw,
OpenProcurement …) und Datenquellen hinzufügen können, ohne den Kern zu patchen oder einen eigenen
Branch dauerhaft zu pflegen. Die Frage ist **nicht ob**, sondern **mit welchem Mechanismus** —
und mit welcher Vertrauens- und Ausführungsgrenze.

Die Spannung: Ein maximal offenes System (fremder Code wird zur Laufzeit nachgeladen) maximiert
Bequemlichkeit, kollidiert aber frontal mit den zwei höchstpriorisierten Anliegen von OpenCivic —
**Nachvollziehbarkeit** (QA1: was läuft, muss aus Lockfile/SBOM reproduzierbar sein) und
**Sicherheit** (QA4/R11: nicht vertrauenswürdiger Code darf nicht ungeprüft im Kernprozess laufen).
Zugleich soll kein exotisches Eigenbau-Framework entstehen, wo mit der Fastify-Plugin-Kapselung
([ADR-0010](0010-backend-framework-nodejs-fastify.md)) bereits ein bewährter, neutral governter
Erweiterungsmechanismus existiert (P1).

## Betrachtete Optionen

- **Option A — Fastify-Plugin + Manifest, Einbindung zur Build-/Deploy-Zeit** (kein
  Runtime-Loading).
- **Option B — Dynamisches Runtime-Plugin-Loading mit Sandbox** (z. B. WASM-Isolate für echte
  Drittanbieter-Isolation).
- **Option C — Eigener Microkernel / eigenes Plugin-SDK** (proprietärer Erweiterungs-Layer über
  Fastify).
- **Option D — Erweiterung ausschließlich per Fork** (kein Extension-Mechanismus).

## Entscheidung

**Option A — Fastify-Plugin-Mechanismus als Erweiterungspunkt, plus deklarativer Manifest-Contract,
Einbindung zur Build-/Deploy-Zeit.**

Ein Fachmodul ist ein **npm-Paket**, das einen dokumentierten **Manifest-Contract** erfüllt
(deklariert Routen/Version, benötigte Kern-Fähigkeiten, Migrationen, i18n-Kataloge,
Provenance-Typen) und sich beim Boot an der Plugin-/Modul-Registry des Kerns
([ADR-0003](0003-plattformkern-und-modulschnitt.md)) registriert. Die Fastify-Kapselung erzwingt
dabei die Modulgrenze strukturell ([ADR-0002](0002-architekturstil-modular-monolith.md)) — ein
Modul erreicht Kern-Fähigkeiten nur über explizit dekorierte Contracts, nie über interne Zustände.
OpenData-Connectors nutzen den bereits etablierten **Python-Subprozess-Contract**
([ADR-0016](0016-pipeline-orchestrierung.md)) und liegen damit ohnehin außerhalb des Kernprozesses.

**Bewusst kein Runtime-Hot-Loading fremden Codes.** Module werden zur Build-/Deploy-Zeit
eingebunden; was läuft, steht vollständig im Lockfile und in der SBOM. Ein „Marktplatz" bedeutet
**kuratierte, versionierte Pakete**, nicht dynamisches Nachladen. Die Stabilität der Extension-Points
wird über **semantische Versionierung des Kern-Contracts** gesichert (`coreContract`-Range im
Manifest, fail-fast beim Boot).

Diese Entscheidung folgt der Leitregel bei Konflikten — **Korrektheit & Nachvollziehbarkeit schlagen
Bequemlichkeit** — und ordnet QA1/QA4 bewusst über die Redeploy-Freiheit, die Option B böte.

Die ausführliche Herleitung mit Diagrammen steht in
[../architecture/09-plugin-system.md](../architecture/09-plugin-system.md).

## Konsequenzen

- **Positiv:** Kein Eigenbau — der bewährte, neutral governte Fastify-Mechanismus trägt die
  Erweiterbarkeit (P1). „Ohne Fork" ist strukturell erreichbar. Reproduzierbarkeit und
  Auditierbarkeit bleiben vollständig (Lockfile + SBOM), weil kein Code zur Laufzeit
  hinzukommt (QA1). Nicht vertrauenswürdiger Code läuft nie ungeprüft im Kernprozess (QA4/R11).
  Modulgrenzen sind über die Kapselung strukturell, nicht nur disziplinarisch gesichert.
- **Negativ / Kosten (ehrlich benannt):** Jede Erweiterung erfordert einen **bewussten
  Build-/Deploy-Schritt** — kein Hinzufügen „on the fly" im laufenden Betrieb. Das ist der reale
  Preis gegenüber Option B und für Betreiber, die ein App-Store-artiges Sofort-Installieren
  erwarten, spürbar. Zudem laufen kuratierte Module **in-process** und damit ohne echte
  Speicher-/Ressourcen-Isolation gegen den Kern — vertretbar **nur**, weil die
  Vertrauensschwelle an den bewussten Deploy verlagert ist (kuratierte, geprüfte Pakete).
- **Reversibilität (P8):** Hoch. Der Manifest-Contract und die Registry sind genau die Nähte,
  entlang derer sich später ein **isoliertes Ausführungsmodell für nicht vertrauenswürdige
  Dritt-Plugins** (Option B, z. B. WASM-Isolate) **additiv** ergänzen ließe — als zweiter,
  gesandboxter Ausführungspfad neben dem kuratierten In-Process-Pfad, ohne die jetzige Architektur
  zu verwerfen. Die heutige Entscheidung verbaut den späteren Ausbau nicht, sie verschiebt ihn nur
  auf den Zeitpunkt, an dem der Bedarf real und der Sicherheitsaufwand gerechtfertigt ist.

## Vor- und Nachteile der Optionen

### Option A — Fastify-Plugin + Manifest, Build-/Deploy-Zeit *(gewählt)*

- 👍 Nutzt einen bewährten, neutral governten Mechanismus statt Eigenbau (P1); volle
  Reproduzierbarkeit/Auditierbarkeit über Lockfile + SBOM (QA1); kein ungeprüfter Fremdcode im
  Kernprozess (QA4/R11); Modulgrenze durch Kapselung strukturell erzwungen (QA3).
- 👎 Erweiterung nur per bewusstem Redeploy; In-Process-Module ohne echte Laufzeit-Isolation —
  tragbar nur unter der Annahme kuratierter, vertrauenswürdiger Pakete.

### Option B — Dynamisches Runtime-Loading mit Sandbox (z. B. WASM-Isolate)

- 👍 **Erweiterung ohne Redeploy** und **echte Isolation nicht vertrauenswürdiger
  Drittanbieter** — in beiden Punkten ist diese Option der gewählten **tatsächlich überlegen** und
  wäre der richtige Weg, sobald ein offener Plugin-Markt ohne Kuratierung Ziel würde. Sie ist die
  ernsthafteste Alternative.
- 👎 Erhebliche Sicherheits- und Komplexitätslast (Sandbox-Härtung, Ressourcen-Governance,
  Fähigkeits-Vermittlung an isolierten Code); schwächt Reproduzierbarkeit/Auditierbarkeit, weil zur
  Laufzeit geladener Code die „was läuft = Lockfile/SBOM"-Garantie aufweicht — direkter Konflikt mit
  QA1/QA4. Als **möglicher späterer Ausbau** (P8) sinnvoll, nicht als heutiger Startpunkt.

### Option C — Eigener Microkernel / eigenes Plugin-SDK

- 👍 Maximale Kontrolle über die Extension-Semantik; theoretisch exakt auf OpenCivic zugeschnitten.
- 👎 **Wiedererfindung dessen, was die Fastify-Plugin-Kapselung schon leistet** (Grenzen,
  Decorators, Lifecycle) — mehr Eigencode, mehr Wartungslast, weniger Community-Erprobung; verstößt
  gegen P1 (boring & bewährt) ohne kompensierenden Nutzen.

### Option D — Erweiterung ausschließlich per Fork

- 👍 Konzeptionell trivial, kein Mechanismus zu bauen; volle Freiheit im Fork.
- 👎 **Verletzt Architekturziel 10 „Erweiterbarkeit ohne Fork" direkt**; jeder Fork driftet vom
  Upstream ab, Sicherheits-/Provenance-Fixes müssen manuell nachgezogen werden (QA3/QA4
  verschlechtern sich über die Zeit) — kein tragfähiges Modell für eine langlebige Community.
