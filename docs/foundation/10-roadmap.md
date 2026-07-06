<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 10. Roadmap

Grob und **ergebnis-, nicht datumsgetrieben**. Jede Phase liefert ein überprüfbares Ergebnis.

## Phase 0 — Fundament *(aktuell)*

Vision–Roadmap, Governance-Grundzüge, Lizenzentscheidung, Repo-Strategie.
**Ergebnis:** geteiltes Verständnis + [`docs/foundation/`](.) + erste ADRs.

## Phase 1 — Architektur & Referenz-Datenmodell

Plattformkern-Architektur, Provenance-Datenmodell, API-Design-Standards, Tech-Stack-Entscheidungen
als ADRs, „Walking Skeleton".
**Ergebnis:** architektonisch begründete Grundlage, noch minimal Code.

## Phase 2 — MVP: erstes Fachmodul end-to-end

**OpenData → OpenBudget** vollständig: Import-Pipeline → Provenance-Speicher → API →
barrierefreies, mobiles Frontend → Suche. Beweist den vertikalen Durchstich inkl.
Reproduzierbarkeit & WCAG.
**Ergebnis:** nutzbare, zitierfähige Anwendung + Referenzarchitektur für alle weiteren Module.

## Phase 3 — Plattform härten

Plugin-/Erweiterungssystem, API-Versionierung, Self-Hosting-Profile (Compose → skalierbar),
Observability, Security-Audit, i18n-Framework, Betreiber-Doku.

## Phase 4 — Zweites & drittes Modul + CivicAI

OpenLaw und/oder Process Explorer; CivicAI als **quellenbelegter** Assistent (striktes RAG) auf
dem gemeinsamen Provenance-Fundament.

## Phase 5 — Ökosystem & Community-Skalierung

OpenMunicipality/Bureaucracy Explorer, Konnektoren-Marktplatz, Übersetzungen, Governance-Reife
(Stiftung/Steering-Committee), Nachhaltigkeitsfinanzierung.

---

> **Priorisierungsregel:** gemeinsamer Kern zuerst, ein Modul exzellent vor vielen
> mittelmäßigen, jederzeit ein lauffähiger, nachvollziehbarer vertikaler Durchstich.
