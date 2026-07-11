<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0019 — LLM-Provider-Abstraktion & striktes Zitier-RAG

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Qualitätsattribute QA1 (Nachvollziehbarkeit), QA5 (Portabilität/Self-Hostbarkeit),
  QA4 (Sicherheit/Datenschutz), QA7 (Interoperabilität); Leitprinzipien 1 (Faktentreue),
  2 (Quellenzwang), 6 (Datensparsamkeit), 9 (Souveränität); technische Prinzipien P2, P3, P7, P8;
  Nicht-Ziel „keine Prognose-/Meinungs-KI"; Risiken R2 (Halluzination), R12 (KI-Anbieter-Lock-in);
  baut auf [ADR-0006](0006-provenance-modell-w3c-prov.md), [ADR-0007](0007-bitemporal-append-only-lifecycle.md),
  [ADR-0014](0014-primaere-datenbank-postgresql.md), [ADR-0015](0015-suche-und-vektorsuche.md);
  Architektur-Kontext: [08 — KI-Integration & RAG](../architecture/08-ki-rag.md)

## Kontext und Problemstellung

CivicAI (Phase 4) soll natürlichsprachige Fragen zum staatlichen Handeln beantworten. Zwei Risiken
prallen hier direkt auf die Mission: **R2** — ein Sprachmodell halluziniert plausibel klingende, aber
falsche oder unbelegte Aussagen und untergräbt damit exakt die Glaubwürdigkeit (QA1), die
OpenCivics einziger Wert ist. Und **R12** — die naheliegende Integration bindet die Plattform an
einen einzelnen KI-Anbieter oder dessen Framework und verletzt Cloud-Neutralität (QA5),
Souveränität (Leitprinzip 9) und Ersetzbarkeit (P7).

Das Nicht-Ziel ist eindeutig: CivicAI ist **kein Chatbot mit Weltwissen**, sondern gibt nur wieder,
was der [provenance-belegte Bestand](../architecture/02-provenance-model.md) hergibt, und verweigert
sonst die Antwort. Die Frage dieses ADR ist daher zweigeteilt und untrennbar: **(a) an welches
Modell binden wir uns** und **(b) wie stellen wir sicher, dass generierte Aussagen belegt sind** —
nicht als Versprechen, sondern strukturell.

## Betrachtete Optionen

- **Option A — Direkte Bindung an einen einzelnen kommerziellen Anbieter/dessen SDK.**
- **Option B — Offenes LLM ohne RAG (mit Weltwissen / offenem Antwortraum).**
- **Option C — Fine-tuning eines Modells auf den OpenCivic-Bestand statt RAG.**
- **Option D — Klassische Suche ganz ohne LLM.**
- **Option E — Provider-abstrahierte LLM-Schicht (OpenAI-kompatibel, self-hostbar) + striktes
  Zitier-RAG mit erzwungenem Post-Generation-Validator.**

## Entscheidung

**Option E.**

**LLM-Provider-Abstraktion.** Alle Modellaufrufe (`chat()`, `embed()`) laufen über eine schmale
interne Abstraktion mit einer **OpenAI-kompatiblen Adapter-API**. Diese Protokollform wird von
kommerziellen Anbietern *und* den verbreiteten Self-Hosting-Runtimes (llama.cpp, vLLM, Ollama)
bedient, sodass der Wechsel des Backends — inklusive vollständigem Verzicht auf jeden kommerziellen
Anbieter — eine **Konfigurations-, keine Code-Änderung** ist (QA5, P3, direkt gegen R12). Bewusst
**kein Vendor-Agent-Framework** als Architektur-Rückgrat: Es zöge eine zweite, schwerer entfernbare
Lock-in-Ebene ein (P7).

**Striktes Zitier-RAG.** Das Retrieval ist die **einzige** Wissensquelle. Es holt ausschließlich
belegte `Statement`-Objekte aus dem Gold-Bestand — als **Hybrid** aus Vektorsuche (pgvector,
[ADR-0015](0015-suche-und-vektorsuche.md)) und Volltext (Postgres-FTS → OpenSearch). Jede
Kontext-Aussage trägt ihre `Statement`-ID. Ein **Post-Generation-Validator** prüft anschließend jede
fakthaltige Aussage gegen die zitierten IDs (Existenz, `lifecycle = active`, inhaltliche Stützung);
unbelegte Aussagen werden verworfen oder markiert. Liegt keine Quelle vor, antwortet CivicAI
**„keine belegbare Antwort"** statt zu erfinden. Der Belegzwang ist damit über **Retrieval *und*
Validator** erzwungen — nicht nur per Prompt erbeten (QA1, Leitprinzip 1 & 2, gegen R2).

Datenschutz: keine Speicherung von Nutzer-Prompts über das für die Beantwortung Nötige hinaus; die
Self-Hosting-Option ist der datenschutzfreundlichste Standardpfad (Leitprinzip 6, QA4). CivicAI baut
auf demselben Provenance-Fundament auf und legt **kein neues Datensilo** an.

## Konsequenzen

- **Positiv:** Halluzination ist strukturell (nicht disziplinarisch) eingedämmt — der Validator ist
  eine Testgate-artige Kontrolle, kein Vertrauensvorschuss (QA1, R2). Kein KI-Lock-in: Betrieb rein
  mit offenen Modellen ist ein voll unterstützter Pfad (QA5, R12). Zitierbarkeit ist Eigenschaft
  jedes Treffers, nicht nachträgliche Zutat. Datenschutzfreundlich by default (QA4, Leitprinzip 6).
