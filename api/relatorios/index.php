<?php
// Headers CORS devem ser enviados antes de qualquer output
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Habilitar exibição de erros para debug (remover em produção se necessário)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = new Database();
    $conn = $db->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao conectar ao banco de dados', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

switch ($method) {
    case 'GET':
        // Validar parâmetros obrigatórios
        if (!isset($_GET['tipo']) || !isset($_GET['IdGrupo']) || !isset($_GET['mes']) || !isset($_GET['ano'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Parâmetros obrigatórios: tipo, IdGrupo, mes, ano'], JSON_UNESCAPED_UNICODE);
            break;
        }

        $tipo = $_GET['tipo'];
        $idGrupo = $_GET['IdGrupo'];
        $mes = $_GET['mes'];
        $ano = $_GET['ano'];

        try {
            if ($tipo === 'geral') {
                // Relatório Geral de Reuniões com Totais do Mês
                $stmt = $conn->prepare("
                    SELECT 
                        r.*,
                        g.Nome as NomeGrupo,
                        COUNT(r.Id) as TotalReunioes,
                        SUM(r.Membros) as TotalMembros,
                        SUM(r.Visitantes) as TotalVisitantes,
                        SUM(r.ValorSetima + r.ValorSetimaPix) as TotalSetimaMes,
                        SUM(r.Ingresso + r.TrintaDias + r.SessentaDias + r.NoventaDias + 
                            r.SeisMeses + r.NoveMeses + r.UmAno + r.DezoitoMeses + r.MultiplosAnos) as TotalNovosMembros
                    FROM reuniao r
                    INNER JOIN grupo g ON r.IdGrupo = g.Id
                    WHERE r.IdGrupo = ? AND MONTH(r.Data) = ? AND YEAR(r.Data) = ?
                    GROUP BY r.IdGrupo, MONTH(r.Data), YEAR(r.Data)
                ");
                $stmt->execute([$idGrupo, $mes, $ano]);
                
                // Buscar reuniões individuais
                $stmtReunioes = $conn->prepare("
                    SELECT r.*, g.Nome as NomeGrupo
                    FROM reuniao r
                    INNER JOIN grupo g ON r.IdGrupo = g.Id
                    WHERE r.IdGrupo = ? AND MONTH(r.Data) = ? AND YEAR(r.Data) = ?
                    ORDER BY r.Data ASC
                ");
                $stmtReunioes->execute([$idGrupo, $mes, $ano]);
                $reunioes = $stmtReunioes->fetchAll();

                // Calcular totais
                $totais = [
                    'TotalReunioes' => count($reunioes),
                    'TotalMembros' => array_sum(array_column($reunioes, 'Membros')),
                    'TotalVisitantes' => array_sum(array_column($reunioes, 'Visitantes')),
                    'TotalSetimaMes' => 0,
                    'TotalSetimaPixMes' => 0,
                    'TotalNovosMembros' => 0
                ];

                foreach ($reunioes as $r) {
                    $totais['TotalSetimaMes'] += floatval($r['ValorSetima']);
                    $totais['TotalSetimaPixMes'] += floatval($r['ValorSetimaPix']);
                    $totais['TotalNovosMembros'] += intval($r['Ingresso']) + intval($r['TrintaDias']) + 
                        intval($r['SessentaDias']) + intval($r['NoventaDias']) + intval($r['SeisMeses']) + 
                        intval($r['NoveMeses']) + intval($r['UmAno']) + intval($r['DezoitoMeses']) + 
                        intval($r['MultiplosAnos']);
                }

                echo json_encode([
                    'tipo' => 'geral',
                    'grupo' => $reunioes[0]['NomeGrupo'] ?? '',
                    'mes' => $mes,
                    'ano' => $ano,
                    'reunioes' => $reunioes,
                    'totais' => $totais
                ], JSON_UNESCAPED_UNICODE);

            } else if ($tipo === 'detalhado') {
                // Relatório Detalhado de Sétima e Despesas
                $stmt = $conn->prepare("
                    SELECT 
                        r.*,
                        g.Nome as NomeGrupo
                    FROM reuniao r
                    INNER JOIN grupo g ON r.IdGrupo = g.Id
                    WHERE r.IdGrupo = ? AND MONTH(r.Data) = ? AND YEAR(r.Data) = ?
                    ORDER BY r.Data ASC
                ");
                $stmt->execute([$idGrupo, $mes, $ano]);
                $reunioes = $stmt->fetchAll();

                // Buscar despesas de cada reunião
                $reunioesComDespesas = [];
                $totalSetimaMes = 0;
                $totalSetimaPixMes = 0;
                $totalDespesasMes = 0;

                foreach ($reunioes as $reuniao) {
                    $stmtDespesas = $conn->prepare("
                        SELECT Id, Descricao, ValorDespesa
                        FROM despesas
                        WHERE IdReuniao = ?
                        ORDER BY Id ASC
                    ");
                    $stmtDespesas->execute([$reuniao['Id']]);
                    $despesas = $stmtDespesas->fetchAll();

                    $totalDespesasReuniao = array_sum(array_column($despesas, 'ValorDespesa'));
                    $totalSetimaReuniao = floatval($reuniao['ValorSetima']) + floatval($reuniao['ValorSetimaPix']);

                    $reunioesComDespesas[] = [
                        'reuniao' => $reuniao,
                        'despesas' => $despesas,
                        'totalSetima' => $totalSetimaReuniao,
                        'totalDespesas' => $totalDespesasReuniao,
                        'saldo' => $totalSetimaReuniao - $totalDespesasReuniao
                    ];

                    $totalSetimaMes += floatval($reuniao['ValorSetima']);
                    $totalSetimaPixMes += floatval($reuniao['ValorSetimaPix']);
                    $totalDespesasMes += $totalDespesasReuniao;
                }

                echo json_encode([
                    'tipo' => 'detalhado',
                    'grupo' => $reunioes[0]['NomeGrupo'] ?? '',
                    'mes' => $mes,
                    'ano' => $ano,
                    'reunioes' => $reunioesComDespesas,
                    'totais' => [
                        'TotalSetimaMes' => $totalSetimaMes,
                        'TotalSetimaPixMes' => $totalSetimaPixMes,
                        'TotalSetimaGeral' => $totalSetimaMes + $totalSetimaPixMes,
                        'TotalDespesasMes' => $totalDespesasMes,
                        'SaldoMes' => ($totalSetimaMes + $totalSetimaPixMes) - $totalDespesasMes
                    ]
                ], JSON_UNESCAPED_UNICODE);

            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Tipo de relatório inválido. Use "geral" ou "detalhado"'], JSON_UNESCAPED_UNICODE);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            error_log("Relatorio GET PDO Error: " . $e->getMessage());
            echo json_encode(['message' => 'Erro ao gerar relatório', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
        break;
}
?>
