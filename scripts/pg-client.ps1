# Funções compartilhadas para scripts PostgreSQL (banco externo)

function Import-DotEnv {
    param([string]$Path = ".env")

    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
                [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
            }
        }
    }
}

function Get-DbConfig {
    return [PSCustomObject]@{
        Host     = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
        Port     = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
        Name     = if ($env:DB_NAME) { $env:DB_NAME } else { "tesouraria" }
        User     = if ($env:DB_USER) { $env:DB_USER } else { "tesoureiro" }
        Password = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }
    }
}

function Get-DockerPgHost {
    param([string]$DbHost)

    if ($DbHost -in @("localhost", "127.0.0.1", "::1")) {
        return "host.docker.internal"
    }

    return $DbHost
}

function Invoke-PgClient {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$PgArgs,
        [string]$InputFile = ""
    )

    $db = Get-DbConfig
    $pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
    $pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
    $psql = Get-Command psql -ErrorAction SilentlyContinue

    $client = $PgArgs[0]
    $clientArgs = $PgArgs[1..($PgArgs.Length - 1)]

    $commonArgs = @(
        "-h", $db.Host,
        "-p", $db.Port,
        "-U", $db.User,
        "-d", $db.Name
    )

    $env:PGPASSWORD = $db.Password

    if ($client -eq "pg_dump" -and $pgDump) {
        & pg_dump @commonArgs @clientArgs
        return
    }

    if ($client -eq "pg_restore" -and $pgRestore) {
        if ($InputFile) {
            & pg_restore @commonArgs @clientArgs $InputFile
        } else {
            & pg_restore @commonArgs @clientArgs
        }
        return
    }

    if ($client -eq "psql" -and $psql) {
        if ($InputFile) {
            Get-Content $InputFile -Raw | & psql @commonArgs @clientArgs
        } else {
            & psql @commonArgs @clientArgs
        }
        return
    }

    $dockerHost = Get-DockerPgHost -DbHost $db.Host
    $dockerArgs = @(
        "run", "--rm",
        "-e", "PGPASSWORD=$($db.Password)",
        "postgres:16-alpine"
    )

    if ($client -eq "pg_dump") {
        $dockerArgs += @(
            "pg_dump",
            "-h", $dockerHost,
            "-p", $db.Port,
            "-U", $db.User,
            "-d", $db.Name
        )
        $dockerArgs += $clientArgs
        & docker @dockerArgs
        return
    }

    if ($client -eq "pg_restore") {
        $mountFile = $InputFile
        $containerFile = "/tmp/restore.dump"

        if ($InputFile) {
            $resolved = Resolve-Path $InputFile
            $mountFile = $resolved.Path
            $dockerArgs += @("-v", "${mountFile}:${containerFile}:ro")
        }

        $dockerArgs += @(
            "pg_restore",
            "-h", $dockerHost,
            "-p", $db.Port,
            "-U", $db.User,
            "-d", $db.Name
        )
        $dockerArgs += $clientArgs

        if ($InputFile) {
            $dockerArgs += $containerFile
        }

        & docker @dockerArgs
        return
    }

    if ($client -eq "psql") {
        if ($InputFile) {
            Get-Content $InputFile -Raw | docker run --rm -i `
                -e "PGPASSWORD=$($db.Password)" `
                postgres:16-alpine `
                psql -h $dockerHost -p $db.Port -U $db.User -d $db.Name @clientArgs
        } else {
            docker run --rm -i `
                -e "PGPASSWORD=$($db.Password)" `
                postgres:16-alpine `
                psql -h $dockerHost -p $db.Port -U $db.User -d $db.Name @clientArgs
        }
        return
    }

    throw "Cliente PostgreSQL não suportado: $client"
}
