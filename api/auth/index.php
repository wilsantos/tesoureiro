<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$method = $_SERVER['REQUEST_METHOD'];
$action = '';

$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (is_string($requestPath)) {
    $prefix = '/auth';
    if (strpos($requestPath, $prefix) === 0) {
        $action = trim(substr($requestPath, strlen($prefix)), '/');
    }
}

try {
    $db = new Database();
    $conn = $db->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao conectar ao banco de dados', 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

function usuarioPublico($row)
{
    return [
        'Id' => (int) $row['Id'],
        'Nome' => $row['Nome'],
        'Email' => $row['Email'],
    ];
}

function responderAuth($statusCode, $payload)
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function lerJsonBody()
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        responderAuth(400, [
            'message' => 'JSON inválido',
            'error' => json_last_error_msg(),
        ]);
    }

    return is_array($data) ? $data : [];
}

function validarEmail($email)
{
    $email = trim((string) $email);

    if ($email === '' || strlen($email) > 320 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return null;
    }

    return $email;
}

function validarNome($nome)
{
    $nome = trim((string) $nome);

    if ($nome === '' || strlen($nome) > 200) {
        return null;
    }

    return $nome;
}

function validarSenha($senha)
{
    $senha = (string) $senha;

    if (strlen($senha) < 8) {
        return false;
    }

    return true;
}

function buscarUsuarioPorEmail($conn, $email)
{
    $stmt = $conn->prepare('SELECT * FROM usuario WHERE LOWER("Email") = LOWER(?) LIMIT 1');
    $stmt->execute([$email]);

    return $stmt->fetch();
}

function buscarUsuarioPorGoogleSub($conn, $googleSub)
{
    $stmt = $conn->prepare('SELECT * FROM usuario WHERE "GoogleSub" = ? LIMIT 1');
    $stmt->execute([$googleSub]);

    return $stmt->fetch();
}

function emitirRespostaAutenticada($usuario)
{
    try {
        $token = emitJwt($usuario);
    } catch (Exception $e) {
        responderAuth(500, [
            'message' => 'Erro ao gerar token',
            'error' => $e->getMessage(),
        ]);
    }

    return [
        'token' => $token,
        'usuario' => usuarioPublico($usuario),
    ];
}

