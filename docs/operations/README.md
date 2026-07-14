<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Betrieb (Operations)

Betreiber-Handbuch für OpenCivic. Die Plattform ist **Self-Hosting als Grad** (ADR-0002): vom
Ein-Prozess-Solo bis zum containerisierten Standard-Profil — dieselbe Codebasis.

## Deployment-Profile

| Profil | Wofür | Start |
|---|---|---|
| **Solo** | Einzelperson/kleine Kommune, minimale Infrastruktur | lokaler PostgreSQL + `make api` |
| **Standard** | produktive mittlere Instanz | `docker compose up` (DB + API + Web) |
| **Scale** | große Betreiber | Kubernetes/k3s (ADR-0024), Module bei Bedarf extrahiert |

### Solo (ohne Container)

Voraussetzungen: Node ≥ 22, pnpm, Python ≥ 3.11, lokales PostgreSQL 16.

```bash
make install
make db-up        # lokaler PostgreSQL-Cluster (Port 5433)
make migrate
make ingest
make api          # http://127.0.0.1:3001
# Web separat:
make web-build && (cd apps/web && OPENCIVIC_API_URL=http://127.0.0.1:3001 node build)
```

### Standard (Docker Compose)

```bash
cp .env.example .env   # Passwörter anpassen!
docker compose up --build
# migrate-Job legt Schema an und importiert das Sample; danach:
#   API → http://localhost:3001   ·   Web → http://localhost:3000
```

## Konfiguration (Umgebungsvariablen)

| Variable | Zweck | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindung (API & CLI) | `postgresql://postgres@127.0.0.1:5433/opencivic` |
| `PORT` / `HOST` | API-Bindung | `3001` / `127.0.0.1` |
| `OPENCIVIC_API_URL` | Web → API | `http://127.0.0.1:3001` |
| `OTEL_SDK_DISABLED` | OpenTelemetry im Solo-Profil abschalten | `false` |

## Datenbank: Backup & Restore

```bash
# Backup (Standard-Profil)
docker compose exec db pg_dump -U "$PGUSER" "$PGDATABASE" > backup.sql
# Restore
docker compose exec -T db psql -U "$PGUSER" "$PGDATABASE" < backup.sql
```

Rohdaten (Bronze) liegen im Solo-Profil unter `.bronze/` bzw. produktiv im Objektspeicher — sie
sind **unveränderlich** und sollten in die Sicherung einbezogen werden (Reproduzierbarkeit,
Leitprinzip 4).

## Upgrades & Migrationen

Migrationen sind versioniert (`packages/provenance/migrations/`) und idempotent. Vorgehen:

```bash
git pull && make install
make migrate          # wendet neue Migrationen an, überspringt bereits angewandte
```

Aussagen sind **append-only** (ADR-0007): ein erneuter Ingest überschreibt nichts, sondern nutzt
deterministische, inhaltsbasierte IDs — Re-Ingest ist gefahrlos wiederholbar.

## Observability

Die API ist mit **OpenTelemetry** instrumentiert (ADR-0026). Ohne Konfiguration exportiert sie auf
die Konsole; per OTel-Umgebungsvariablen lässt sich ein beliebiges Backend (z. B. Grafana-Stack:
Prometheus/Loki/Tempo) anbinden. Logs sind strukturiert (JSON).

## Sicherheit

- Standard-Passwörter in `.env` **immer** ändern.
- Supply-Chain: `make sbom` erzeugt eine CycloneDX-Stückliste; CI führt SPDX-/Lizenz- und
  Abhängigkeitsprüfungen aus (ADR-0027).
- Datensparsamkeit: die Lese-Endpunkte sind anonym-öffentlich; es werden keine Endnutzer-Konten
  oder PII benötigt (Leitprinzip 6).
- Integrität: jede Quelle trägt einen sha-256-Hash; die Herkunftskette ist über
  `/v1/provenance/{id}` prüfbar.

## Qualitäts-Gates (CI)

`make ci` bündelt die Gates (auch als GitHub-Actions-Workflow, ADR-0025):
`typecheck · license-check · test (vitest+pytest) · a11y (WCAG 2.2 AA) · sbom`.
