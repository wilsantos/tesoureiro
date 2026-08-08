# Cria o schema inicial no PostgreSQL externo
# Uso: .\scripts\init-postgres.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot
. "$ProjectRoot\scripts\pg-client.ps1"

Import-DotEnv
$db = Get-DbConfig

Write-Host "=== Inicializar schema PostgreSQL ===" -ForegroundColor Cyan
Write-Host "Host:  $($db.Host):$($db.Port)"
Write-Host "Banco: $($db.Name)"
Write-Host ""

Invoke-PgClient -PgArgs @("psql") -InputFile "docker/postgres/init/01-schema.sql"
Invoke-PgClient -PgArgs @("psql") -InputFile "docker/postgres/init/02-sequences.sql"

Write-Host "Schema criado com sucesso!" -ForegroundColor Green
