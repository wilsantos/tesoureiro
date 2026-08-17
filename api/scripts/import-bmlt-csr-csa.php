#!/usr/bin/env php
<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Execute via CLI: php api/scripts/import-bmlt-csr-csa.php\n");
    exit(1);
}

function loadEnvFile($path)
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        $pos = strpos($line, '=');
        if ($pos === false) {
            continue;
        }

        $name = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1));

        if ($name === '' || getenv($name) !== false) {
            continue;
        }

        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

function printUsage()
{
    $script = basename(__FILE__);
    echo <<<TXT
Importa CSRs (type RS) e CSAs (type AS) do BMLT para as tabelas csr e csa.

Uso:
  php api/scripts/{$script} [opções]

Opções:
  --dry-run       Simula a importação sem gravar (rollback ao final)
  --url=URL       URL alternativa do JSON BMLT
  --help          Exibe esta ajuda

Pré-requisito:
  Migração database/20260815_csr_csa_bmlt.sql aplicada no PostgreSQL.

TXT;
}

$options = getopt('', ['dry-run', 'url:', 'help']);
if (isset($options['help'])) {
    printUsage();
    exit(0);
}

$dryRun = array_key_exists('dry-run', $options);

$rootDir = dirname(__DIR__, 2);
loadEnvFile($rootDir . DIRECTORY_SEPARATOR . '.env');

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/bmlt-import.php';

$url = $options['url'] ?? BMLT_SERVICE_BODIES_URL;

error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');

try {
    echo "Baixando service bodies do BMLT...\n";
    $items = bmltFetchServiceBodies($url);
    echo count($items) . " registros no JSON.\n";

    $db = new Database();
    $conn = $db->getConnection();

    if ($dryRun) {
        echo "Modo dry-run: nenhuma alteração será persistida.\n";
    }

    $stats = bmltImportCsrCsa($conn, $items, ['dry_run' => $dryRun]);

    echo "\nResultado:\n";
    echo "  CSR inseridos:          {$stats['csr_inseridos']}\n";
    echo "  CSR atualizados:        {$stats['csr_atualizados']}\n";
    echo "  CSA inseridos:          {$stats['csa_inseridos']}\n";
    echo "  CSA atualizados:        {$stats['csa_atualizados']}\n";
    echo "  CSA legado vinculados:  {$stats['csa_legado_vinculados']}\n";

    if (!empty($stats['legado_vinculos'])) {
        echo "\nVínculos legado:\n";
        foreach ($stats['legado_vinculos'] as $vinculo) {
            echo "  - {$vinculo}\n";
        }
    }

    if ($dryRun) {
        echo "\nDry-run concluído (transação revertida).\n";
    } else {
        echo "\nImportação concluída com sucesso.\n";
    }

    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "Erro: " . $e->getMessage() . "\n");
    exit(1);
}
