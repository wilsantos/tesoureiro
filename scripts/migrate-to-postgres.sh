#!/usr/bin/env bash
# Migra dados do MariaDB/MySQL para PostgreSQL externo usando pgloader
# Uso:
#   ./scripts/migrate-to-postgres.sh
#   ./scripts/migrate-to-postgres.sh database/backup-mysql-20260806.sql

set -euo pipefail

BACKUP_FILE="${1:-}"
SKIP_BACKUP_RESTORE="${SKIP_BACKUP_RESTORE:-false}"
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
PG_PASSWORD="${DB_PASSWORD:-tesoureiro_secret}"
PG_DB="${DB_NAME:-tesouraria}"
MYSQL_USER="${MYSQL_USER:-tesoureiro}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-tesoureiro_secret}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_secret}"
MYSQL_DB="${MYSQL_DATABASE:-tesouraria}"

DOCKER_PG_HOST="$PG_HOST"
if [ "$PG_HOST" = "localhost" ] || [ "$PG_HOST" = "127.0.0.1" ]; then
    DOCKER_PG_HOST="host.docker.internal"
fi

echo "=== Migração MariaDB -> PostgreSQL ==="
echo "Destino: ${PG_HOST}:${PG_PORT}/${PG_DB}"
echo ""

echo "[1/4] Subindo MariaDB temporário (mysql-source)..."
docker compose -f docker-compose.mysql-source.yml up -d
sleep 15

if [ "$SKIP_BACKUP_RESTORE" != "true" ]; then
    if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="$(ls -t database/backup-mysql-*.sql 2>/dev/null | head -1 || true)"
    fi

    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        echo "[2/4] Restaurando backup no MariaDB: ${BACKUP_FILE}"
        docker compose -f docker-compose.mysql-source.yml exec -T mysql-source \
            mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DB}" < "${BACKUP_FILE}"
    else
        echo "[2/4] Nenhum backup encontrado — usando dados já existentes no mysql-source."
    fi
else
    echo "[2/4] Restauração de backup ignorada (SKIP_BACKUP_RESTORE=true)."
fi

echo "[3/4] Limpando schema PostgreSQL e executando pgloader..."
export PGPASSWORD="$PG_PASSWORD"

if command -v psql >/dev/null 2>&1; then
    psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO ${PG_USER};
GRANT ALL ON SCHEMA public TO public;
"
else
    docker run --rm -i \
        -e "PGPASSWORD=${PG_PASSWORD}" \
        postgres:16-alpine \
        psql -h "$DOCKER_PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO ${PG_USER};
GRANT ALL ON SCHEMA public TO public;
"
fi

MYSQL_CONTAINER="$(docker compose -f docker-compose.mysql-source.yml ps -q mysql-source)"
NETWORK_NAME="$(docker inspect "${MYSQL_CONTAINER}" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"

MYSQL_URI="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql-source/${MYSQL_DB}"
PG_URI="postgresql://${PG_USER}:${PG_PASSWORD}@${DOCKER_PG_HOST}:${PG_PORT}/${PG_DB}"

LOAD_FILE="${PROJECT_ROOT}/scripts/pgloader.generated.load"
sed "s|__MYSQL_URI__|${MYSQL_URI}|g; s|__PG_URI__|${PG_URI}|g" \
    scripts/pgloader.load.template > "${LOAD_FILE}"

docker run --rm \
    --network "${NETWORK_NAME}" \
    --add-host=host.docker.internal:host-gateway \
    -v "${LOAD_FILE}:/pgloader.load:ro" \
    dimitri/pgloader:latest \
    pgloader /pgloader.load

rm -f "${LOAD_FILE}"

echo "[4/4] Ajustando sequences do PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" < docker/postgres/init/02-sequences.sql
else
    docker run --rm -i \
        -e "PGPASSWORD=${PG_PASSWORD}" \
        postgres:16-alpine \
        psql -h "$DOCKER_PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" < docker/postgres/init/02-sequences.sql
fi

echo ""
echo "Migração concluída!"
