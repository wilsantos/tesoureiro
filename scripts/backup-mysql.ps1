# Backup do banco MariaDB/MySQL (antes da migração para PostgreSQL)
# Uso:
#   .\scripts\backup-mysql.ps1                    # via container mysql-source
#   .\scripts\backup-mysql.ps1 -Source xampp      # via XAMPP local (localhost:3306)

param(
    [ValidateSet("docker", "xampp")]
    [string]$Source = "docker",
    [string]$OutputDir = "database"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

# Carregar variáveis do .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$DbName = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "tesouraria" }
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputFile = Join-Path $OutputDir "backup-mysql-$Timestamp.sql"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Write-Host "=== Backup MariaDB/MySQL ===" -ForegroundColor Cyan
Write-Host "Origem: $Source"
Write-Host "Banco:  $DbName"
Write-Host "Saída:  $OutputFile"
Write-Host ""

if ($Source -eq "docker") {
    $RootPassword = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "root_secret" }

    # Verificar se o container mysql-source está rodando
    $running = docker compose -f docker-compose.mysql-source.yml ps --status running -q mysql-source 2>$null
    if (-not $running) {
        Write-Host "Container mysql-source não está rodando. Iniciando..." -ForegroundColor Yellow
        docker compose -f docker-compose.mysql-source.yml up -d
        Write-Host "Aguardando MariaDB ficar pronto..."
        Start-Sleep -Seconds 15
    }

    docker compose -f docker-compose.mysql-source.yml exec -T mysql-source `
        mysqldump -u root -p"$RootPassword" --single-transaction --routines --triggers "$DbName" | `
        Set-Content -Path $OutputFile -Encoding UTF8
}
else {
    # XAMPP local
    $XamppDump = "C:\xampp\mysql\bin\mysqldump.exe"
    if (-not (Test-Path $XamppDump)) {
        Write-Error "mysqldump não encontrado em $XamppDump. Ajuste o caminho ou use -Source docker."
    }

    $User = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "root" }
    $Password = if ($env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD } else { "" }
    $Port = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { "3306" }

    if ($Password) {
        & $XamppDump -h localhost -P $Port -u $User -p"$Password" --single-transaction --routines --triggers $DbName | Set-Content -Path $OutputFile -Encoding UTF8
    } else {
        & $XamppDump -h localhost -P $Port -u $User --single-transaction --routines --triggers $DbName | Set-Content -Path $OutputFile -Encoding UTF8
    }
}

if (Test-Path $OutputFile) {
    $Size = (Get-Item $OutputFile).Length
    Write-Host ""
    Write-Host "Backup concluído: $OutputFile ($([math]::Round($Size / 1KB, 1)) KB)" -ForegroundColor Green
} else {
    Write-Error "Falha ao criar o arquivo de backup."
}
