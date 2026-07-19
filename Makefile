# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Portable Task-Schicht (ADR-0025): dieselben Targets laufen lokal und in CI, unabhängig vom
# CI-Anbieter. Solo-Profil ohne Docker (ADR-0002): lokaler PostgreSQL-Cluster via scripts/db.sh.

export PGHOST     ?= 127.0.0.1
export PGPORT     ?= 5433
export PGUSER     ?= postgres
export PGDATABASE ?= opencivic
export DATABASE_URL ?= postgresql://$(PGUSER)@$(PGHOST):$(PGPORT)/$(PGDATABASE)

.DEFAULT_GOAL := help
.PHONY: help install db-up db-down migrate ingest test test-ts test-py api web-build typecheck verify clean

help: ## Diese Hilfe anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Alle Abhängigkeiten installieren (pnpm + Poetry-Connector)
	pnpm install
	cd connectors/openbudget-de && poetry install --no-root || poetry install

db-up: ## Lokalen PostgreSQL-Cluster initialisieren & starten
	bash scripts/db.sh up

db-down: ## Lokalen PostgreSQL-Cluster stoppen
	bash scripts/db.sh down

migrate: ## Datenbankschema anwenden
	pnpm migrate

ingest: ## OpenBudget-Sample importieren (Connector → Bronze → Silver/Gold → Statements)
	pnpm ingest

test-ts: ## TypeScript-Tests (vitest): Provenance-Invariante + API-Integration
	pnpm test

test-py: ## Python-Connector-Tests (pytest)
	cd connectors/openbudget-de && poetry run pytest -q || pytest -q

test: test-ts test-py ## Alle Tests

typecheck: ## TypeScript-Typprüfung über alle Pakete
	pnpm typecheck

license-check: ## SPDX/REUSE-Header aller Quelldateien prüfen (ADR-0001/0027)
	bash scripts/license-check.sh

sbom: ## Software Bill of Materials (CycloneDX, ADR-0027) nach sbom.json
	pnpm dlx @cyclonedx/cdxgen@^11 --type pnpm --no-recurse -o sbom.json .

ci: typecheck license-check test a11y sbom ## Vollständige CI-Kette (wie GitHub Actions)

api: ## API-Server starten (Fastify, /v1, /openapi.json)
	pnpm api

web-build: ## Web-App bauen (SvelteKit, SSR)
	pnpm --filter @opencivic/web build

a11y: web-build ## WCAG-2.2-AA-Gate (Playwright + axe) gegen die SSR-Web-App
	bash scripts/a11y.sh

verify: db-up migrate ingest test ## Vollständiger Durchstich: DB → Migration → Ingest → Tests

clean: ## Build-Artefakte & lokalen Cluster entfernen
	bash scripts/db.sh down || true
	rm -rf .pgdata .pgdata.pglog node_modules **/node_modules **/dist **/.svelte-kit