- **Negativ / Kosten (ehrlich benannt):**
  - **Antwortqualität hinter dem Machbaren.** Der Verzicht auf Weltwissen und auf
    anbieter-spezifische „Killerfeatures" hinter der schmalen Abstraktion bedeutet: CivicAI ist
    zurückhaltender und formuliert weniger „flüssig-allwissend" als ein ungebremster Assistent. Das
    ist der **Hauptpreis** dieser Wahl — bewusst gezahlt zugunsten von QA1 und der Nicht-Ziel-Treue.
  - **Zwei Systeme statt einem.** Retrieval + Validator sind mehr Bewegteile als „Prompt an eine
    API"; der Validator selbst kann Aussagen fälschlich verwerfen (zu strenges Nein) oder durchlassen
    (Attributions-Lücke) und braucht eigene Evaluation (QA6).
  - **Kleinster gemeinsamer Nenner.** Die OpenAI-kompatible Abstraktion nivelliert auf gemeinsame
    Fähigkeiten; einzelne, nur bei einem Anbieter verfügbare Features bleiben ungenutzt oder werden
    gekapselt.
  - **Betriebslast Self-Hosting.** Ein offenes Modell mit brauchbarer Qualität selbst zu betreiben,
    kostet Hardware/Ops — für Solo-Betreiber real spürbar (gemildert durch kleine Modelle via Ollama).
- **Reversibilität (P8):** Hoch. Die Abstraktion ist der Reversibilitäts-Mechanismus selbst —
  jedes Backend ist austauschbar. Die RAG-Strenge (Fusion, Re-Ranking, Validator-Tiefe) ist
  parametrierbar, ohne die Architektur zu brechen. Ein späterer Wechsel der Retrieval-Backends ist
  bereits über [ADR-0015](0015-suche-und-vektorsuche.md) abgedeckt.

## Vor- und Nachteile der Optionen

### Option A — Direkte Bindung an einen einzelnen Anbieter/SDK

- 👍 **Einfachste Integration und beste Features** — der schnellste Weg zu hoher Antwortqualität,
  Zugriff auf die jeweils modernsten Modell-Fähigkeiten ohne Abstraktions-Overhead. Das ist ein
  echtes, ernstzunehmendes Argument, besonders für ein kleines Team.
- 👎 Voller **R12-Lock-in**: Preis-, Verfügbarkeits- und Roadmap-Risiko liegen bei einem Dritten;
  **nicht self-hostbar** (Verletzung QA5, Leitprinzip 9); Governance-/Neutralitätsrisiko (die
  Plattform hinge an den Nutzungsbedingungen und Inhaltsfiltern eines Anbieters); Nutzer-Prompts
  verlassen die eigene Infrastruktur (Spannung zu QA4/Leitprinzip 6).

### Option B — Offenes LLM ohne RAG (mit Weltwissen)

- 👍 Flüssige, souverän wirkende Antworten auf nahezu jede Frage; keine Retrieval-Komplexität.
- 👎 **Halluzinationen** sind der Normalfall, nicht die Ausnahme; verletzt Quellenzwang (Leitprinzip 2)
  und Faktentreue (Leitprinzip 1) **fundamental** und läuft direkt in R2. Unvereinbar mit dem
  Nicht-Ziel „keine Weltwissen-KI". **Ausschluss** — kein akzeptabler Trade-off, sondern
  Missionsbruch.

### Option C — Fine-tuning eines Modells auf den Bestand statt RAG

- 👍 Potenziell flüssigere, „eingearbeitete" Antworten; die Fakten stecken direkt im Modell, kein
  Retrieval zur Laufzeit nötig.
- 👎 **Keine belastbare Zitierbarkeit** — feingetunte Fakten sind in den Gewichten verschmolzen und
  nicht auf eine `Statement`-ID auflösbar (Kernverletzung QA1/Leitprinzip 2). **Keine Aktualität**:
  jeder neue Nachtragshaushalt erfordert erneutes Training statt einer Bestandsaktualisierung.
  **Teuer und nicht reproduzierbar** im Sinne von Leitprinzip 4; die saubere Herkunftskette
  ([ADR-0006](0006-provenance-modell-w3c-prov.md)) und die bitemporale Korrekturfähigkeit
  ([ADR-0007](0007-bitemporal-append-only-lifecycle.md)) gingen verloren.

### Option D — Klassische Suche ganz ohne LLM

- 👍 **Maximal transparent** — jedes Ergebnis ist unmittelbar ein belegtes Statement, kein
  Generierungsschritt, keine Halluzinationsfläche, kein KI-Betriebsaufwand. In Sachen QA1 die
  ehrlichste denkbare Lösung.
- 👎 Löst die **natürlichsprachige Frage-Zielsetzung von CivicAI nicht**: Nutzende müssen ihre Frage
  selbst in Suchbegriffe und Filter übersetzen. Deshalb ist die klassische Suche in CivicAI als
  **komplementär** gesetzt (Rückfallpfad bei „keine belegbare Antwort" und Fundament des Retrievals),
  **nicht als Ersatz**.

### Option E — Provider-Abstraktion + striktes Zitier-RAG *(gewählt)*

- 👍 Belegzwang strukturell erzwungen (QA1, R2); kein KI-Lock-in, self-hostbar (QA5, R12);
  datenschutzfreundlich (QA4); reversibel (P8); wiederverwendet Provenance und Suche ohne neues
  Silo.
- 👎 Geringere „Brillanz" der Antworten als Option A und mehr Bewegteile (Retrieval + Validator) als
  eine reine API-Bindung — bewusst akzeptierter Trade-off zugunsten der höchstpriorisierten Qualität
  QA1 und der Nicht-Ziel-Treue.
