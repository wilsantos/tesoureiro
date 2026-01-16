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
            // Buscar despesa específica
            $id = $_GET['id'];
            $stmt = $conn->prepare("SELECT Id, IdReuniao, Descricao, ValorDespesa, 
                                   HEX(Comprovante) as ComprovanteHex FROM despesas WHERE Id = ?");
            $stmt->execute([$id]);
            $despesa = $stmt->fetch();
            
            if ($despesa) {
                // Converter hex para base64 para facilitar uso no frontend
                if ($despesa['ComprovanteHex']) {
                    $despesa['Comprovante'] = base64_encode(hex2bin($despesa['ComprovanteHex']));
                }
                unset($despesa['ComprovanteHex']);
                echo json_encode($despesa, JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Despesa não encontrada'], JSON_UNESCAPED_UNICODE);
            }
        } else if (isset($_GET['IdReuniao'])) {
            // Listar despesas de uma reunião específica
            $idReuniao = $_GET['IdReuniao'];
            $stmt = $conn->prepare("SELECT Id, IdReuniao, Descricao, ValorDespesa FROM despesas WHERE IdReuniao = ? ORDER BY Id");
            $stmt->execute([$idReuniao]);
            $despesas = $stmt->fetchAll();
            echo json_encode($despesas, JSON_UNESCAPED_UNICODE);
        } else {
            // Listar todas as despesas (sem comprovante para não sobrecarregar)
            $stmt = $conn->query("SELECT Id, IdReuniao, Descricao, ValorDespesa FROM despesas ORDER BY Id DESC");
            $despesas = $stmt->fetchAll();
            echo json_encode($despesas, JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['message' => 'JSON inválido', 'error' => json_last_error_msg()], JSON_UNESCAPED_UNICODE);
            break;
        }
        
        if (!isset($data['IdReuniao']) || !isset($data['Descricao']) || !isset($data['ValorDespesa'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Dados incompletos', 'received' => $data], JSON_UNESCAPED_UNICODE);
            break;
        }

        try {
            // Comprovante é opcional, mas se enviado deve ser base64
            $comprovante = null;
            if (isset($data['Comprovante']) && !empty($data['Comprovante'])) {
                // Decodificar base64 para binário
                $comprovante = base64_decode($data['Comprovante']);
                if ($comprovante === false) {
                    throw new Exception('Comprovante inválido (deve ser base64)');
                }
            }
            
            $stmt = $conn->prepare("INSERT INTO despesas (IdReuniao, Descricao, ValorDespesa, Comprovante) VALUES (?, ?, ?, ?)");
            
            if ($stmt->execute([$data['IdReuniao'], $data['Descricao'], $data['ValorDespesa'], $comprovante])) {
                $id = $conn->lastInsertId();
                http_response_code(201);
                echo json_encode(['message' => 'Despesa criada com sucesso', 'id' => $id], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                $errorInfo = $stmt->errorInfo();
                error_log("Despesa POST Error: " . print_r($errorInfo, true));
                echo json_encode(['message' => 'Erro ao criar despesa', 'error' => $errorInfo[2]], JSON_UNESCAPED_UNICODE);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            error_log("Despesa POST PDO Error: " . $e->getMessage());
            echo json_encode(['message' => 'Erro ao criar despesa', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['Id']) || !isset($data['IdReuniao']) || !isset($data['Descricao']) || !isset($data['ValorDespesa'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Dados incompletos'], JSON_UNESCAPED_UNICODE);
            break;
        }

        try {
            // Se comprovante foi enviado, atualizar também
            if (isset($data['Comprovante']) && !empty($data['Comprovante'])) {
                $comprovante = base64_decode($data['Comprovante']);
                if ($comprovante === false) {
                    throw new Exception('Comprovante inválido (deve ser base64)');
                }
                $stmt = $conn->prepare("UPDATE despesas SET IdReuniao = ?, Descricao = ?, ValorDespesa = ?, Comprovante = ? WHERE Id = ?");
                $result = $stmt->execute([$data['IdReuniao'], $data['Descricao'], $data['ValorDespesa'], $comprovante, $data['Id']]);
            } else {
                $stmt = $conn->prepare("UPDATE despesas SET IdReuniao = ?, Descricao = ?, ValorDespesa = ? WHERE Id = ?");
                $result = $stmt->execute([$data['IdReuniao'], $data['Descricao'], $data['ValorDespesa'], $data['Id']]);
            }
            
            if ($result) {
                echo json_encode(['message' => 'Despesa atualizada com sucesso'], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erro ao atualizar despesa'], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'ID não fornecido'], JSON_UNESCAPED_UNICODE);
            break;
        }

        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM despesas WHERE Id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['message' => 'Despesa deletada com sucesso'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao deletar despesa'], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
        break;
}
?>
