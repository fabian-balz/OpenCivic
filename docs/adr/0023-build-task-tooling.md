<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0023 — Build-/Task-Tooling (pnpm-Workspaces + Nx, Poetry)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Vertieft [ADR-0005](0005-repo-strategie-monorepo.md) (Monorepo, provisorisch);
  Qualitätsattribute QA3 (Wartbarkeit/Evolvierbarkeit), QA6 (Testbarkeit), QA8
  (Performance/Skalierbarkeit — hier: CI-Skalierung); Leitprinzipien P1 (Boring & bewährt),
  P4 (lizenzkompatible Abhängigkeiten), P8 (Reversibilität), P11 (TCO über 10 Jahre);
  Risiken R9 (Contributor-Hürde); Split-Lizenz ([ADR-0001](0001-lizenzmodell-split.md));
  Modulgrenzen ([ADR-0002](0002-architekturstil-modular-monolith.md)); Sprachen
  ([ADR-0009](0009-programmiersprachen-typescript-python.md))

## Kontext und Problemstellung

[ADR-0005](0005-repo-strategie-monorepo.md) hat die Richtung **Monorepo** gesetzt, aber
ausdrücklich offen gelassen, mit welchem konkreten Werkzeug das Repository verwaltet, verlinkt und
gebaut wird — und dabei zwei Kosten benannt: Es braucht (a) ein monorepo-fähiges Build-/Task-System
mit Change-Detection, damit die CI nicht monolithisch langsam wird, und (b) einen strikten
Dependency-Graphen, damit geteilte Contracts nicht durch versehentliche Querabhängigkeiten
aufweichen.

Diese Wahl ist zweischichtig:

1. **Paketmanager / Workspace-Verlinkung** — wie die vielen TypeScript-Pakete (Kern-Plugins,
   Fachmodule, geteilte Contracts, SDKs, Frontend) im Repo verknüpft und ihre Abhängigkeiten
   reproduzierbar aufgelöst werden.
2. **Task-/Build-Orchestrierung** — wie Build, Test, Lint und Typecheck über viele Pakete hinweg
   ausgeführt werden, ohne bei jedem Commit *alles* neu zu bauen.

Erschwerend kommt die **zweite Sprache** hinzu: Nach
[ADR-0009](0009-programmiersprachen-typescript-python.md) sind die OpenData-Connectors in Python
geschrieben. Ihre Abhängigkeiten (oft schwergewichtige Scraping-/Parsing-Bibliotheken) dürfen den
TypeScript-Teil nicht kontaminieren und brauchen eine eigene, ebenfalls reproduzierbare
Isolationsschicht.

Der Contributor-Pool ist klein und wechselt (R9): Das Tooling muss mit *einem* `clone` + *einem*
Bootstrap-Befehl produktiv sein und darf keine steile, eigene Lernkurve als Eintrittsbarriere
aufbauen (P1, P11).

## Betrachtete Optionen

- **Option A — pnpm-Workspaces + Nx (TS) & Poetry (Python).** Strikter Content-addressable-Store,
  affected-Builds und Task-Caching über Nx; Python getrennt über Poetry.
- **Option B — pnpm/npm/yarn-Workspaces *ohne* Task-Orchestrator.** Nur der native
  Workspace-Mechanismus des Paketmanagers, Tasks über Skripte / `--filter`.
- **Option C — pnpm-Workspaces + Turborepo (TS) & Poetry (Python).** Wie A, aber Turborepo statt
  Nx als Orchestrator.
- **Option D — Bazel (polyglott, ein Werkzeug für TS und Python).** Ein hermetisches Build-System
  für beide Sprachen.
- **Option E — Polyrepo.** In [ADR-0005](0005-repo-strategie-monorepo.md) bereits verworfen; hier
  nur zur Vollständigkeit referenziert, nicht neu ausgerollt.

## Entscheidung

**Option A — pnpm-Workspaces + Nx für den TypeScript-Teil, Poetry für die Python-Connectors.**

