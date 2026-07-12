<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0002 — Architekturstil: Modularer Monolith mit Service-Extraktions-Nähten

- **Status:** Accepted
- **Datum:** 2026-07-06
- **Bezug:** Architekturziele 1 & 6; Qualitätsattribute QA3 (Wartbarkeit), QA5 (Portabilität/
  Self-Hosting); Risiken R8 (Scope Creep), R9 (Komplexität schreckt ab); Prinzip P1 (boring)

## Kontext und Problemstellung

OpenCivic soll gleichzeitig (a) für einzelne Betreiber und Kommunen mit **einem Befehl**
self-hostbar sein, (b) über 10+ Jahre wartbar bleiben, (c) modular und ersetzbar sein und
(d) bei großen Betreibern horizontal skalieren. Diese Ziele stehen in Spannung: Maximale
Skalierbarkeit legt Microservices nahe, maximale Einfachheit einen Monolithen.

Zu klären ist außerdem, **wie Module kommunizieren** und **wie deployt** wird.

## Betrachtete Optionen

- **Option A — Microservices ab Tag 1:** jedes Modul ein eigener Dienst mit eigener Datenhaltung.
- **Option B — Klassischer Monolith ohne interne Grenzen:** ein Codeblock, direkte Aufrufe.
- **Option C — Modularer Monolith mit Extraktions-Nähten:** ein Deployable mit hart getrennten
  Modulen (Kommunikation nur über öffentliche Contracts), einzeln zu Diensten extrahierbar.

## Entscheidung

**Option C.**

- **Standard-Deployment = ein Prozess.** Kern und Fachmodule leben als getrennte Module in einem
  Deployable. Das ermöglicht das *Solo*-Profil (ein Container) und hält die Einstiegshürde für
  Betreiber und Contributor niedrig.
- **Harte Modulgrenzen ab Tag 1.** Module rufen sich **nur** über öffentliche Schnittstellen/
  Contracts auf (nie interne Interna) — auch in-Prozess. Asynchrone Kopplung über einen
  **Event-Bus mit Outbox-Pattern**.
- **Extraktions-Nähte.** Weil die Grenzen bereits Contracts sind, kann ein Modul bei
  Skalierungsbedarf ohne Umbau zu einem eigenständigen Dienst (Profil *Scale*) extrahiert werden.
- **Deployment als Grad:** *Solo* → *Standard* → *Scale* aus **derselben** Codebasis,
  konfigurationsgesteuert.

Begründung: Der modulare Monolith liefert die Modularität/Ersetzbarkeit (Architekturziel 1) und
die Skalierungsoption (Architekturziel 6) **ohne** den Ops-Preis von Microservices vorzuziehen —
passend zu „boring & bewährt" (P1) und „ein Modul exzellent zuerst" (R8).

## Konsequenzen

- **Positiv:** Einfachster Self-Host; niedrige Contributor-Hürde; wartbar; spätere Skalierung ohne
  Neuentwurf; klare Testgrenzen je Modul (QA6).
- **Negativ / Kosten:** Disziplin nötig, damit Grenzen nicht umgangen werden → Gegenmaßnahme:
  Modulgrenzen per Architektur-Tests/Linter erzwingen (in Phase 1/3). Ein Monolith kann nur als
  Ganzes deployt werden, solange Module nicht extrahiert sind.
- **Risiken & Gegenmaßnahmen:** „Erosion der Grenzen" → automatisierte Dependency-Checks;
  gemeinsame Datenhaltung im Solo-Profil erfordert saubere Schema-Trennung pro Modul.

## Vor- und Nachteile der Optionen

### Option A — Microservices ab Tag 1

- 👍 Unabhängige Skalierung & Deployment von Beginn an; klare physische Grenzen.
- 👎 Hoher Ops-/Infra-Overhead (Netzwerk, Discovery, verteilte Transaktionen); zerstört den
  einfachen Solo-Self-Host (QA5, R9); verfrüht bei kleiner Community (R8); langsamere Iteration.

### Option B — Monolith ohne interne Grenzen

- 👍 Schnellster Start, keinerlei Zeremonie.
- 👎 Wird zum „Big Ball of Mud"; verletzt Modularität/Ersetzbarkeit (Leitprinzip 7); keine
  spätere Extraktion ohne teuren Umbau; schlechte Testbarkeit im Großen.

### Option C — Modularer Monolith mit Extraktions-Nähten *(gewählt)*

- 👍 Beste Balance: Einfachheit heute, Skalierbarkeit morgen; erfüllt Self-Hosting-als-Grad;
  klare Grenzen ohne verteilten Overhead.
- 👎 Erfordert bewusste Grenzdisziplin (durch Tooling erzwingbar).
