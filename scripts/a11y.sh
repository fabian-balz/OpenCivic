#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Startet API + SSR-Web und führt das Playwright/axe-a11y-Gate aus (ADR-0022).
set -euo pipefail

API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-3000}"
# Vorinstallierten Chromium nutzen, falls vorhanden (spart Download); sonst Playwright-Default.
if [ -z "${PW_CHROMIUM:-}" ] && [ -x /opt/pw-browsers/chromium ]; then
  export PW_CHROMIUM=/opt/pw-browsers/chromium
fi
export OPENCIVIC_API_URL="http://127.0.0.1:${API_PORT}"
export WEB_BASE_URL="http://127.0.0.1:${WEB_PORT}"

cleanup() {
  [ -n "${API_PID:-}" ] && kill "$API_PID" 2>/dev/null || true
  [ -n "${WEB_PID:-}" ] && kill "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "→ API starten (:$API_PORT)"
PORT="$API_PORT" HOST=127.0.0.1 pnpm api >/tmp/oc-a11y-api.log 2>&1 &
API_PID=$!

echo "→ Web starten (:$WEB_PORT)"
PORT="$WEB_PORT" HOST=127.0.0.1 ORIGIN="$WEB_BASE_URL" node apps/web/build >/tmp/oc-a11y-web.log 2>&1 &
WEB_PID=$!

echo "→ auf Server warten"
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null && curl -sf "$WEB_BASE_URL/" >/dev/null; then
    break
  fi
  sleep 1
done

echo "→ Playwright/axe ausführen"
pnpm --filter @opencivic/web exec playwright test
