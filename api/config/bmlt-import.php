<?php

const BMLT_SERVICE_BODIES_URL =
    'https://bmlt.na.org.br/ativo/main_server/client_interface/json/?switcher=GetServiceBodies';

/**
 * @return array<int, array<string, mixed>>
 */
function bmltFetchServiceBodies($url = BMLT_SERVICE_BODIES_URL)
{
    $context = stream_context_create([
        'http' => [
            'timeout' => 60,
            'header' => "Accept: application/json\r\nUser-Agent: Tesoureiro-BMLT-Import/1.0\r\n",
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        throw new RuntimeException('Falha ao baixar JSON do BMLT: ' . $url);
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException('JSON do BMLT inválido: ' . json_last_error_msg());
    }

    if (!is_array($data)) {
        throw new RuntimeException('JSON do BMLT deve ser um array de service bodies');
    }

    return $data;
}

function bmltNullIfEmpty($value)
{
    if ($value === null) {
        return null;
    }

    $value = trim((string) $value);

    return $value === '' ? null : $value;
}

function bmltNormalizeName($name)
{
    $name = mb_strtolower(trim((string) $name), 'UTF-8');
    $name = preg_replace('/\s+/u', ' ', $name);

    return $name ?? '';
}

function bmltStripCsaPrefix($name)
{
    return preg_replace('/^csa\s+/iu', '', bmltNormalizeName($name));
}

function bmltMatchLegacyCsaName($legacyNome, $bmltName)
{
    $legacy = bmltNormalizeName($legacyNome);
    $bmlt = bmltNormalizeName($bmltName);

    if ($legacy === '' || $bmlt === '') {
        return false;
    }

    if ($legacy === $bmlt) {
        return true;
    }

    if (strpos($bmlt, $legacy) === 0) {
        return true;
    }

    $legacyCore = bmltStripCsaPrefix($legacyNome);
    $bmltCore = bmltStripCsaPrefix($bmltName);

    if ($legacyCore !== '' && strpos($bmltCore, $legacyCore) !== false) {
        return true;
    }

    if ($bmltCore !== '' && strpos($legacyCore, $bmltCore) !== false) {
        return true;
    }

    return false;
}

/**
 * @param array<int, array<string, mixed>> $items
 * @param array{dry_run?: bool} $options
 * @return array<string, int|array<int, string>>
 */
function bmltImportCsrCsa(PDO $conn, array $items, array $options = [])
{
    $dryRun = !empty($options['dry_run']);

    $rsItems = [];
    $asItems = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $type = (string) ($item['type'] ?? '');
        if ($type === 'RS') {
            $rsItems[] = $item;
        } elseif ($type === 'AS') {
            $asItems[] = $item;
        }
    }

    $rsBmltIds = [];
    foreach ($rsItems as $item) {
        $rsBmltIds[(int) $item['id']] = true;
    }

    $missingParents = [];
    foreach ($asItems as $item) {
        $parentId = (int) ($item['parent_id'] ?? 0);
        if ($parentId <= 0 || !isset($rsBmltIds[$parentId])) {
            $missingParents[] = (string) ($item['id'] ?? '?') . ' (parent_id=' . $parentId . ')';
        }
    }

    if ($missingParents !== []) {
        throw new RuntimeException(
            'CSAs com parent_id sem CSR correspondente no JSON: ' . implode(', ', $missingParents)
        );
    }

    $stats = [
        'csr_inseridos' => 0,
        'csr_atualizados' => 0,
        'csa_inseridos' => 0,
        'csa_atualizados' => 0,
        'csa_legado_vinculados' => 0,
        'csa_ignorados' => 0,
        'legado_vinculos' => [],
    ];

    $conn->beginTransaction();

    try {
        $csrExistsStmt = $conn->prepare('SELECT 1 FROM csr WHERE "BmltId" = ? LIMIT 1');
        $csrUpsertStmt = $conn->prepare(
            'INSERT INTO csr ("BmltId", "Nome", "Descricao", "Url", "Helpline", "WorldId", "ImportadoEm", "AtualizadoEm")
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT ("BmltId") DO UPDATE SET
               "Nome" = EXCLUDED."Nome",
               "Descricao" = EXCLUDED."Descricao",
               "Url" = EXCLUDED."Url",
               "Helpline" = EXCLUDED."Helpline",
               "WorldId" = EXCLUDED."WorldId",
               "AtualizadoEm" = CURRENT_TIMESTAMP'
        );

        foreach ($rsItems as $item) {
            $bmltId = (int) $item['id'];
            $csrExistsStmt->execute([$bmltId]);
            $exists = (bool) $csrExistsStmt->fetchColumn();

            $csrUpsertStmt->execute([
                $bmltId,
                (string) $item['name'],
                bmltNullIfEmpty($item['description'] ?? null),
                bmltNullIfEmpty($item['url'] ?? null),
                bmltNullIfEmpty($item['helpline'] ?? null),
                bmltNullIfEmpty($item['world_id'] ?? null),
            ]);

            if ($exists) {
                $stats['csr_atualizados']++;
            } else {
                $stats['csr_inseridos']++;
            }
        }

        $csrMapStmt = $conn->query('SELECT "Id", "BmltId" FROM csr');
        $csrByBmltId = [];
        while ($row = $csrMapStmt->fetch(PDO::FETCH_ASSOC)) {
            $csrByBmltId[(int) $row['BmltId']] = (int) $row['Id'];
        }

        $legacyCsas = $conn->query(
            'SELECT "Id", "Nome" FROM csa WHERE "BmltId" IS NULL ORDER BY "Id"'
        )->fetchAll(PDO::FETCH_ASSOC);

        $csaByBmltStmt = $conn->prepare('SELECT "Id" FROM csa WHERE "BmltId" = ? LIMIT 1');
        $csaInsertStmt = $conn->prepare(
            'INSERT INTO csa ("BmltId", "CSR", "Nome", "Descricao", "Url", "Helpline", "WorldId", "ImportadoEm", "AtualizadoEm")
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
        );
        $csaUpdateStmt = $conn->prepare(
            'UPDATE csa SET
               "BmltId" = ?,
               "CSR" = ?,
               "Nome" = ?,
               "Descricao" = ?,
               "Url" = ?,
               "Helpline" = ?,
               "WorldId" = ?,
               "AtualizadoEm" = CURRENT_TIMESTAMP,
               "ImportadoEm" = COALESCE("ImportadoEm", CURRENT_TIMESTAMP)
             WHERE "Id" = ?'
        );

        foreach ($asItems as $item) {
            $bmltId = (int) $item['id'];
            $parentId = (int) $item['parent_id'];
            $csrId = $csrByBmltId[$parentId] ?? null;

            if ($csrId === null) {
                throw new RuntimeException(
                    'CSR não encontrado para CSA BMLT id ' . $bmltId . ' (parent_id=' . $parentId . ')'
                );
            }

            $fields = [
                $bmltId,
                $csrId,
                (string) $item['name'],
                bmltNullIfEmpty($item['description'] ?? null),
                bmltNullIfEmpty($item['url'] ?? null),
                bmltNullIfEmpty($item['helpline'] ?? null),
                bmltNullIfEmpty($item['world_id'] ?? null),
            ];

            $csaByBmltStmt->execute([$bmltId]);
            $existingId = $csaByBmltStmt->fetchColumn();

            if ($existingId) {
                $fields[] = (int) $existingId;
                $csaUpdateStmt->execute($fields);
                $stats['csa_atualizados']++;
                continue;
            }

            $legacyMatch = null;
            $legacyIndex = null;
            foreach ($legacyCsas as $index => $legacy) {
                if (bmltMatchLegacyCsaName($legacy['Nome'], (string) $item['name'])) {
                    $legacyMatch = $legacy;
                    $legacyIndex = $index;
                    break;
                }
            }

            if ($legacyMatch !== null) {
                $fields[] = (int) $legacyMatch['Id'];
                $csaUpdateStmt->execute($fields);
                unset($legacyCsas[$legacyIndex]);
                $stats['csa_atualizados']++;
                $stats['csa_legado_vinculados']++;
                $stats['legado_vinculos'][] = $legacyMatch['Nome'] . ' → ' . $item['name'] . ' (BMLT ' . $bmltId . ')';
                continue;
            }

            $csaInsertStmt->execute($fields);
            $stats['csa_inseridos']++;
        }

        if ($dryRun) {
            $conn->rollBack();
        } else {
            $conn->commit();
        }
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        throw $e;
    }

    return $stats;
}
