#!/usr/bin/env bash
# Prueba la base de datos de verdad: aplica todas las migraciones y corre supabase/tests/rls.test.sql.
# - Con DATABASE_URL: usa esa base (GitHub Actions) y la deja limpia al terminar.
# - Sin DATABASE_URL: levanta un Postgres temporal (necesita Postgres instalado) y lo borra al terminar.
set -euo pipefail
cd "$(dirname "$0")/.."
SQL=supabase

aplicar() { # $1 = comando psql base
  local p=("$@")
  "${p[@]}" -q -f "$SQL/tests/stub-supabase.sql" >/dev/null
  for f in "$SQL"/migrations/*.sql; do "${p[@]}" -q -f "$f" >/dev/null; done
  "${p[@]}" -f "$SQL/tests/rls.test.sql" 2>&1 | grep -v '^$' || true
}

if [ -n "${DATABASE_URL:-}" ]; then
  psql "$DATABASE_URL" -q -c "drop schema if exists public cascade; create schema public; drop schema if exists auth cascade;" >/dev/null
  salida=$(aplicar psql "$DATABASE_URL" -v ON_ERROR_STOP=1)
else
  BIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
  TMP=$(mktemp -d)
  chmod 755 "$TMP"
  if [ "$(id -u)" = 0 ]; then
    chown postgres "$TMP"; chmod o+x "$(dirname "$TMP")" 2>/dev/null || true
    corre() { su postgres -s /bin/bash -c "$*"; }
  else
    corre() { bash -c "$*"; }
  fi
  trap 'corre "$BIN/pg_ctl -D $TMP/data -m immediate stop" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
  corre "$BIN/initdb -D $TMP/data -A trust -U postgres" >/dev/null
  corre "$BIN/pg_ctl -D $TMP/data -o \"-c listen_addresses='' -c unix_socket_directories=$TMP\" -l $TMP/log -w start" >/dev/null
  # psql corre como el mismo usuario que Postgres para poder leer los archivos
  cp -r "$SQL" "$TMP/sql" && chmod -R a+rX "$TMP/sql"
  salida=$(SQL="$TMP/sql" corre "cd $TMP && $(declare -f aplicar | sed "s#\"\$SQL\"#$TMP/sql#g; s#\$SQL#$TMP/sql#g") ; aplicar psql -h $TMP -U postgres -d postgres -v ON_ERROR_STOP=1")
fi

echo "$salida"
if echo "$salida" | grep -q "TODO OK"; then exit 0; else echo "FALLÓ la prueba de la base." >&2; exit 1; fi
