<?php
// Headers CORS devem ser enviados antes de qualquer output
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/auth.php';
$usuario = requireAuth();

require_once '../config/database.php';

// Habilitar exibição de erros para debug (remover em produção se necessário)
error_reporting(E_ALL);
ini_set('display_errors', 1);
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

if ($method === 'PUT' || $method === 'DELETE') {
    requireOnboardingComplete($conn, $usuario['Id']);
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
            requireAcessoGrupo($conn, $usuario['Id'], $id);

            $stmt = $conn->prepare("SELECT 
                grupo.*, csa.\"Nome\" AS \"CSA_Nome\" FROM grupo INNER JOIN csa ON grupo.\"CSA\" = csa.\"Id\" 
                WHERE grupo.\"Id\" = ?");
            $stmt->execute([$id]);
            $grupo = $stmt->fetch();
            
            if ($grupo) {
                echo json_encode($grupo, JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Grupo não encontrado'], JSON_UNESCAPED_UNICODE);
            }
        } else {
            $csa = isset($_GET['CSA']) ? (int) $_GET['CSA'] : 0;
            $busca = isset($_GET['busca']) ? trim((string) $_GET['busca']) : '';
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 0;
            $offset = isset($_GET['offset']) ? max(0, (int) $_GET['offset']) : 0;
            $disponiveis = isset($_GET['disponiveis']) && $_GET['disponiveis'] !== '0' && $_GET['disponiveis'] !== 'false';

            $sqlBase = 'FROM grupo INNER JOIN csa ON grupo."CSA" = csa."Id"';
            $conditions = [];
            $params = [];

            if (!$disponiveis) {
                $conditions[] = 'EXISTS (
                    SELECT 1 FROM usuario_grupo ug
                    WHERE ug."Grupo" = grupo."Id"
                      AND ug."Usuario" = ?
                      AND ug."Ativo" = true
                )';
                $params[] = $usuario['Id'];
            }

            if ($csa > 0) {
                $conditions[] = 'grupo."CSA" = ?';
                $params[] = $csa;
            }

            if ($busca !== '') {
                $conditions[] = 'LOWER(grupo."Nome") LIKE LOWER(?)';
                $params[] = '%' . $busca . '%';
            }

            $where = count($conditions) > 0 ? ' WHERE ' . implode(' AND ', $conditions) : '';

            if ($limit > 0) {
                $countSql = 'SELECT COUNT(*) ' . $sqlBase . $where;
                $countStmt = $conn->prepare($countSql);
                $countStmt->execute($params);
                $total = (int) $countStmt->fetchColumn();

                $listSql = 'SELECT grupo.*, csa."Nome" AS "CSA_Nome" ' . $sqlBase . $where
                    . ' ORDER BY grupo."Nome" LIMIT ? OFFSET ?';
                $listParams = array_merge($params, [$limit, $offset]);
                $stmt = $conn->prepare($listSql);
                $stmt->execute($listParams);
                $grupos = $stmt->fetchAll();

                echo json_encode([
                    'items' => $grupos,
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                ], JSON_UNESCAPED_UNICODE);
            } else {
                $listSql = 'SELECT grupo.*, csa."Nome" AS "CSA_Nome" ' . $sqlBase . $where
                    . ' ORDER BY grupo."Nome"';
                $stmt = $conn->prepare($listSql);
                $stmt->execute($params);
                $grupos = $stmt->fetchAll();
                echo json_encode($grupos, JSON_UNESCAPED_UNICODE);
            }
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['message' => 'JSON inválido', 'error' => json_last_error_msg()], JSON_UNESCAPED_UNICODE);
            break;
        }
        
        if (!isset($data['Nome']) || !isset($data['Endereco']) || !isset($data['CSA'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Dados incompletos', 'received' => $data], JSON_UNESCAPED_UNICODE);
            break;
        }

        try {
            // Saldo e DataSaldo são opcionais, usar valores padrão se não fornecidos
            $saldo = isset($data['Saldo']) ? $data['Saldo'] : 0;
            $dataSaldo = isset($data['DataSaldo']) && $data['DataSaldo'] !== '' ? $data['DataSaldo'] : null;
            
            $stmt = $conn->prepare("INSERT INTO grupo (\"Nome\", \"Endereco\", \"CSA\", \"Saldo\", \"DataSaldo\") VALUES (?, ?, ?, ?, ?)");
            if ($stmt->execute([$data['Nome'], $data['Endereco'], $data['CSA'], $saldo, $dataSaldo])) {
                $id = $conn->lastInsertId();
                http_response_code(201);
                echo json_encode(['message' => 'Grupo criado com sucesso', 'id' => $id], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                $errorInfo = $stmt->errorInfo();
                error_log("Grupo POST Error: " . print_r($errorInfo, true));
                echo json_encode(['message' => 'Erro ao criar grupo', 'error' => $errorInfo[2]], JSON_UNESCAPED_UNICODE);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            error_log("Grupo POST PDO Error: " . $e->getMessage());
            echo json_encode(['message' => 'Erro ao criar grupo', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['Id']) || !isset($data['Nome']) || !isset($data['Endereco']) || !isset($data['CSA'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Dados incompletos'], JSON_UNESCAPED_UNICODE);
            break;
        }

        requireAcessoGrupo($conn, $usuario['Id'], (int) $data['Id']);

        // Saldo e DataSaldo são opcionais, usar valores padrão se não fornecidos
        $saldo = isset($data['Saldo']) ? $data['Saldo'] : 0;
        $dataSaldo = isset($data['DataSaldo']) && $data['DataSaldo'] !== '' ? $data['DataSaldo'] : null;

        $stmt = $conn->prepare("UPDATE grupo SET \"Nome\" = ?, \"Endereco\" = ?, \"CSA\" = ?, \"Saldo\" = ?, \"DataSaldo\" = ? WHERE \"Id\" = ?");
        if ($stmt->execute([$data['Nome'], $data['Endereco'], $data['CSA'], $saldo, $dataSaldo, $data['Id']])) {
            echo json_encode(['message' => 'Grupo atualizado com sucesso'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao atualizar grupo'], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'ID não fornecido'], JSON_UNESCAPED_UNICODE);
            break;
        }

        $id = (int) $_GET['id'];
        requireAcessoGrupo($conn, $usuario['Id'], $id);

        $stmt = $conn->prepare("DELETE FROM grupo WHERE \"Id\" = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['message' => 'Grupo deletado com sucesso'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao deletar grupo'], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
        break;
}
?>
