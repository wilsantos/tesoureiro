#!/usr/bin/env bash
# Backup do banco PostgreSQL externo (formato custom, compacto, inclui blobs)
# Uso: ./scripts/backup-postgres.sh

set -euo pipefail

OUTPUT_DIR="database"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

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
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="${OUTPUT_DIR}/backup-postgres-${TIMESTAMP}.dump"

mkdir -p "$OUTPUT_DIR"
export PGPASSWORD="$PG_PASSWORD"

echo "=== Backup PostgreSQL ==="
echo "Host:  ${PG_HOST}:${PG_PORT}"
echo "Banco: ${PG_DB}"
echo "Saída: ${OUTPUT_FILE}"
echo ""

if command -v pg_dump >/dev/null 2>&1; then
    pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -Fc -f "$OUTPUT_FILE"
else
    DOCKER_HOST="$PG_HOST"
    if [ "$PG_HOST" = "localhost" ] || [ "$PG_HOST" = "127.0.0.1" ]; then
        DOCKER_HOST="host.docker.internal"
    fi

    docker run --rm \
        -e "PGPASSWORD=${PG_PASSWORD}" \
        -v "${PROJECT_ROOT}/${OUTPUT_DIR}:/backup" \
        postgres:16-alpine \
        pg_dump -h "$DOCKER_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -Fc -f "/backup/backup-postgres-${TIMESTAMP}.dump"
fi

echo "Backup concluído: ${OUTPUT_FILE} ($(du -h "${OUTPUT_FILE}" | cut -f1))"
