<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0005 — Repo-Strategie: Monorepo (provisorisch)

- **Status:** Accepted (provisorisch — Deep-Dive im Topic „Monorepo vs. Polyrepo & Build-System")
- **Datum:** 2026-07-06
- **Bezug:** Architekturziele 1, 2; Qualitätsattribute QA3 (Wartbarkeit), QA6 (Testbarkeit);
  Risiko R9 (Contributor-Hürde); Split-Lizenz ([ADR-0001](0001-lizenzmodell-split.md))

## Kontext und Problemstellung

Kern und Fachmodule teilen sich zentrale Contracts (v. a. das Provenance- und Dataset-Modell).
Wie werden Code, Contracts und Doku über Repositories organisiert? Die Wahl beeinflusst, wie
leicht atomare Änderungen an geteilten Contracts sind, wie CI und Versionierung aussehen und wie
niedrig die Einstiegshürde für Contributor ist. Weil dies auch das Build-System und die
Release-Kadenz betrifft, ist hier eine **Richtungsentscheidung** nötig, die im dedizierten Topic
vertieft/bestätigt wird.

## Betrachtete Optionen

- **Option A — Monorepo:** ein Repository für Kern, Module, Contracts, Doku.
- **Option B — Polyrepo:** je Modul/Bibliothek ein eigenes Repository.
- **Option C — Hybrid:** Kern + Contracts im Monorepo, einzelne Module später auslagerbar.

## Entscheidung

**Option A — Monorepo**, mit der ausdrücklichen Möglichkeit, später einzelne Pakete auszulagern
(Option C als Ausbaustufe).

- Ein Repository (dieses) enthält `docs/`, künftig Kern, Fachmodule und geteilte Contracts.
- Die **Split-Lizenz** ([ADR-0001](0001-lizenzmodell-split.md)) wird pro Pfad/Paket über
  SPDX-Header und REUSE gezogen — ein Monorepo steht dem nicht entgegen.
- Modulgrenzen bleiben **logisch hart** (siehe [ADR-0002](0002-architekturstil-modular-monolith.md)),
  unabhängig davon, dass der Code physisch zusammenliegt.

Begründung: Atomare Änderungen an geteilten Contracts + betroffenen Modulen in **einem** Commit;
eine einheitliche CI/Contract-Governance; eine niedrige Einstiegshürde („ein Clone, alles da",
R9). Das passt zur frühen, kleinen Community und zum geteilten Provenance-Kern.

## Konsequenzen

- **Positiv:** Konsistente Contracts; einfache atomare Refactorings; ein Ort für Issues/Doku/CI;
  leichtes Onboarding.
- **Negativ / Kosten:** Braucht ein monorepo-fähiges Build-/Task-System und CI-Pfadfilter, damit
  Builds nicht monolithisch langsam werden (Detail im dedizierten Topic); Release-Kadenzen der
  Module sind zu koordinieren.
- **Reversibilität (P8):** Ein Paket lässt sich später in ein eigenes Repo auslagern (Option C),
  da die Grenzen bereits Contracts sind — die Entscheidung ist nicht sackgassig.

## Vor- und Nachteile der Optionen

### Option A — Monorepo *(gewählt)*

- 👍 Atomare Cross-Cutting-Änderungen; einheitliche CI & Governance; niedrigste Contributor-Hürde.
- 👎 Erfordert Build-Tooling mit Change-Detection; potenziell große Checkouts mit der Zeit.

### Option B — Polyrepo

- 👍 Unabhängige Release-Kadenz je Modul; klare physische Eigentümerschaft.
- 👎 Änderungen an geteilten Contracts erfordern koordinierte Multi-Repo-PRs; keine atomaren
  Cross-Cuts; höherer Onboarding- und Governance-Aufwand (R9).

### Option C — Hybrid

- 👍 Balance; Kern konsistent, Module auslagerbar.
- 👎 Zwei Modelle gleichzeitig zu pflegen; sinnvoll erst, wenn ein Modul eigene Kadenz wirklich
  braucht → daher **später** als Ausbaustufe, nicht als Startpunkt.
