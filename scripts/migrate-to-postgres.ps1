# Migra dados do MariaDB/MySQL para PostgreSQL externo usando pgloader
# Pré-requisitos:
#   1. Executar backup-mysql.ps1 (recomendado)
#   2. Configurar DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD no .env
#
# Uso:
#   .\scripts\migrate-to-postgres.ps1
#   .\scripts\migrate-to-postgres.ps1 -BackupFile database\backup-mysql-20260806.sql

param(
    [string]$BackupFile = "",
    [switch]$SkipBackupRestore
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot
. "$ProjectRoot\scripts\pg-client.ps1"

Import-DotEnv
$db = Get-DbConfig
$MysqlUser = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "tesoureiro" }
$MysqlPassword = if ($env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD } else { "tesoureiro_secret" }
$MysqlRootPassword = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "root_secret" }
$MysqlDb = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "tesouraria" }
$PgHostForDocker = Get-DockerPgHost -DbHost $db.Host

Write-Host "=== Migração MariaDB -> PostgreSQL ===" -ForegroundColor Cyan
Write-Host "Destino: $($db.Host):$($db.Port)/$($db.Name)"
Write-Host ""

# 1. Subir MariaDB temporário (origem)
Write-Host "[1/4] Subindo MariaDB temporário (mysql-source)..." -ForegroundColor Yellow
docker compose -f docker-compose.mysql-source.yml up -d
Write-Host "Aguardando MariaDB ficar pronto..."
Start-Sleep -Seconds 15

# 2. Restaurar backup no MariaDB (se fornecido)
if (-not $SkipBackupRestore) {
    if (-not $BackupFile) {
        $latestBackup = Get-ChildItem -Path "database" -Filter "backup-mysql-*.sql" -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($latestBackup) {
            $BackupFile = $latestBackup.FullName
        }
    }

    if ($BackupFile -and (Test-Path $BackupFile)) {
        Write-Host "[2/4] Restaurando backup no MariaDB: $BackupFile" -ForegroundColor Yellow
        Get-Content $BackupFile | docker compose -f docker-compose.mysql-source.yml exec -T mysql-source `
            mysql -u root -p"$MysqlRootPassword" $MysqlDb
    } else {
        Write-Host "[2/4] Nenhum backup encontrado — usando dados já existentes no mysql-source." -ForegroundColor Yellow
    }
} else {
    Write-Host "[2/4] Restauração de backup ignorada (-SkipBackupRestore)." -ForegroundColor Yellow
}

# 3. Limpar schema PostgreSQL e executar pgloader
Write-Host "[3/4] Limpando schema PostgreSQL e executando pgloader..." -ForegroundColor Yellow

$env:PGPASSWORD = $db.Password
$psql = Get-Command psql -ErrorAction SilentlyContinue
$resetSql = @"
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO $($db.User);
GRANT ALL ON SCHEMA public TO public;
"@

if ($psql) {
    $resetSql | & psql -h $db.Host -p $db.Port -U $db.User -d $db.Name
} else {
    $resetSql | docker run --rm -i `
        -e "PGPASSWORD=$($db.Password)" `
        postgres:16-alpine `
        psql -h $PgHostForDocker -p $db.Port -U $db.User -d $db.Name
}

$MysqlContainer = docker compose -f docker-compose.mysql-source.yml ps -q mysql-source
$NetworkName = docker inspect $MysqlContainer --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}'

$MysqlUri = "mysql://${MysqlUser}:${MysqlPassword}@mysql-source/${MysqlDb}"
$PgUri = "postgresql://$($db.User):$($db.Password)@${PgHostForDocker}:$($db.Port)/$($db.Name)"

$LoadFile = Join-Path $ProjectRoot "scripts/pgloader.generated.load"
$Template = Get-Content "scripts/pgloader.load.template" -Raw
$Template.Replace("__MYSQL_URI__", $MysqlUri).Replace("__PG_URI__", $PgUri) | Set-Content $LoadFile -Encoding UTF8

docker run --rm `
    --network $NetworkName `
    --add-host=host.docker.internal:host-gateway `
    -v "${LoadFile}:/pgloader.load:ro" `
    dimitri/pgloader:latest `
    pgloader /pgloader.load

Remove-Item $LoadFile -ErrorAction SilentlyContinue

# 4. Ajustar sequences
Write-Host "[4/4] Ajustando sequences do PostgreSQL..." -ForegroundColor Yellow
Invoke-PgClient -PgArgs @("psql") -InputFile "docker/postgres/init/02-sequences.sql"

Write-Host ""
Write-Host "Migração concluída!" -ForegroundColor Green
Write-Host "Suba a aplicação com: docker compose up -d --build"
Write-Host "Teste a conexão em: http://localhost:8081/api/test.php"
