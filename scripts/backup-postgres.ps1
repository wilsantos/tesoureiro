# Backup do banco PostgreSQL externo (formato custom, compacto, inclui blobs)
# Uso: .\scripts\backup-postgres.ps1

param(
    [string]$OutputDir = "database"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot
. "$ProjectRoot\scripts\pg-client.ps1"

Import-DotEnv
$db = Get-DbConfig
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputFile = Join-Path $OutputDir "backup-postgres-$Timestamp.dump"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Write-Host "=== Backup PostgreSQL ===" -ForegroundColor Cyan
Write-Host "Host:  $($db.Host):$($db.Port)"
Write-Host "Banco: $($db.Name)"
Write-Host "Saída: $OutputFile"
Write-Host ""

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
$env:PGPASSWORD = $db.Password

if ($pgDump) {
    & pg_dump -h $db.Host -p $db.Port -U $db.User -d $db.Name -Fc -f $OutputFile
} else {
    $dockerHost = Get-DockerPgHost -DbHost $db.Host
    $resolvedOutput = (Resolve-Path $OutputDir).Path
    $containerFile = "/backup/backup-postgres-$Timestamp.dump"

    docker run --rm `
        -e "PGPASSWORD=$($db.Password)" `
        -v "${resolvedOutput}:/backup" `
        postgres:16-alpine `
        pg_dump -h $dockerHost -p $db.Port -U $db.User -d $db.Name -Fc -f $containerFile
}

if (Test-Path $OutputFile) {
    $Size = (Get-Item $OutputFile).Length
    Write-Host "Backup concluído: $OutputFile ($([math]::Round($Size / 1KB, 1)) KB)" -ForegroundColor Green
} else {
    Write-Error "Falha ao criar o arquivo de backup."
}
