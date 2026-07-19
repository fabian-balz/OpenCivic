#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Leichtgewichtiger REUSE-/SPDX-Header-Check (ADR-0001/0027): jede getrackte Quelldatei mit
# kommentarfähigem Format muss einen `SPDX-License-Identifier` tragen. Portabel, ohne Fremd-Deps.
set -euo pipefail

# Zu prüfende Endungen (kommentarfähig). JSON/CSV/Lockfiles/Lizenztexte sind bewusst ausgenommen.
exts='ts|tsx|js|mjs|cjs|svelte|py|sql|sh|css|md|yml|yaml'
missing=0

while IFS= read -r file; do
  case "$file" in
    pnpm-lock.yaml|LICENSES/*|**/*.min.*) continue ;;
  esac
  if ! grep -qE 'SPDX-License-Identifier:' "$file"; then
    echo "FEHLT SPDX-Header: $file"
    missing=$((missing + 1))
  fi
done < <(git ls-files | grep -E "\.(${exts})\$")

if [ "$missing" -gt 0 ]; then
  echo "---"
  echo "$missing Datei(en) ohne SPDX-License-Identifier. Bitte Header ergänzen (siehe ADR-0001)."
  exit 1
fi
echo "SPDX/REUSE-Check: alle geprüften Quelldateien tragen einen Lizenz-Header."
