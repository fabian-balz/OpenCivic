<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0011 — Frontend-Framework: SvelteKit

- **Status:** Accepted
- **Datum:** 2026-07-09
- **Bezug:** Architekturziel 7 (Progressive Enhancement & Offline-Fähigkeit, „Kernfunktion ohne
  JavaScript nutzbar"); Qualitätsattribute QA2 (Barrierefreiheit), QA8 (Performance); Leitprinzip 5
  (Barrierefreiheit ist Voraussetzung), 9 (Souveränität/Neutralität); Risiken R7, R9

## Kontext und Problemstellung

OpenCivic ist Mobile-First, muss WCAG 2.2 AA erfüllen und laut Architekturziel 7 in seiner
**Kernfunktion ohne JavaScript nutzbar** sein — nicht als nachträgliches Fallback, sondern als
architektonische Vorgabe. Gleichzeitig muss die Oberfläche komplexe, interaktive Datenexploration
tragen (z. B. Haushalts-Suche/-Filter in OpenBudget) und über 10+ Jahre von vielen wechselnden
Freiwilligen wartbar bleiben, ohne dass die „ohne JS nutzbar"-Eigenschaft mit der Zeit erodiert.

## Betrachtete Optionen

- **Option A — Next.js (React):** der verbreitetste Web-App-Stack.
- **Option B — Remix / React Router:** React-Ökosystem mit Web-Standards-nahem Ansatz
  (Formulare, Loader/Actions).
- **Option C — Astro:** Content-first, Island-Architektur, minimales JavaScript.
- **Option D — htmx + serverseitig gerendertes HTML:** minimalistisch, kein Frontend-Framework
  im klassischen Sinn.
- **Option E — SvelteKit:** SSR-first, kompiliert zu minimalem JavaScript, native
  Form-Actions mit progressiver Anreicherung.

## Entscheidung

**Option E — SvelteKit.**

SvelteKit rendert serverseitig vollständiges HTML; Formulare nutzen native `<form>`-Submission,
die **ohne JavaScript funktioniert** und bei vorhandenem JavaScript progressiv angereichert wird
(kein Full-Page-Reload, optimistische UI). Architekturziel 7 ist damit der **Standardpfad**, nicht
ein Sonderaufwand gegen die Grundphilosophie des Frameworks — entscheidend für Robustheit über
10+ Jahre mit vielen wechselnden Contributorn, die die Vorgabe sonst immer wieder neu durchsetzen
müssten.

Svelte kompiliert zu minimalem JavaScript ohne Virtual-DOM-Laufzeit-Overhead — kleinere
Bundle-Größen unterstützen Mobile-First-Performance (QA8) und erreichen auch Nutzer:innen mit
schwachen Geräten oder Verbindungen (ein praktischer Aspekt von Zugänglichkeit, QA2-nah).

SvelteKit/Svelte hat eine **neutrale Open-Source-Governance** ohne dominierende
Single-Vendor-Plattform-Agenda (anders als Next.js, dessen Roadmap eng an Vercels
Hosting-Plattform gekoppelt ist) — passt zu Leitprinzip 9 (Souveränität) und dem allgemeinen
Neutralitätsanspruch der Plattform.

## Konsequenzen

- **Positiv:** „Ohne JS nutzbar" ist strukturell statt disziplinarisch gesichert; gute
  Mobile-Performance; keine Plattform-Bindung an einen Hosting-Anbieter.
- **Negativ / Kosten (ehrlich benannt):** Kleinerer Contributor-Pool als React/Next.js — das
  ist der **Hauptnachteil** dieser Wahl gegenüber Option A und ein direktes Spannungsfeld mit
  R7/R9. Gegenmaßnahme: gute Einstiegsdokumentation und die Tatsache, dass Svelte syntaktisch
  nah an Standard-HTML/CSS/JS bleibt (niedrigere Lernkurve als React für Neueinsteiger:innen ohne
  JS-Framework-Erfahrung, was einen Teil des Pool-Nachteils kompensiert, aber ihn nicht aufhebt).
- **Risiko-Monitoring:** Sollte sich die Contributor-Gewinnung als Engpass erweisen, ist dies über
  einen neuen ADR revidierbar (P8 Reversibilität) — die serverseitige, formularbasierte Architektur
  ließe sich auch mit Remix/React Router nachbilden (siehe Option B).

## Vor- und Nachteile der Optionen

### Option A — Next.js (React)

- 👍 Mit Abstand größter Contributor-Pool und Talentmarkt — das stärkste Argument für diese
  Option und ein echtes Gegenargument zur getroffenen Wahl.
- 👎 Die dominante Kultur ist SPA-/Client-Component-zentriert; „ohne JS nutzbar" erfordert bewusste,
  fortlaufende Disziplin gegen die Grundtendenz des Ökosystems; Roadmap und Best Practices sind
  eng an Vercels Hosting-Plattform ausgerichtet (Spannung zu Leitprinzip 9).

### Option B — Remix / React Router

- 👍 Vereint React-Ökosystem/Contributor-Pool mit einer Web-Standards-nahen Philosophie
  (Loader/Actions, funktioniert ähnlich wie SvelteKit ohne JS) — die ernsthafteste Alternative.
- 👎 Geringere Bundle-Effizienz als Svelte (React-Laufzeit bleibt bestehen); Governance seit dem
  Merge in React Router weniger klar konturiert als noch als eigenständiges Remix.

### Option C — Astro

- 👍 Minimales JavaScript per Default, exzellent für überwiegend statische/inhaltslastige Seiten
  (z. B. Gesetzestexte in OpenLaw).
- 👎 Weniger geeignet als durchgängige App-Shell für hochinteraktive Datenexploration mit viel
  Client-Zustand (OpenBudget-Suche/-Filter) — würde vermutlich zusätzlich ein Inseln-Framework
  erfordern, was die Sprachlandkarte wieder verkompliziert.

### Option D — htmx + serverseitiges HTML

- 👍 Maximal „boring"/Standards-nah, denkbar kleinste JS-Fläche.
- 👎 Kleinerer Ecosystem/Contributor-Pool als jede der JS-Framework-Optionen; schwächer für
  anspruchsvolle Datenvisualisierung (Diagramme, interaktive Haushaltsübersichten), die im
  OpenBudget-MVP eine zentrale Rolle spielen.

### Option E — SvelteKit *(gewählt)*

- 👍 „Ohne JS nutzbar" ist der Standardpfad; kleine Bundles; neutrale Governance.
- 👎 Kleinerer Contributor-Pool als React-basierte Optionen — bewusst akzeptierter Trade-off
  zugunsten der höher priorisierten Qualitätsattribute QA2 und QA8.
