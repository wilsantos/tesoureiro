# Restaura backup PostgreSQL (.dump) no banco externo
# Uso: .\scripts\restore-postgres.ps1 database\backup-postgres-20260806.dump

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot
. "$ProjectRoot\scripts\pg-client.ps1"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Arquivo de backup não encontrado: $BackupFile"
}

Import-DotEnv
$db = Get-DbConfig

Write-Host "=== Restore PostgreSQL ===" -ForegroundColor Cyan
Write-Host "Host:    $($db.Host):$($db.Port)"
Write-Host "Banco:   $($db.Name)"
Write-Host "Arquivo: $BackupFile"
Write-Host ""

Invoke-PgClient -PgArgs @("pg_restore", "--clean", "--if-exists", "--no-owner") -InputFile $BackupFile

Write-Host ""
Write-Host "Restore concluído!" -ForegroundColor Green
Write-Host "Ajustando sequences..."
Invoke-PgClient -PgArgs @("psql") -InputFile "docker/postgres/init/02-sequences.sql"
