# Converte dump MySQL da aplicação Tesoureiro para PostgreSQL
# Uso: .\scripts\convert-mysql-dump-to-postgres.ps1
#      .\scripts\convert-mysql-dump-to-postgres.ps1 database\dump.sql database\dump-postgres.sql

param(
    [string]$InputFile = "database\dump-tesouraria-202608070727-mysql.sql",
    [string]$OutputFile = "database\dump-tesouraria-202608070727-postgres.sql"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

$content = Get-Content $InputFile -Raw -Encoding UTF8

function Get-InsertValues {
    param([string]$Table)

    if ($content -match "INSERT INTO ``$Table`` VALUES (.+?);") {
        return $Matches[1].Trim()
    }

    throw "INSERT não encontrado para tabela $Table"
}

function Convert-BoolField {
    param([string]$Value)

    $Value = $Value.Trim()
    if ($Value -eq "NULL") { return "NULL" }
    if ($Value -eq "0") { return "FALSE" }
    if ($Value -eq "1") { return "TRUE" }
    return $Value
}

function Split-SqlRows {
    param([string]$ValuesBlob)

    $rows = New-Object System.Collections.Generic.List[string]
    $depth = 0
    $current = ""

    foreach ($char in $ValuesBlob.ToCharArray()) {
        if ($char -eq '(') {
            $depth++
            if ($depth -eq 1) {
                $current = ""
                continue
            }
        }
        elseif ($char -eq ')') {
            $depth--
            if ($depth -eq 0) {
                [void]$rows.Add($current)
                $current = ""
                continue
            }
        }

        if ($depth -ge 1) {
            $current += $char
        }
    }

    return $rows
}

function Split-SqlFields {
    param([string]$Row)

    $parts = New-Object System.Collections.Generic.List[string]
    $buf = ""
    $inString = $false

    foreach ($char in $Row.ToCharArray()) {
        if ($char -eq "'") {
            $inString = -not $inString
            $buf += $char
        }
        elseif ($char -eq ',' -and -not $inString) {
            [void]$parts.Add($buf.Trim())
            $buf = ""
        }
        else {
            $buf += $char
        }
    }

    if ($buf) {
        [void]$parts.Add($buf.Trim())
    }

    return $parts
}

function Convert-DespesasValues {
    param([string]$ValuesBlob)

    $converted = @()
    foreach ($row in (Split-SqlRows $ValuesBlob)) {
        $fields = @(Split-SqlFields $row)
        if ($fields.Count -ne 7) {
            throw "Linha de despesas inválida"
        }
        $fields[4] = Convert-BoolField $fields[4]
        $fields[5] = Convert-BoolField $fields[5]
        $converted += "(" + ($fields -join ", ") + ")"
    }
    return ($converted -join ", ")
}

$schema = @'
-- Dump PostgreSQL convertido de dump-tesouraria-202608070727-mysql.sql
-- Compatible with the Tesoureiro application PostgreSQL schema

BEGIN;

DROP TABLE IF EXISTS despesas CASCADE;
DROP TABLE IF EXISTS reuniao CASCADE;
DROP TABLE IF EXISTS grupo CASCADE;
DROP TABLE IF EXISTS csa CASCADE;

CREATE TABLE csa (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(400) NOT NULL
);

CREATE TABLE grupo (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(4000) NOT NULL,
  "Endereco" VARCHAR(4000) NOT NULL,
  "CSA" INTEGER NOT NULL,
  "Saldo" DECIMAL(12,2) NOT NULL,
  "DataSaldo" DATE DEFAULT NULL
);

CREATE TABLE reuniao (
  "Id" SERIAL PRIMARY KEY,
  "IdGrupo" INTEGER NOT NULL,
  "Data" DATE NOT NULL,
  "Membros" INTEGER NOT NULL,
  "Visitantes" INTEGER NOT NULL,
  "ValorSetima" DECIMAL(12,2) NOT NULL,
  "ValorSetimaPix" DECIMAL(12,2) NOT NULL,
  "VendaLiteratura" DECIMAL(12,2) DEFAULT NULL,
  "Ingresso" INTEGER NOT NULL,
  "TrintaDias" INTEGER NOT NULL,
  "SessentaDias" INTEGER NOT NULL,
  "NoventaDias" INTEGER NOT NULL,
  "SeisMeses" INTEGER NOT NULL,
  "NoveMeses" INTEGER NOT NULL,
  "UmAno" INTEGER NOT NULL,
  "DezoitoMeses" INTEGER NOT NULL,
  "MultiplosAnos" INTEGER NOT NULL,
  "FatosRelevantes" VARCHAR(4000) NOT NULL
);

CREATE TABLE despesas (
  "Id" SERIAL PRIMARY KEY,
  "IdReuniao" INTEGER NOT NULL,
  "Descricao" VARCHAR(400) NOT NULL,
  "ValorDespesa" DECIMAL(12,2) NOT NULL,
  repasse BOOLEAN DEFAULT NULL,
  compra_literatura BOOLEAN DEFAULT NULL,
  "Comprovante" BYTEA DEFAULT NULL
);

'@

$reuniaoColumns = '"Id", "IdGrupo", "Data", "Membros", "Visitantes", "ValorSetima", "ValorSetimaPix", "VendaLiteratura", "Ingresso", "TrintaDias", "SessentaDias", "NoventaDias", "SeisMeses", "NoveMeses", "UmAno", "DezoitoMeses", "MultiplosAnos", "FatosRelevantes"'

$output = @(
    $schema
    'INSERT INTO csa ("Id", "Nome") VALUES ' + (Get-InsertValues "csa") + ';'
    'INSERT INTO grupo ("Id", "Nome", "Endereco", "CSA", "Saldo", "DataSaldo") VALUES ' + (Get-InsertValues "grupo") + ';'
    "INSERT INTO reuniao ($reuniaoColumns) VALUES " + (Get-InsertValues "reuniao") + ';'
    'INSERT INTO despesas ("Id", "IdReuniao", "Descricao", "ValorDespesa", repasse, compra_literatura, "Comprovante") VALUES ' + (Convert-DespesasValues (Get-InsertValues "despesas")) + ';'
    @'

SELECT setval(pg_get_serial_sequence('csa', 'Id'), COALESCE((SELECT MAX("Id") FROM csa), 1));
SELECT setval(pg_get_serial_sequence('grupo', 'Id'), COALESCE((SELECT MAX("Id") FROM grupo), 1));
SELECT setval(pg_get_serial_sequence('reuniao', 'Id'), COALESCE((SELECT MAX("Id") FROM reuniao), 1));
SELECT setval(pg_get_serial_sequence('despesas', 'Id'), COALESCE((SELECT MAX("Id") FROM despesas), 1));

COMMIT;
'@
) -join "`n"

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $ProjectRoot $OutputFile), $output, $utf8NoBom)
Write-Host "Gerado: $OutputFile" -ForegroundColor Green
