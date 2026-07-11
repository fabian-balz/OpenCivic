<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0022 — Web-Plattform-Baseline (a11y/Performance/Offline/SEO)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Qualitätsattribute QA2 (Zugänglichkeit), QA8 (Performance), QA1 (Nachvollziehbarkeit),
  QA5 (Self-Hosting/Portabilität), QA7 (Interoperabilität); Leitprinzip 5 (Barrierefreiheit ist
  Voraussetzung), P10 (Automatisierung vor Konvention vor Dokumentation), P7 (Daten langlebiger als
  Code), P8 (Reversibilität); Architekturziel 7 (Progressive Enhancement & Offline);
  Frontend [ADR-0011](0011-frontend-framework-sveltekit.md); Provenance-Modell
  [ADR-0006](0006-provenance-modell-w3c-prov.md); Architektur-Doc
  [10-i18n-a11y-performance](../architecture/10-i18n-a11y-performance.md)

## Kontext und Problemstellung

Barrierefreiheit, Performance, Offline-Fähigkeit und Auffindbarkeit werden oft als vier separate
Features behandelt, die jeweils eigenen Aufwand und eigene Technik verlangen. Für OpenCivic sind sie
jedoch **Ausprägungen einer einzigen Frage**: Sind die belegten Fakten für alle Menschen, auf allen
Geräten und auch bei schlechter Verbindung les- und auffindbar? Leitprinzip 5 und QA2 erheben
Barrierefreiheit ausdrücklich zur **Voraussetzung, nicht zum Feature**; QA8 fordert Mobile-First-
Performance (aber nachrangig gegenüber Korrektheit); Architekturziel 7 nennt Offline; und
Auffindbarkeit betrifft die Interoperabilität (QA7) derselben Fakten.

Zu klären ist, mit welchem **Qualitätsregime** diese vier Themen kohärent und über 10+ Jahre stabil
gesichert werden — insbesondere, ob a11y nur „mitgeprüft" oder erzwungen wird, wie tief Offline
reicht und ob SEO eine eigene Datenhaltung bekommt. Weil alle vier auf demselben Fundament (SSR aus
[ADR-0011](0011-frontend-framework-sveltekit.md)) ruhen, werden sie **gemeinsam** entschieden.

## Betrachtete Optionen

- **Option A — a11y nur als manuelle Review** ohne automatisiertes CI-Gate; Performance/SEO
  best-effort.
- **Option B — Client-Side-Rendering / SPA** als Basisarchitektur, a11y/SEO nachgerüstet.
- **Option C — Offline-First mit vollem bidirektionalem Sync** als Offline-Strategie.
- **Option D — separates SEO-/Meta-System** neben dem Provenance-Modell.
- **Option E — kohärente SSR-Baseline mit CI-Gates:** WCAG 2.2 AA als blockierendes CI-Gate
  (axe-core + manuelle Checkliste), Core-Web-Vitals-Budgets per Lighthouse-CI, Offline als
  Service-Worker-PWA **nur fürs Lesen**, SEO als `schema.org`/JSON-LD **direkt aus dem
  Provenance-Modell**.

## Entscheidung

**Option E — kohärente SSR-Baseline mit CI-Gates.**

- **Barrierefreiheit:** **WCAG 2.2 AA** ist ein **blockierendes CI-Gate** — automatisiert via
  axe-core auf gerenderten Seiten, ergänzt um eine **manuelle Checkliste** (Tastatur,
  Fokusreihenfolge, Screenreader, Kontrast, Reflow bei 200% Zoom) für die maschinell nicht
  entscheidbaren Kriterien. Damit ist a11y eine strukturelle Eigenschaft (P10) statt eines guten
  Vorsatzes — begünstigt durch SvelteKits Server-HTML/Progressive Enhancement
  ([ADR-0011](0011-frontend-framework-sveltekit.md), QA2, Leitprinzip 5).
- **Performance:** **Core-Web-Vitals-Budgets** (LCP/INP/CLS, JS-Transfer je Route), in CI per
  **Lighthouse** geprüft; Mobile-First (QA8). Regression wird sichtbar und blockierbar, nicht erst
  in Produktion spürbar.
- **Offline:** **Service-Worker-PWA nur für das erneute Lesen bereits besuchter Inhalte** — kein
  Offline-Editing, kein Sync. Ehrlicher, realistischer Scope (Architekturziel 7), der das Versprechen
  „was du siehst, ist belegt" auch offline hält.
- **SEO:** **SSR + `schema.org`/JSON-LD**, **direkt aus dem
  [Provenance-Modell](0006-provenance-modell-w3c-prov.md)** (Source/Statement/Citation) generiert —
  **keine separate SEO-Datenhaltung**. Strukturierte Daten spiegeln die belegten Fakten (QA1, QA7).

