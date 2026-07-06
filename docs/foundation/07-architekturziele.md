<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 7. Architekturziele

Strukturelle Zielbilder für die Architekturphase. Sie sind noch technologiefrei — konkrete
Technologien werden als [ADRs](../adr/) gegen diese Ziele begründet.

1. **Modulare Plattform, austauschbare Fachmodule.** Ein stabiler Kern (Identität, Provenance,
   Suche, API-Gateway, Plugin-Registry); Fachmodule (OpenBudget, OpenLaw, …) als lose gekoppelte,
   unabhängig deploybare Einheiten.
2. **API-first & vertragsbasiert.** Jede Fähigkeit ist zuerst eine API (dokumentierter,
   versionierter Contract); die UI ist nur ein Konsument unter vielen.
3. **Datenprovenienz als First-Class-Konzept.** Ein plattformweites Modell für
   *Quelle → Version → Aussage*, das jedes Modul teilt.
4. **Trennung von Ingest, Speicher und Präsentation.** ETL/Import ist von der Auslieferung
   entkoppelt; Rohdaten werden unverändert bewahrt (Bronze/Silver/Gold-Schichten).
5. **Reproduzierbarkeit von Code *und* Daten.** Versionierte Datensätze, deterministische
   Pipelines, reproduzierbare Builds/Container.
6. **Self-Hosting als Grad, nicht als Alles-oder-nichts.** „Kleine" Betreiber starten mit einem
   Docker-Compose; „große" skalieren horizontal — dieselbe Codebasis.
7. **Progressive Enhancement & Offline-Fähigkeit** im Frontend; die Kernfunktion ist ohne
   JavaScript nutzbar.
8. **Sicherheit & Datenschutz architektonisch verankert** — Zero-Trust zwischen Modulen,
   minimale Datenerhebung, Mandantenfähigkeit optional.
9. **Beobachtbarkeit eingebaut** — strukturierte Logs, Metriken und Traces über offene Standards.
10. **Erweiterbarkeit ohne Fork** — Plugin-/Erweiterungsmechanismus, stabile Extension-Points,
    semantische API-Versionierung.
