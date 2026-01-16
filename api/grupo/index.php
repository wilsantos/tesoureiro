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
        if (isset($_GET['id'])) {
            // Buscar grupo específico
            $id = $_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM grupo WHERE Id = ?");
            $stmt->execute([$id]);
            $grupo = $stmt->fetch();
            
            if ($grupo) {
                echo json_encode($grupo, JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Grupo não encontrado'], JSON_UNESCAPED_UNICODE);
            }
        } else {
            // Listar todos os grupos
            $stmt = $conn->query("SELECT * FROM grupo ORDER BY Nome");
            $grupos = $stmt->fetchAll();
            echo json_encode($grupos, JSON_UNESCAPED_UNICODE);
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
            $stmt = $conn->prepare("INSERT INTO grupo (Nome, Endereco, CSA) VALUES (?, ?, ?)");
            if ($stmt->execute([$data['Nome'], $data['Endereco'], $data['CSA']])) {
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

        $stmt = $conn->prepare("UPDATE grupo SET Nome = ?, Endereco = ?, CSA = ? WHERE Id = ?");
        if ($stmt->execute([$data['Nome'], $data['Endereco'], $data['CSA'], $data['Id']])) {
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

        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM grupo WHERE Id = ?");
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
