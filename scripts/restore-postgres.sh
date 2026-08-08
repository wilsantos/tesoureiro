#!/usr/bin/env bash
# Restaura backup PostgreSQL (.dump) no banco externo
# Uso: ./scripts/restore-postgres.sh database/backup-postgres-20260806.dump

set -euo pipefail

BACKUP_FILE="${1:?Uso: $0 <arquivo.dump>}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Arquivo de backup não encontrado: ${BACKUP_FILE}" >&2
    exit 1
fi

if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

PG_HOST="${DB_HOST:-localhost}"
PG_PORT="${DB_PORT:-5432}"
PG_USER="${DB_USER:-tesoureiro}"
PG_DB="${DB_NAME:-tesouraria}"
PG_PASSWORD="${DB_PASSWORD:-}"
export PGPASSWORD="$PG_PASSWORD"

echo "=== Restore PostgreSQL ==="
echo "Host:    ${PG_HOST}:${PG_PORT}"
echo "Banco:   ${PG_DB}"
echo "Arquivo: ${BACKUP_FILE}"
echo ""

run_pg_restore() {
    pg_restore -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" --clean --if-exists --no-owner "$BACKUP_FILE"
}

if command -v pg_restore >/dev/null 2>&1; then
    run_pg_restore
else
    DOCKER_HOST="$PG_HOST"
    if [ "$PG_HOST" = "localhost" ] || [ "$PG_HOST" = "127.0.0.1" ]; then
        DOCKER_HOST="host.docker.internal"
    fi

    RESOLVED_BACKUP="$(cd "$(dirname "$BACKUP_FILE")" && pwd)/$(basename "$BACKUP_FILE")"

    docker run --rm \
        -e "PGPASSWORD=${PG_PASSWORD}" \
        -v "${RESOLVED_BACKUP}:/tmp/restore.dump:ro" \
        postgres:16-alpine \
        pg_restore -h "$DOCKER_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" --clean --if-exists --no-owner /tmp/restore.dump
fi

echo ""
echo "Restore concluído!"
echo "Ajustando sequences..."

if command -v psql >/dev/null 2>&1; then
    psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" < docker/postgres/init/02-sequences.sql
else
    DOCKER_HOST="$PG_HOST"
    if [ "$PG_HOST" = "localhost" ] || [ "$PG_HOST" = "127.0.0.1" ]; then
        DOCKER_HOST="host.docker.internal"
    fi

    docker run --rm -i \
        -e "PGPASSWORD=${PG_PASSWORD}" \
        postgres:16-alpine \
        psql -h "$DOCKER_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" < docker/postgres/init/02-sequences.sql
fi
