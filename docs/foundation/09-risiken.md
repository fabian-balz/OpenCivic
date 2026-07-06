<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 9. Risiken

Jedes Risiko mit Gegenmaßnahme. Diese Liste wird über die Projektlaufzeit gepflegt.

## Inhaltlich / Mission

- **R1 — Wahrgenommene politische Schlagseite.** → Neutralität technisch & prozessual erzwingen:
  Quellenzwang, keine Wertungsfelder im Datenmodell, öffentliche Kurationsregeln, diverse
  Governance.
- **R2 — Fehl-/Desinformation durch fehlerhafte Daten oder KI-Halluzination.** → Quellenzwang,
  Human-in-the-loop bei der Kuration, CivicAI antwortet nur mit Beleg (striktes RAG), sonst
  „keine belegbare Antwort".
- **R3 — Quellen ändern sich oder verschwinden (Link Rot).** → Rohdaten archivieren &
  versionieren, Snapshots/Hashes, robuste Konnektoren mit Monitoring.

## Rechtlich / Governance

- **R4 — Urheber-, Datenbank- und Lizenzrechte an Amtsdaten.** → Frühzeitige Rechtsklärung pro
  Quelle, Lizenz-Metadaten pro Datensatz, konservative Defaults.
- **R5 — Haftung bei Fehlern.** → Klare Disclaimer (kein amtlicher Ersatz), Quellenlink prominent,
  Korrektur-/Meldeprozess.
- **R6 — Governance-Capture (Übernahme durch Einzelinteressen/Firma/Partei).** → Neutrale
  Trägerschaft (Stiftung/e.V.), offene Governance, Lizenzwahl gegen Proprietarisierung.

## Nachhaltigkeit / Projekt

- **R7 — Finanzierung & Bus-Factor.** → Trägerorganisation, Fördermittel (z. B. Sovereign Tech
  Fund, NGI, Prototype Fund), Mehr-Maintainer-Modell, gutes Onboarding.
- **R8 — Scope Creep (viele Module gleichzeitig).** → Strikte Roadmap, „ein Modul exzellent vor
  vielen mittelmäßigen", gemeinsamer Kern zuerst.
- **R9 — Komplexität schreckt Contributor & Self-Hoster ab.** → Ein einfacher Standardpfad
  (ein Befehl zum Start), exzellente Doku, gestaffelte Deployment-Profile.

## Technisch / Sicherheit

- **R10 — Technologie-Veraltung über 10 Jahre.** → Boring-Tech-Prinzip, Abstraktion an den
  Rändern, ADRs & Reversibilität.
- **R11 — Sicherheitsvorfälle / Angriffe auf die Datenintegrität.** → Signierte, gehashte
  Datensätze, Supply-Chain-Security (SBOM, Signaturen), Least Privilege, Audits.
- **R12 — KI-Abhängigkeit von einem Anbieter oder Modell.** → Anbieter-abstrahierte KI-Schicht,
  Betrieb mit offenen Modellen möglich, anbieterunabhängiger RAG-Kern.
