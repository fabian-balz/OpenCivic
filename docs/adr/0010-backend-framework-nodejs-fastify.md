<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0010 — Backend-Laufzeit & Framework: Node.js + Fastify

- **Status:** Accepted
- **Datum:** 2026-07-09
- **Bezug:** [ADR-0009](0009-programmiersprachen-typescript-python.md) (TypeScript primär);
  [ADR-0002](0002-architekturstil-modular-monolith.md) (harte Modulgrenzen); Architekturziel 2
  (API-first & vertragsbasiert); Entscheidungsprinzip P1 (boring), P6 (Standardschnittstellen)

## Kontext und Problemstellung

Der [modulare Monolith](0002-architekturstil-modular-monolith.md) verlangt, dass Module nur über
öffentliche Contracts kommunizieren — **auch in-Prozess**. Das Framework muss diese Grenze aktiv
unterstützen, nicht nur per Konvention. Zusätzlich verlangt Architekturziel 2, dass jede Fähigkeit
zuerst als dokumentierter, versionierter API-Contract existiert — das Framework sollte
Schema-Definition so nah wie möglich an den Code bringen, statt sie nachträglich zu dokumentieren.

## Betrachtete Optionen

- **Option A — Express.js:** der etablierteste Node.js-Webframework-Standard.
- **Option B — NestJS:** batteries-included, Dependency-Injection, deklaratives Modulsystem.
- **Option C — Fastify:** schema-first, leichtgewichtig, Plugin-Kapselung.

## Entscheidung

**Option C — Fastify.**

Fastifys **Plugin-Kapselung** ist der entscheidende Faktor: Ein Fastify-Plugin hat standardmäßig
keinen Zugriff auf den internen Zustand eines anderen Plugins — Austausch geschieht ausschließlich
über explizit deklarierte `decorate`-Schnittstellen. Das setzt die Modulgrenzen aus
[ADR-0002](0002-architekturstil-modular-monolith.md) technisch durch, statt sie dem
Contributor-Vertrauen zu überlassen (relevant, weil das Projekt über 10+ Jahre viele wechselnde
Freiwillige haben wird).

Fastifys **native JSON-Schema-Integration** (Request-/Response-Validierung direkt aus Schema
definiert, OpenAPI-Generierung daraus ableitbar) erzwingt, dass jede Route einen maschinenlesbaren
Contract hat — der API-first-Grundsatz (Architekturziel 2) wird damit zum Standardweg, nicht zur
Zusatzdisziplin.

Fastify ist bewusst **schlank**: kein eingebauter DI-Container, keine Decorator-Magie — passt zu
„boring & bewährt" (P1) und hält die Lernkurve für neue Contributor niedrig.

## Konsequenzen

- **Positiv:** Modulgrenzen sind strukturell erzwungen; Schema-first passt direkt auf
  OpenAPI-Generierung für das API-Design-Topic; hohe Performance reduziert einen Teil des in
  [ADR-0009](0009-programmiersprachen-typescript-python.md) benannten QA8-Nachteils von Node.js
  gegenüber kompilierten Sprachen.
- **Negativ / Kosten:** Weniger eingebaute Struktur als NestJS — Team-/Projektkonventionen für
  Plugin-Organisation müssen dokumentiert werden (folgt im Repo-/Build-Topic als Contributor-Guide,
  nicht Teil dieses ADRs).
- **Reversibilität:** Da Module bereits als Fastify-Plugins mit klaren Contracts existieren, ist
  ein späterer Wechsel zu NestJS oder eine Extraktion einzelner Module zu eigenständigen Diensten
  (ADR-0002) ohne Neuentwurf der Modulgrenzen möglich (P8).

## Vor- und Nachteile der Optionen

### Option A — Express.js

- 👍 Größte Verbreitung, riesiges Plugin-Ökosystem, extrem „boring"/bewährt.
- 👎 Kein natives Schema-First (Validierung/OpenAPI nur über Zusatzpakete uneinheitlicher
  Qualität); keine eingebaute Kapselung — Modulgrenzen müssten rein durch Konvention gehalten
  werden, was über 10+ Jahre mit wechselnden Contributorn erfahrungsgemäß erodiert.

### Option B — NestJS

- 👍 Eingebautes Dependency-Injection- und Modulsystem, sehr explizite Struktur; offizieller,
  gut dokumentierter Pfad zur Aufteilung in Microservices — passt konzeptionell gut zu den
  „Extraktions-Nähten" aus [ADR-0002](0002-architekturstil-modular-monolith.md).
- 👎 Deutlich mehr Abstraktion und Decorator-basierte „Magie"; steilere Lernkurve für neue
  Contributor; widerspricht stärker dem „boring"-Prinzip (P1) als ein schlankeres Framework.
  Bleibt die naheliegende Option, falls der Kern später mehr eingebaute Struktur braucht.

### Option C — Fastify *(gewählt)*

- 👍 Modulgrenzen technisch erzwungen; Schema-first unterstützt API-first direkt; schlank und
  performant; einfache Lernkurve.
- 👎 Weniger „out of the box" als NestJS — erfordert eigene, dokumentierte Konventionen für
  Modulstruktur.
