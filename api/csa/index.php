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

require_once __DIR__ . '/../config/auth.php';
$usuario = requireAuth();

require_once '../config/database.php';

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

$csaSelectSql = '
    SELECT c."Id", c."Nome", c."CSR",
           r."Nome" AS "CSR_Nome",
           CASE
             WHEN r."Nome" IS NOT NULL THEN r."Nome" || \' - \' || c."Nome"
             ELSE c."Nome"
           END AS "Label"
    FROM csa c
    LEFT JOIN csr r ON r."Id" = c."CSR"
';

switch ($method) {
    case 'GET':
        try {
            if (isset($_GET['id'])) {
                $id = (int) $_GET['id'];
                $stmt = $conn->prepare($csaSelectSql . ' WHERE c."Id" = ?');
                $stmt->execute([$id]);
                $csa = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$csa) {
                    http_response_code(404);
                    echo json_encode(['message' => 'CSA não encontrado'], JSON_UNESCAPED_UNICODE);
                    break;
                }

                echo json_encode([
                    'items' => [$csa],
                    'total' => 1,
                    'limit' => 1,
                ], JSON_UNESCAPED_UNICODE);
            } elseif (isset($_GET['q'])) {
                $q = trim((string) $_GET['q']);
                if (strlen($q) < 3) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Informe ao menos 3 caracteres para buscar CSAs.'], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
                if ($limit <= 0) {
                    $limit = 20;
                } elseif ($limit > 50) {
                    $limit = 50;
                }

                $likeQ = '%' . $q . '%';
                $whereSql = ' WHERE LOWER(c."Nome") LIKE LOWER(?) OR LOWER(r."Nome") LIKE LOWER(?)';

                $countStmt = $conn->prepare(
                    'SELECT COUNT(*) FROM csa c LEFT JOIN csr r ON r."Id" = c."CSR"' . $whereSql
                );
                $countStmt->execute([$likeQ, $likeQ]);
                $total = (int) $countStmt->fetchColumn();

                $stmt = $conn->prepare(
                    $csaSelectSql . $whereSql . ' ORDER BY r."Nome" NULLS LAST, c."Nome" LIMIT ?'
                );
                $stmt->execute([$likeQ, $likeQ, $limit]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode([
                    'items' => $items,
                    'total' => $total,
                    'limit' => $limit,
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(400);
                echo json_encode([
                    'message' => 'Informe o parâmetro q (busca, mínimo 3 caracteres) ou id (detalhe).',
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            error_log('CSA GET PDO Error: ' . $e->getMessage());
            echo json_encode(['message' => 'Erro ao buscar CSAs', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
        break;
}
?>