**pnpm-Workspaces** als Paketmanager: pnpm nutzt einen Content-addressable-Store mit
Hardlinks (platzsparend, schnelle Installs) und — entscheidend — ein **striktes, nicht-flaches
`node_modules`-Layout**. Ein Paket sieht nur die Abhängigkeiten, die es explizit deklariert hat;
undeklarierte transitive „phantom dependencies" brechen den Build, statt zufällig zu funktionieren.
Das macht den Dependency-Graphen zu einer erzwungenen Wahrheit und stützt damit die harten
Modulgrenzen aus [ADR-0002](0002-architekturstil-modular-monolith.md) auf der Ebene der
Paketauflösung. Das `pnpm-lock.yaml` liefert reproduzierbare, deterministische Installs (P4).

**Nx** als Task-/Build-Orchestrator: Nx baut aus den Paket-Abhängigkeiten einen Projektgraphen und
führt Tasks (build, test, lint, typecheck) nur für die von einer Änderung **tatsächlich betroffenen**
Projekte aus (`nx affected`) — mit lokalem und CI-weitem Berechnungs-Cache. Damit skaliert die CI
mit der Größe des Diffs, nicht mit der Größe des Repos — die in
[ADR-0005](0005-repo-strategie-monorepo.md) benannte Hauptkosten des Monorepos wird direkt adressiert
(QA8 auf der CI-Ebene, QA6).

**Nx bewusst statt Turborepo:** Beide leisten das Kernproblem (affected-Builds, Caching) gut.
Ausschlaggebend ist die **Governance-/Neutralitätslogik**, die OpenCivic bereits an anderer Stelle
konsequent anwendet: SvelteKit statt Next.js ([ADR-0011](0011-frontend-framework-sveltekit.md)),
OpenSearch statt Elasticsearch ([ADR-0015](0015-suche-und-vektorsuche.md)). Turborepo ist eng an
das Vercel-Ökosystem gekoppelt — dieselbe Single-Vendor-Plattform-Nähe, die dort jeweils als
Risiko benannt wurde. Nx wird von einem eigenständigen Anbieter (Nrwl/Nx) mit breiter, nicht an
eine Hosting-Plattform gebundener Adoption gepflegt und ist als reines Build-Werkzeug ohnehin
leichter reversibel (siehe Konsequenzen). Der Unterschied ist ehrlich **gering** — es ist eine
Präferenzentscheidung nach P-Logik, kein technischer K.-o.

**Poetry** für die Python-Connectors: Ein separates, per Connector-Paket gepflegtes
`pyproject.toml` + `poetry.lock` liefert reproduzierbare Installs und isoliert die (teils schweren)
Scraping-/Parsing-Abhängigkeiten sauber vom TS-Teil. Die Connectors bleiben Nx nur als
„opake" Ziele bekannt (Nx ruft Poetry-Tasks auf), ohne dass Nx den Python-Abhängigkeitsbaum
verstehen muss — die Sprachgrenze aus [ADR-0009](0009-programmiersprachen-typescript-python.md)
bleibt auch im Build-System eine klare Naht.

Die **Split-Lizenz** ([ADR-0001](0001-lizenzmodell-split.md)) bleibt pro Paket über SPDX-Header
und REUSE erhalten — Workspace-Verlinkung und Orchestrierung ändern nichts an der pfad-/paketweisen
Lizenzzuordnung.

## Konsequenzen

- **Positiv:** CI skaliert mit dem Diff statt mit dem Repo (affected + Cache); strikter
  Dependency-Graph verhindert Phantom-Abhängigkeiten und stützt Modulgrenzen; ein Bootstrap-Befehl
  pro Sprache; reproduzierbare Lockfiles auf beiden Seiten (P4); keine Bindung an eine
  Hosting-Plattform.
- **Negativ / Kosten (ehrlich benannt):** Nx ist ein zusätzliches Werkzeug mit eigener Konfiguration
  (`nx.json`, Projekt-Targets, Generatoren) — eine reale, wenn auch moderate Zusatz-Lernkurve
  gegenüber „nur Workspaces" (Option B) und ein Spannungsfeld mit R9/P1. Zwei getrennte
  Paketmanager (pnpm + Poetry) bedeuten zwei Lockfile-Welten und zwei Dependency-Audit-Pfade.
