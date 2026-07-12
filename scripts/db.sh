#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Solo-Profil-Datenbank (ADR-0002): ein lokaler PostgreSQL-16-Cluster ohne Docker.
# Für Entwicklung/CI. Der Cluster liegt in ./.pgdata (gitignored) und lauscht auf 127.0.0.1.
#
# Hinweis: Der PostgreSQL-Server verweigert den Start als root. Läuft dieses Skript als root,
# wird der Cluster unter einem Nicht-root-Systemnutzer (Default: "postgres") via runuser gestartet.
set -euo pipefail

PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PGDATA="${PGDATA:-$PWD/.pgdata}"
PGPORT="${PGPORT:-5433}"
PGDATABASE="${PGDATABASE:-opencivic}"
LOGFILE="$PWD/.pgdata.pglog"

if [ -z "${PGBIN:-}" ] || [ ! -x "$PGBIN/initdb" ]; then
  echo "FEHLER: PostgreSQL-Server-Binaries nicht gefunden (PGBIN=$PGBIN)." >&2
  exit 1
fi

# Nicht-root-Runner bestimmen (postgres-Server läuft nicht als root)
if [ "$(id -u)" = "0" ]; then
  RUNUSER_NAME="${PGRUNUSER:-postgres}"
  if ! id "$RUNUSER_NAME" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$RUNUSER_NAME"
  fi
  run_as() { runuser -u "$RUNUSER_NAME" -- "$@"; }
  APPUSER="$RUNUSER_NAME"
else
  run_as() { "$@"; }
  APPUSER="$(id -un)"
fi

start_cluster() {
  mkdir -p "$PGDATA"
  : > "$LOGFILE"
  if [ "$(id -u)" = "0" ]; then
    chown "$RUNUSER_NAME" "$PGDATA" "$LOGFILE"
    chmod 700 "$PGDATA"
  fi

  if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "initdb → $PGDATA (Nutzer: $APPUSER, trust-Auth lokal)"
    run_as "$PGBIN/initdb" -D "$PGDATA" -U "$APPUSER" --auth=trust --encoding=UTF8 >/dev/null
  fi

  if run_as "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    echo "Cluster läuft bereits."
  else
    echo "Starte PostgreSQL auf 127.0.0.1:$PGPORT"
    run_as "$PGBIN/pg_ctl" -D "$PGDATA" -l "$LOGFILE" \
      -o "-p $PGPORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp" \
      -w start
  fi

  # Datenbank anlegen, falls nicht vorhanden
  if ! run_as "$PGBIN/psql" -h 127.0.0.1 -p "$PGPORT" -U "$APPUSER" -d postgres \
        -tAc "SELECT 1 FROM pg_database WHERE datname='$PGDATABASE'" | grep -q 1; then
    echo "createdb $PGDATABASE"
    run_as "$PGBIN/createdb" -h 127.0.0.1 -p "$PGPORT" -U "$APPUSER" "$PGDATABASE"
  fi
  echo "Bereit: postgresql://$APPUSER@127.0.0.1:$PGPORT/$PGDATABASE"
}

stop_cluster() {
  if run_as "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    run_as "$PGBIN/pg_ctl" -D "$PGDATA" -m fast stop
  else
    echo "Cluster läuft nicht."
  fi
}

case "${1:-up}" in
  up) start_cluster ;;
  down) stop_cluster ;;
  *) echo "usage: $0 {up|down}" >&2; exit 2 ;;
esac