switch ($method) {
    case 'POST':
        if ($action === 'cadastro') {
            if (!isCadastroAberto()) {
                responderAuth(403, ['message' => 'Cadastro desabilitado']);
            }

            $data = lerJsonBody();

            $nome = isset($data['Nome']) ? validarNome($data['Nome']) : null;
            $email = isset($data['Email']) ? validarEmail($data['Email']) : null;
            $senha = isset($data['Senha']) ? (string) $data['Senha'] : '';

            if ($nome === null || $email === null || !validarSenha($senha)) {
                responderAuth(400, [
                    'message' => 'Dados inválidos',
                    'error' => 'Informe Nome, Email válido e Senha com no mínimo 8 caracteres',
                ]);
            }

            if (buscarUsuarioPorEmail($conn, $email)) {
                responderAuth(409, ['message' => 'E-mail já cadastrado']);
            }

            try {
                $senhaHash = hashSenha($senha);
                $stmt = $conn->prepare(
                    'INSERT INTO usuario ("Nome", "Email", "SenhaHash", "AtualizadoEm")
                     VALUES (?, ?, ?, NOW())
                     RETURNING "Id", "Nome", "Email"'
                );
                $stmt->execute([$nome, $email, $senhaHash]);
                $usuario = $stmt->fetch();

                $resposta = emitirRespostaAutenticada($usuario);
                $resposta['message'] = 'Usuário criado';
                responderAuth(201, $resposta);
            } catch (PDOException $e) {
                if ((int) ($e->errorInfo[0] ?? 0) === 23505) {
                    responderAuth(409, ['message' => 'E-mail já cadastrado']);
                }

                error_log('Auth cadastro PDO Error: ' . $e->getMessage());
                responderAuth(500, [
                    'message' => 'Erro ao criar usuário',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($action === 'login') {
            $data = lerJsonBody();

            $email = isset($data['Email']) ? validarEmail($data['Email']) : null;
            $senha = isset($data['Senha']) ? (string) $data['Senha'] : '';

            if ($email === null || $senha === '') {
                responderAuth(400, ['message' => 'Dados incompletos']);
            }

            $usuario = buscarUsuarioPorEmail($conn, $email);

            if (!$usuario || empty($usuario['SenhaHash'])) {
                if ($usuario && empty($usuario['SenhaHash'])) {
                    responderAuth(401, [
                        'message' => 'Esta conta usa login com Google. Entre com o Google.',
                    ]);
                }

                responderAuth(401, ['message' => 'Credenciais inválidas']);
            }

            if (!password_verify($senha, $usuario['SenhaHash'])) {
                responderAuth(401, ['message' => 'Credenciais inválidas']);
            }

            $stmt = $conn->prepare('UPDATE usuario SET "AtualizadoEm" = NOW() WHERE "Id" = ?');
            $stmt->execute([$usuario['Id']]);

            responderAuth(200, emitirRespostaAutenticada($usuario));
        }

        if ($action === 'google') {
            $data = lerJsonBody();

            if (empty($data['idToken'])) {
                responderAuth(400, ['message' => 'Dados incompletos']);
            }

            try {
                $googleUser = validateGoogleIdToken($data['idToken']);
            } catch (Exception $e) {
                responderAuth(401, ['message' => 'Token Google inválido']);
            }

            $usuario = buscarUsuarioPorGoogleSub($conn, $googleUser['sub']);

            if (!$usuario) {
                $usuario = buscarUsuarioPorEmail($conn, $googleUser['email']);
            }

            if ($usuario) {
                $nome = trim((string) $usuario['Nome']);
                if ($nome === '' && $googleUser['name'] !== '') {
                    $nome = $googleUser['name'];
                } else {
                    $nome = $usuario['Nome'];
                }

                $stmt = $conn->prepare(
                    'UPDATE usuario
                     SET "GoogleSub" = ?, "Nome" = ?, "AtualizadoEm" = NOW()
                     WHERE "Id" = ?'
                );

                try {
                    $stmt->execute([$googleUser['sub'], $nome, $usuario['Id']]);
                } catch (PDOException $e) {
                    if ((int) ($e->errorInfo[0] ?? 0) === 23505) {
                        responderAuth(409, ['message' => 'Conta Google já vinculada a outro usuário']);
                    }

                    throw $e;
                }

                $usuario['Nome'] = $nome;
                $usuario['Email'] = $googleUser['email'];
            } else {
                $nome = $googleUser['name'] !== '' ? $googleUser['name'] : $googleUser['email'];

                try {
                    $stmt = $conn->prepare(
                        'INSERT INTO usuario ("Nome", "Email", "GoogleSub", "AtualizadoEm")
                         VALUES (?, ?, ?, NOW())
                         RETURNING "Id", "Nome", "Email"'
                    );
                    $stmt->execute([$nome, $googleUser['email'], $googleUser['sub']]);
                    $usuario = $stmt->fetch();
                } catch (PDOException $e) {
                    if ((int) ($e->errorInfo[0] ?? 0) === 23505) {
                        $usuario = buscarUsuarioPorEmail($conn, $googleUser['email']);
                        if ($usuario) {
                            $stmt = $conn->prepare(
                                'UPDATE usuario
                                 SET "GoogleSub" = ?, "AtualizadoEm" = NOW()
                                 WHERE "Id" = ?'
                            );
                            $stmt->execute([$googleUser['sub'], $usuario['Id']]);
                        } else {
                            responderAuth(409, ['message' => 'Não foi possível vincular conta Google']);
                        }
                    } else {
                        error_log('Auth google PDO Error: ' . $e->getMessage());
                        responderAuth(500, [
                            'message' => 'Erro ao autenticar com Google',
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            responderAuth(200, emitirRespostaAutenticada($usuario));
        }

        if ($action === 'logout') {
            responderAuth(200, ['message' => 'Logout realizado']);
        }

        responderAuth(404, ['message' => 'Endpoint não encontrado']);
        break;

    case 'GET':
        if ($action === 'me') {
            $authUser = requireAuth();

            $stmt = $conn->prepare('SELECT "Id", "Nome", "Email" FROM usuario WHERE "Id" = ? LIMIT 1');
            $stmt->execute([$authUser['Id']]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                responderAuth(401, ['message' => 'Não autorizado']);
            }

            responderAuth(200, usuarioPublico($usuario));
        }

        responderAuth(404, ['message' => 'Endpoint não encontrado']);
        break;

    default:
        responderAuth(405, ['message' => 'Método não permitido']);
}

?>
