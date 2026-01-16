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
            // Buscar reunião específica
            $id = $_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM reuniao WHERE Id = ?");
            $stmt->execute([$id]);
            $reuniao = $stmt->fetch();
            
            if ($reuniao) {
                echo json_encode($reuniao, JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Reunião não encontrada'], JSON_UNESCAPED_UNICODE);
            }
        } else {
            // Construir query com filtros
            $where = [];
            $params = [];
            
            // Filtro por grupo
            if (isset($_GET['IdGrupo']) && $_GET['IdGrupo'] !== '' && $_GET['IdGrupo'] !== null) {
                $where[] = "r.IdGrupo = ?";
                $params[] = $_GET['IdGrupo'];
            }
            
            // Filtro por mês
            if (isset($_GET['mes']) && $_GET['mes'] !== '' && $_GET['mes'] !== null) {
                $where[] = "MONTH(r.Data) = ?";
                $params[] = $_GET['mes'];
            }
            
            // Filtro por ano
            if (isset($_GET['ano']) && $_GET['ano'] !== '' && $_GET['ano'] !== null) {
                $where[] = "YEAR(r.Data) = ?";
                $params[] = $_GET['ano'];
            }
            
            // Montar query
            $sql = "SELECT r.*, g.Nome as NomeGrupo FROM reuniao r LEFT JOIN grupo g ON r.IdGrupo = g.Id";
            if (!empty($where)) {
                $sql .= " WHERE " . implode(" AND ", $where);
            }
            $sql .= " ORDER BY r.Data DESC";
            
            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
            } else {
                $stmt = $conn->query($sql);
            }
            
            $reunioes = $stmt->fetchAll();
            echo json_encode($reunioes, JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['message' => 'JSON inválido', 'error' => json_last_error_msg()], JSON_UNESCAPED_UNICODE);
            break;
        }
        
        $required = ['IdGrupo', 'Data', 'Membros', 'Visitantes', 'ValorSetima', 'ValorSetimaPix', 
                     'Ingresso', 'TrintaDias', 'SessentaDias', 'NoventaDias', 
                     'SeisMeses', 'NoveMeses', 'UmAno', 'DezoitoMeses', 'MultiplosAnos', 'FatosRelevantes'];
        
        $missing = [];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            http_response_code(400);
            echo json_encode(['message' => 'Campos obrigatórios ausentes', 'missing' => $missing, 'received' => array_keys($data)], JSON_UNESCAPED_UNICODE);
            break;
        }

        try {
            $stmt = $conn->prepare("INSERT INTO reuniao (IdGrupo, Data, Membros, Visitantes, ValorSetima, ValorSetimaPix, 
                                  Ingresso, TrintaDias, SessentaDias, NoventaDias, SeisMeses, 
                                  NoveMeses, UmAno, DezoitoMeses, MultiplosAnos, FatosRelevantes) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            if ($stmt->execute([
                $data['IdGrupo'], $data['Data'], $data['Membros'], $data['Visitantes'],
                $data['ValorSetima'], $data['ValorSetimaPix'], $data['Ingresso'],
                $data['TrintaDias'], $data['SessentaDias'], $data['NoventaDias'], $data['SeisMeses'],
                $data['NoveMeses'], $data['UmAno'], $data['DezoitoMeses'], $data['MultiplosAnos'], $data['FatosRelevantes']
            ])) {
                $id = $conn->lastInsertId();
                http_response_code(201);
                echo json_encode(['message' => 'Reunião criada com sucesso', 'id' => $id], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                $errorInfo = $stmt->errorInfo();
                error_log("Reuniao POST Error: " . print_r($errorInfo, true));
                echo json_encode(['message' => 'Erro ao criar reunião', 'error' => $errorInfo[2]], JSON_UNESCAPED_UNICODE);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            error_log("Reuniao POST PDO Error: " . $e->getMessage());
            echo json_encode(['message' => 'Erro ao criar reunião', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['Id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'ID não fornecido'], JSON_UNESCAPED_UNICODE);
            break;
        }

        $required = ['IdGrupo', 'Data', 'Membros', 'Visitantes', 'ValorSetima', 'ValorSetimaPix', 
                     'Ingresso', 'TrintaDias', 'SessentaDias', 'NoventaDias', 
                     'SeisMeses', 'NoveMeses', 'UmAno', 'DezoitoMeses', 'MultiplosAnos', 'FatosRelevantes'];
        
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                echo json_encode(['message' => "Campo obrigatório ausente: $field"], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        $stmt = $conn->prepare("UPDATE reuniao SET IdGrupo = ?, Data = ?, Membros = ?, Visitantes = ?, 
                              ValorSetima = ?, ValorSetimaPix = ?, Ingresso = ?, 
                              TrintaDias = ?, SessentaDias = ?, NoventaDias = ?, SeisMeses = ?, 
                              NoveMeses = ?, UmAno = ?, DezoitoMeses = ?, MultiplosAnos = ?, FatosRelevantes = ? 
                              WHERE Id = ?");
        
        if ($stmt->execute([
            $data['IdGrupo'], $data['Data'], $data['Membros'], $data['Visitantes'],
            $data['ValorSetima'], $data['ValorSetimaPix'], $data['Ingresso'],
            $data['TrintaDias'], $data['SessentaDias'], $data['NoventaDias'], $data['SeisMeses'],
            $data['NoveMeses'], $data['UmAno'], $data['DezoitoMeses'], $data['MultiplosAnos'], $data['FatosRelevantes'], $data['Id']
        ])) {
            echo json_encode(['message' => 'Reunião atualizada com sucesso'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao atualizar reunião'], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'ID não fornecido'], JSON_UNESCAPED_UNICODE);
            break;
        }

        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM reuniao WHERE Id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['message' => 'Reunião deletada com sucesso'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao deletar reunião'], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
        break;
}
?>
