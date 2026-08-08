#!/usr/bin/env bash
# Backup do banco MariaDB/MySQL (antes da migração para PostgreSQL)
# Uso:
#   ./scripts/backup-mysql.sh              # via container mysql-source
#   ./scripts/backup-mysql.sh xampp        # via MySQL local

set -euo pipefail

SOURCE="${1:-docker}"
OUTPUT_DIR="database"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

DB_NAME="${MYSQL_DATABASE:-tesouraria}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="${OUTPUT_DIR}/backup-mysql-${TIMESTAMP}.sql"

mkdir -p "$OUTPUT_DIR"

echo "=== Backup MariaDB/MySQL ==="
echo "Origem: ${SOURCE}"
echo "Banco:  ${DB_NAME}"
echo "Saída:  ${OUTPUT_FILE}"
echo ""

if [ "$SOURCE" = "docker" ]; then
    ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_secret}"

    if ! docker compose -f docker-compose.mysql-source.yml ps --status running -q mysql-source 2>/dev/null | grep -q .; then
        echo "Container mysql-source não está rodando. Iniciando..."
        docker compose -f docker-compose.mysql-source.yml up -d
        sleep 15
    fi

    docker compose -f docker-compose.mysql-source.yml exec -T mysql-source \
        mysqldump -u root -p"${ROOT_PASSWORD}" --single-transaction --routines --triggers "${DB_NAME}" \
        > "${OUTPUT_FILE}"
else
    MYSQL_USER="${MYSQL_USER:-root}"
    MYSQL_PORT="${MYSQL_PORT:-3306}"

    mysqldump -h localhost -P "${MYSQL_PORT}" -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD:-}" \
        --single-transaction --routines --triggers "${DB_NAME}" \
        > "${OUTPUT_FILE}"
fi

echo ""
echo "Backup concluído: ${OUTPUT_FILE} ($(du -h "${OUTPUT_FILE}" | cut -f1))"