Der gemeinsame Nenner ist das **serverseitig gerenderte, vollständige HTML** aus
[ADR-0011](0011-frontend-framework-sveltekit.md): Dasselbe Merkmal trägt gleichzeitig a11y
(bedienbar ohne JS), Performance (kein Client-Wasserfall), Offline (fertige Seiten cachebar) und SEO
(Crawler sehen Inhalt). Details und Diagramme:
[Architektur-Doc 10](../architecture/10-i18n-a11y-performance.md).

## Konsequenzen

- **Positiv:** a11y ist über CI dauerhaft erzwungen und erodiert nicht (P10); Performance-Regression
  ist messbar blockierbar; Offline-Versprechen bleibt ehrlich und provenance-sicher; SEO hat keine
  Zweitdaten und kann daher nicht von den belegten Fakten divergieren (QA1, P7). Alle vier Qualitäten
  ruhen auf einer Architektur statt auf vier.
- **Negativ / Kosten (ehrlich benannt):** CI-Gates **verlangsamen die Pipeline** und können bei
  falscher Kalibrierung zu Reibung führen (flaky Lighthouse-Messungen, axe-Regeln mit
  Interpretationsspielraum). Die manuelle a11y-Checkliste bleibt **menschlicher Aufwand**, den
  axe-core nicht abnimmt. Der bewusst enge Offline-Scope **enttäuscht** Erwartungen an echte
  Offline-Apps. Gegenmaßnahmen: Budgets/Regeln iterativ kalibrieren, Checkliste schlank halten,
  Offline-Grenzen klar kommunizieren.
- **Reversibilität (P8):** Hoch bis mittel. Offline-Scope ist per neuem ADR erweiterbar, ohne die
  Basis zu verwerfen; Budget-Schwellen sind Konfiguration; die SSR-Grundentscheidung ist die einzige
  tief verankerte Annahme und stammt ohnehin aus [ADR-0011](0011-frontend-framework-sveltekit.md).

## Vor- und Nachteile der Optionen

### Option A — a11y nur als manuelle Review (ohne CI-Gate)

- 👍 Kein CI-Aufwand, keine Pipeline-Verlangsamung; volle Flexibilität für Reviewende — bei einem
  kleinen, disziplinierten Team kurzfristig praktikabel.
- 👎 Erodiert über Zeit und wechselnde Contributor unweigerlich: Was nur „mitgeprüft" wird, rutscht
  durch. Das widerspricht direkt dem Grundsatz „Barrierefreiheit ist **Voraussetzung, nicht
  Feature**" (Leitprinzip 5, QA2) und P10 (Automatisierung vor Konvention).

### Option B — Client-Side-Rendering / SPA

- 👍 Reichhaltige, app-artige Interaktivität, vertrautes Muster mit großem Talentmarkt.
- 👎 Strukturell schlechter für SEO (Crawler brauchen JS-Ausführung), für a11y (Bedienbarkeit hängt
  am Skript) und für Low-End-Geräte/schlechte Verbindungen (Render-Wasserfall). Widerspricht QA2/QA8
  und Architekturziel 7 und wurde bereits in [ADR-0011](0011-frontend-framework-sveltekit.md)
  zugunsten von SSR verworfen.

### Option C — Offline-First mit vollem bidirektionalem Sync

- 👍 Mächtig — echte Offline-Nutzung inklusive Schreibzugriff, wie in feldarbeitslastigen Apps; die
  **technisch anspruchsvollste und funktional stärkste** Offline-Variante und für manche Domänen
  klar überlegen.
- 👎 Hohe Komplexität (lokale Schreibmodelle, Konfliktauflösung, divergierende Zustände) für eine
  reine **Lese-Transparenzplattform** überzogen. Schlimmer: Ein lokal veralteter oder veränderter
  Wert, der als amtlicher Fakt gelesen wird, wäre ein QA1-Provenance-Schaden. Der Nutzen steht in
  keinem Verhältnis zum Risiko.

### Option D — separates SEO-/Meta-System

- 👍 Feingranulare, unabhängige Steuerung von Meta-Daten; entkoppelt SEO von Modelländerungen.
- 👎 Schafft eine **zweite Quelle der Wahrheit** neben dem Provenance-Modell mit Divergenzrisiko
  (Meta nennt eine Zahl, die der Fakt via [`superseded`](0006-provenance-modell-w3c-prov.md) längst
  korrigiert hat). Widerspricht QA1 und P7 („Daten langlebiger als Code"); Redundanz ohne Mehrwert.

### Option E — kohärente SSR-Baseline mit CI-Gates *(gewählt)*

- 👍 Eine Architektur trägt alle vier Qualitäten; a11y erzwungen (P10); Performance messbar; Offline
  ehrlich und provenance-sicher; SEO ohne Zweitdaten (QA1/P7).
- 👎 CI-Gates kosten Pipeline-Zeit und Kalibrierung; manuelle a11y-Checkliste bleibt Aufwand; enger
  Offline-Scope enttäuscht App-Erwartungen — bewusst akzeptierte Trade-offs zugunsten der
  höherpriorisierten QA1/QA2 und der langfristigen Stabilität (P8-reversibel, wo nötig).
