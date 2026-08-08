# Importa script SQL (.sql) no PostgreSQL externo
# Uso: .\scripts\import-postgres.ps1 database\dump-tesouraria-202608070727-postgres.sql

param(
    [Parameter(Mandatory = $true)]
    [string]$SqlFile
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot
. "$ProjectRoot\scripts\pg-client.ps1"

if (-not (Test-Path $SqlFile)) {
    Write-Error "Arquivo SQL não encontrado: $SqlFile"
}

Import-DotEnv
$db = Get-DbConfig

Write-Host "=== Importar SQL no PostgreSQL ===" -ForegroundColor Cyan
Write-Host "Host:    $($db.Host):$($db.Port)"
Write-Host "Banco:   $($db.Name)"
Write-Host "Arquivo: $SqlFile"
Write-Host ""

Invoke-PgClient -PgArgs @("psql") -InputFile $SqlFile

Write-Host ""
Write-Host "Importação concluída!" -ForegroundColor Green
