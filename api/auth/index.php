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
                atualizarUltimoAcesso($conn, (int) $usuario['Id']);
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

            atualizarUltimoAcesso($conn, (int) $usuario['Id']);

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

            atualizarUltimoAcesso($conn, (int) $usuario['Id']);

            responderAuth(200, emitirRespostaAutenticada($usuario));
        }

        if ($action === 'onboarding') {
            $authUser = requireAuth();
            $usuarioId = (int) $authUser['Id'];
            $data = lerJsonBody();

            $vinculos = isset($data['Vinculos']) && is_array($data['Vinculos']) ? $data['Vinculos'] : [];
            $novosGrupos = isset($data['NovosGrupos']) && is_array($data['NovosGrupos']) ? $data['NovosGrupos'] : [];

            if (count($vinculos) === 0 && count($novosGrupos) === 0) {
                responderAuth(400, ['message' => 'Informe ao menos um grupo e papel']);
            }

            $vinculosProcessar = [];
            $chaveVinculo = [];

            foreach ($vinculos as $item) {
                if (!is_array($item) || !isset($item['GrupoId']) || !isset($item['Papel'])) {
                    responderAuth(400, ['message' => 'Vínculo inválido: GrupoId e Papel obrigatórios']);
                }

                $grupoId = (int) $item['GrupoId'];
                $papel = validarPapel((string) $item['Papel']);

                if ($grupoId <= 0 || $papel === null) {
                    responderAuth(400, ['message' => 'GrupoId ou Papel inválido']);
                }

                $chave = $grupoId . ':' . $papel;
                if (isset($chaveVinculo[$chave])) {
                    responderAuth(400, ['message' => 'Vínculo duplicado no request']);
                }

                $chaveVinculo[$chave] = true;
                $vinculosProcessar[] = ['GrupoId' => $grupoId, 'Papel' => $papel];
            }

            foreach ($novosGrupos as $item) {
                if (!is_array($item)) {
                    responderAuth(400, ['message' => 'Novo grupo inválido']);
                }

                $nome = isset($item['Nome']) ? trim((string) $item['Nome']) : '';
                $endereco = isset($item['Endereco']) ? trim((string) $item['Endereco']) : '';
                $csa = isset($item['CSA']) ? (int) $item['CSA'] : 0;

                if ($nome === '' || $endereco === '' || $csa <= 0) {
                    responderAuth(400, ['message' => 'Novos grupos exigem Nome, Endereco e CSA']);
                }

                $papeis = [];
                if (isset($item['Papeis']) && is_array($item['Papeis'])) {
                    foreach ($item['Papeis'] as $p) {
                        $normalizado = validarPapel((string) $p);
                        if ($normalizado !== null) {
                            $papeis[] = $normalizado;
                        }
                    }
                }
                if (isset($item['Papel'])) {
                    $normalizado = validarPapel((string) $item['Papel']);
                    if ($normalizado !== null) {
                        $papeis[] = $normalizado;
                    }
                }

                $papeis = array_values(array_unique($papeis));

                if (count($papeis) === 0) {
                    responderAuth(400, ['message' => 'Informe ao menos um papel para cada novo grupo']);
                }

                $vinculosProcessar[] = [
                    'NovoGrupo' => true,
                    'Nome' => $nome,
                    'Endereco' => $endereco,
                    'CSA' => $csa,
                    'Papeis' => $papeis,
                ];
            }

            try {
                $conn->beginTransaction();

                foreach ($vinculosProcessar as $vinculo) {
                    if (isset($vinculo['NovoGrupo'])) {
                        $stmtGrupo = $conn->prepare(
                            'INSERT INTO grupo ("Nome", "Endereco", "CSA", "Saldo", "DataSaldo")
                             VALUES (?, ?, ?, 0, NULL)
                             RETURNING "Id"'
                        );
                        try {
                            $stmtGrupo->execute([
                                $vinculo['Nome'],
                                $vinculo['Endereco'],
                                $vinculo['CSA'],
                            ]);
                        } catch (PDOException $e) {
                            if ((int) ($e->errorInfo[0] ?? 0) === 23505) {
                                $conn->rollBack();
                                responderAuth(409, [
                                    'message' => 'Já existe um grupo com este nome nesta CSA',
                                    'error' => 'grupo_duplicado',
                                ]);
                            }

                            throw $e;
                        }

                        $grupoId = (int) $stmtGrupo->fetchColumn();

                        foreach ($vinculo['Papeis'] as $papel) {
                            resolverEncargoGrupo($conn, $usuarioId, $grupoId, $papel);
                        }
                    } else {
                        $stmtExiste = $conn->prepare('SELECT "Id" FROM grupo WHERE "Id" = ? LIMIT 1');
                        $stmtExiste->execute([$vinculo['GrupoId']]);
                        if (!$stmtExiste->fetch()) {
                            $conn->rollBack();
                            responderAuth(400, ['message' => 'Grupo não encontrado', 'GrupoId' => $vinculo['GrupoId']]);
                        }

                        resolverEncargoGrupo(
                            $conn,
                            $usuarioId,
                            $vinculo['GrupoId'],
                            $vinculo['Papel']
                        );
                    }
                }

                $conn->commit();
            } catch (EncargoPreenchidoException $e) {
                if ($conn->inTransaction()) {
                    $conn->rollBack();
                }

                responderAuth(409, [
                    'message' => $e->getMessage(),
                    'error' => 'encargo_preenchido',
                    'GrupoId' => $e->grupoId,
                    'Papel' => $e->papel,
                    'UsuarioAtivo' => $e->usuarioAtivo,
                ]);
            } catch (PDOException $e) {
                if ($conn->inTransaction()) {
                    $conn->rollBack();
                }

                error_log('Auth onboarding PDO Error: ' . $e->getMessage());
                responderAuth(500, [
                    'message' => 'Erro ao completar onboarding',
                    'error' => $e->getMessage(),
                ]);
            } catch (Exception $e) {
                if ($conn->inTransaction()) {
                    $conn->rollBack();
                }

                error_log('Auth onboarding Error: ' . $e->getMessage());
                responderAuth(500, [
                    'message' => 'Erro ao completar onboarding',
                    'error' => $e->getMessage(),
                ]);
            }

            $stmtUsuario = $conn->prepare(
                'SELECT "Id", "Nome", "Email" FROM usuario WHERE "Id" = ? LIMIT 1'
            );
            $stmtUsuario->execute([$usuarioId]);
            $usuarioRow = $stmtUsuario->fetch();

            responderAuth(201, [
                'message' => 'Onboarding completado',
                'OnboardingCompleto' => true,
                'Grupos' => listarGruposUsuario($conn, $usuarioId),
                'usuario' => montarUsuarioMe($conn, $usuarioRow),
            ]);
        }

        if ($action === 'encerrar-encargo') {
            $authUser = requireAuth();
            $usuarioId = (int) $authUser['Id'];
            $data = lerJsonBody();
            $grupoId = isset($data['GrupoId']) ? (int) $data['GrupoId'] : 0;

            if ($grupoId <= 0) {
                responderAuth(400, ['message' => 'GrupoId inválido']);
            }

            $stmtGrupo = $conn->prepare('SELECT "Id" FROM grupo WHERE "Id" = ? LIMIT 1');
            $stmtGrupo->execute([$grupoId]);
            if (!$stmtGrupo->fetch()) {
                responderAuth(400, ['message' => 'Grupo não encontrado']);
            }

            $encerrados = encerrarEncargosGrupo($conn, $usuarioId, $grupoId);

            $stmtUsuario = $conn->prepare(
                'SELECT "Id", "Nome", "Email" FROM usuario WHERE "Id" = ? LIMIT 1'
            );
            $stmtUsuario->execute([$usuarioId]);
            $usuarioRow = $stmtUsuario->fetch();

            responderAuth(200, [
                'message' => $encerrados > 0 ? 'Encargos encerrados' : 'Nenhum encargo ativo para este grupo',
                'Encerrados' => $encerrados,
                'usuario' => montarUsuarioMe($conn, $usuarioRow),
            ]);
        }

        if ($action === 'logout') {
            responderAuth(200, ['message' => 'Logout realizado']);
        }

        responderAuth(404, ['message' => 'Endpoint não encontrado']);
        break;

    case 'GET':
        if ($action === 'me') {
            $authUser = requireAuth();
            $usuarioId = (int) $authUser['Id'];

            $stmt = $conn->prepare(
                'SELECT "Id", "Nome", "Email" FROM usuario WHERE "Id" = ? LIMIT 1'
            );
            $stmt->execute([$usuarioId]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                responderAuth(401, ['message' => 'Não autorizado']);
            }

            atualizarUltimoAcesso($conn, $usuarioId);

            responderAuth(200, montarUsuarioMe($conn, $usuario));
        }

        responderAuth(404, ['message' => 'Endpoint não encontrado']);
        break;

    default:
        responderAuth(405, ['message' => 'Método não permitido']);
}

?>