- **Reversibilität (P8):** Nx ist ein **Build-Werkzeug, kein Runtime-Lock-in.** Die Pakete bleiben
  standardkonforme pnpm-Workspaces mit gewöhnlichen `package.json`-Skripten; Nx orchestriert nur
  deren Ausführung. Ein späterer Wechsel des Orchestrators (zu Turborepo, zu reinen Skripten oder
  zu Bazel) betrifft die CI-Verdrahtung, nicht den ausgelieferten Code oder die Laufzeit. Der
  Paketmanager-Wechsel (pnpm ↔ npm/yarn) wäre aufwendiger, aber ebenfalls kein Runtime-Belang.

## Vor- und Nachteile der Optionen

### Option A — pnpm-Workspaces + Nx & Poetry *(gewählt)*

- 👍 Strikter, phantom-freier Dependency-Graph (pnpm) stützt Modulgrenzen auf Auflösungsebene;
  affected-Builds + Cache (Nx) lösen die Monorepo-CI-Kosten direkt; neutraler, nicht
  plattform-gebundener Anbieter; reversibel, weil reines Build-Werkzeug (P8).
- 👎 Nx ist ein zusätzliches Werkzeug mit eigener Konfigurations- und Konzeptfläche — moderate
  Zusatz-Lernkurve (R9); zwei Lockfile-/Audit-Welten durch pnpm + Poetry.

### Option B — Workspaces ohne Task-Orchestrator

- 👍 Kein Zusatzwerkzeug, minimale Lernkurve, maximal „boring" (P1) — für ein kleines Repo völlig
  ausreichend und der ehrlich einfachste Einstieg.
- 👎 Keine affected-Builds, kein Task-Cache: Die CI baut/testet tendenziell *alles* bei jeder
  Änderung. Genau die in [ADR-0005](0005-repo-strategie-monorepo.md) benannte Monorepo-Kosten
  bleibt ungelöst und wird mit wachsendem Repo zum Engpass (QA8-CI, QA6). Nachrüstbar, aber dann
  als Migration statt als Fundament.

### Option C — pnpm-Workspaces + Turborepo & Poetry

- 👍 Sehr einfache Konfiguration, schnell, exzellente Developer-Experience — in reiner Technik der
  stärkste, praktisch ebenbürtige Herausforderer zu Nx; für viele Teams die pragmatischste Wahl.
- 👎 Enge Kopplung an das Vercel-Ökosystem — dieselbe Single-Vendor-Plattform-Nähe, die OpenCivic
  bei Next.js ([ADR-0011](0011-frontend-framework-sveltekit.md)) und Elasticsearch
  ([ADR-0015](0015-suche-und-vektorsuche.md)) bewusst gemieden hat. Governance-/Neutralitätsrisiko
  (P2/P8-nah), technisch aber gleichwertig — die Ablehnung ist eine Prinzipien-, keine
  Fähigkeitsfrage.

### Option D — Bazel (polyglott)

- 👍 Maximale, hermetische Reproduzierbarkeit und *ein* Werkzeug für TS **und** Python — theoretisch
  die sauberste Antwort auf die Zwei-Sprachen-Situation; bei sehr großen, polyglotten Monorepos
  (Google-Maßstab) unerreicht.
- 👎 Hohe Komplexität und steile Lernkurve (eigene Build-Sprache, `BUILD`-Dateien, Toolchain-Pflege);
  für ein kleines, wechselndes Freiwilligen-Team eine massive Eintrittsbarriere. Widerspricht
  direkt R9 (Contributor-Hürde) und P1 (Boring & bewährt für *dieses* Team) — der Aufwand steht in
  keinem Verhältnis zur aktuellen Repo-Größe (P11).

### Option E — Polyrepo

- 👍 Unabhängige Release-Kadenz je Paket (siehe [ADR-0005](0005-repo-strategie-monorepo.md)).
- 👎 In [ADR-0005](0005-repo-strategie-monorepo.md) bereits als Startpunkt verworfen (keine atomaren
  Cross-Cutting-Änderungen an geteilten Contracts, höherer Onboarding-Aufwand). Hier nicht erneut
  aufgerollt.
