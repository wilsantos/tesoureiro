<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

function getEnvVar($name, $default = null)
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

function getJwtSecret()
{
    $secret = getEnvVar('JWT_SECRET');
    if ($secret === null || $secret === '') {
        throw new Exception('JWT_SECRET não configurado');
    }

    return $secret;
}

function getJwtTtlSeconds()
{
    $ttl = getEnvVar('JWT_TTL_SECONDS', '28800');
    $ttl = (int) $ttl;

    return $ttl > 0 ? $ttl : 28800;
}

function getGoogleClientId()
{
    return getEnvVar('GOOGLE_CLIENT_ID', '');
}

function isCadastroAberto()
{
    $value = getEnvVar('CADASTRO_ABERTO', 'true');
    if ($value === null) {
        return true;
    }

    $normalized = strtolower(trim((string) $value));

    return !in_array($normalized, ['0', 'false', 'no', 'off'], true);
}

function hashSenha($senha)
{
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($senha, PASSWORD_ARGON2ID);
    }

    return password_hash($senha, PASSWORD_BCRYPT);
}

function getBearerToken()
{
    $header = null;

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (is_array($headers)) {
            $header = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }
    }

    if ($header && preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        return $matches[1];
    }

    return null;
}

function emitJwt($usuario)
{
    $now = time();
    $payload = [
        'sub' => (int) $usuario['Id'],
        'email' => $usuario['Email'],
        'nome' => $usuario['Nome'],
        'iat' => $now,
        'exp' => $now + getJwtTtlSeconds(),
    ];

    return JWT::encode($payload, getJwtSecret(), 'HS256');
}

function requireAuth()
{
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['message' => 'Não autorizado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        $decoded = JWT::decode($token, new Key(getJwtSecret(), 'HS256'));

        return [
            'Id' => (int) $decoded->sub,
            'Email' => $decoded->email,
            'Nome' => $decoded->nome,
        ];
    } catch (ExpiredException $e) {
        http_response_code(401);
        echo json_encode(['message' => 'Não autorizado'], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (SignatureInvalidException $e) {
        http_response_code(401);
        echo json_encode(['message' => 'Não autorizado'], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['message' => 'Não autorizado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function validateGoogleIdToken($idToken)
{
    $clientId = getGoogleClientId();
    if ($clientId === '') {
        throw new Exception('GOOGLE_CLIENT_ID não configurado');
    }

    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        throw new Exception('Falha ao validar token Google: ' . $curlError);
    }

    if ($httpCode !== 200) {
        throw new Exception('Token Google inválido');
    }

    $payload = json_decode($response, true);
    if (!is_array($payload)) {
        throw new Exception('Resposta inválida do Google');
    }

    if (!isset($payload['aud']) || $payload['aud'] !== $clientId) {
        throw new Exception('Audience do token Google inválida');
    }

    $emailVerified = $payload['email_verified'] ?? false;
    if ($emailVerified !== true && $emailVerified !== 'true') {
        throw new Exception('E-mail Google não verificado');
    }

    if (!isset($payload['exp']) || (int) $payload['exp'] < time()) {
        throw new Exception('Token Google expirado');
    }

    if (empty($payload['sub']) || empty($payload['email'])) {
        throw new Exception('Token Google incompleto');
    }

    return [
        'sub' => $payload['sub'],
        'email' => $payload['email'],
        'name' => isset($payload['name']) ? trim($payload['name']) : '',
    ];
}

class EncargoPreenchidoException extends Exception
{
    public int $grupoId;
    public string $papel;
    public array $usuarioAtivo;

    public function __construct(int $grupoId, string $papel, array $usuarioAtivo)
    {
        $this->grupoId = $grupoId;
        $this->papel = $papel;
        $this->usuarioAtivo = $usuarioAtivo;
        $nome = $usuarioAtivo['Nome'];
        parent::__construct(
            "O encargo solicitado encontra-se preenchido pelo usuário ativo '{$nome}'"
        );
    }
}

function validarPapel(string $papel): ?string
{
    $papel = strtolower(trim($papel));

    if ($papel === 'secretaria' || $papel === 'tesouraria') {
        return $papel;
    }

    return null;
}

function atualizarUltimoAcesso(PDO $conn, int $usuarioId): void
{
    $stmt = $conn->prepare('UPDATE usuario SET "UltimoAcesso" = NOW(), "AtualizadoEm" = NOW() WHERE "Id" = ?');
    $stmt->execute([$usuarioId]);
}

function usuarioTemOnboardingCompleto(PDO $conn, int $usuarioId): bool
{
    $stmt = $conn->prepare(
        'SELECT 1 FROM usuario_grupo WHERE "Usuario" = ? AND "Ativo" = true LIMIT 1'
    );
    $stmt->execute([$usuarioId]);

    return (bool) $stmt->fetch();
}

function requireOnboardingComplete(PDO $conn, int $usuarioId): void
{
    if (!usuarioTemOnboardingCompleto($conn, $usuarioId)) {
        http_response_code(403);
        echo json_encode([
            'message' => 'Complete o cadastro de grupos antes de continuar',
            'error' => 'onboarding_required',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function usuarioTemAcessoGrupo(PDO $conn, int $usuarioId, int $grupoId): bool
{
    $stmt = $conn->prepare(
        'SELECT 1 FROM usuario_grupo
         WHERE "Usuario" = ? AND "Grupo" = ? AND "Ativo" = true
         LIMIT 1'
    );
    $stmt->execute([$usuarioId, $grupoId]);

    return (bool) $stmt->fetch();
}

function requireAcessoGrupo(PDO $conn, int $usuarioId, int $grupoId): void
{
    if (!usuarioTemAcessoGrupo($conn, $usuarioId, $grupoId)) {
        http_response_code(403);
        echo json_encode([
            'message' => 'Você não tem acesso a este grupo',
            'error' => 'grupo_sem_acesso',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function usuarioTemEncargoGrupo(PDO $conn, int $usuarioId, int $grupoId, string $papel): bool
{
    $papel = validarPapel($papel);
    if ($papel === null) {
        return false;
    }

    $stmt = $conn->prepare(
        'SELECT 1 FROM usuario_grupo
         WHERE "Usuario" = ? AND "Grupo" = ? AND "Papel" = ? AND "Ativo" = true
         LIMIT 1'
    );
    $stmt->execute([$usuarioId, $grupoId, $papel]);

    return (bool) $stmt->fetch();
}

function requireEncargoGrupo(PDO $conn, int $usuarioId, int $grupoId, string $papel): void
{
    requireAcessoGrupo($conn, $usuarioId, $grupoId);

    if (!usuarioTemEncargoGrupo($conn, $usuarioId, $grupoId, $papel)) {
        $label = $papel === 'secretaria' ? 'secretaria' : 'tesouraria';
        http_response_code(403);
        echo json_encode([
            'message' => "Você não possui encargo de {$label} neste grupo para acessar este relatório",
            'error' => 'encargo_insuficiente',
            'Papel' => $papel,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function listarGruposUsuario(PDO $conn, int $usuarioId): array
{
    $stmt = $conn->prepare(
        'SELECT g."Id" AS "GrupoId", g."Nome", g."CSA", csa."Nome" AS "CSA_Nome",
                ug."Papel", ug."Ativo"
         FROM usuario_grupo ug
         INNER JOIN grupo g ON g."Id" = ug."Grupo"
         INNER JOIN csa ON g."CSA" = csa."Id"
         WHERE ug."Usuario" = ? AND ug."Ativo" = true
         ORDER BY g."Nome", ug."Papel"'
    );
    $stmt->execute([$usuarioId]);
    $rows = $stmt->fetchAll();
    $result = [];

    foreach ($rows as $row) {
        $result[] = [
            'GrupoId' => (int) $row['GrupoId'],
            'Nome' => $row['Nome'],
            'CSA' => (int) $row['CSA'],
            'CSA_Nome' => $row['CSA_Nome'],
            'Papel' => $row['Papel'],
            'Ativo' => (bool) $row['Ativo'],
        ];
    }

    return $result;
}

function montarUsuarioMe(PDO $conn, array $usuarioRow): array
{
    $usuarioId = (int) $usuarioRow['Id'];

    return [
        'Id' => $usuarioId,
        'Nome' => $usuarioRow['Nome'],
        'Email' => $usuarioRow['Email'],
        'OnboardingCompleto' => usuarioTemOnboardingCompleto($conn, $usuarioId),
        'Grupos' => listarGruposUsuario($conn, $usuarioId),
    ];
}

function resolverEncargoGrupo(PDO $conn, int $usuarioId, int $grupoId, string $papel): void
{
    $stmt = $conn->prepare(
        'SELECT ug."Id", ug."Usuario", u."Nome", u."UltimoAcesso"
         FROM usuario_grupo ug
         INNER JOIN usuario u ON u."Id" = ug."Usuario"
         WHERE ug."Grupo" = ? AND ug."Papel" = ? AND ug."Ativo" = true AND ug."Usuario" != ?
         LIMIT 1'
    );
    $stmt->execute([$grupoId, $papel, $usuarioId]);
    $ocupante = $stmt->fetch();

    if ($ocupante) {
        $bloqueado = false;

        if ($ocupante['UltimoAcesso'] !== null) {
            $stmtCheck = $conn->prepare(
                'SELECT (NOW() - ?::timestamptz) < interval \'20 days\' AS bloqueado'
            );
            $stmtCheck->execute([$ocupante['UltimoAcesso']]);
            $check = $stmtCheck->fetch();
            $bloqueado = (bool) ($check['bloqueado'] ?? false);
        }

        if ($bloqueado) {
            throw new EncargoPreenchidoException(
                $grupoId,
                $papel,
                [
                    'Id' => (int) $ocupante['Usuario'],
                    'Nome' => $ocupante['Nome'],
                ]
            );
        }

        $stmtInativar = $conn->prepare('UPDATE usuario_grupo SET "Ativo" = false WHERE "Id" = ?');
        $stmtInativar->execute([$ocupante['Id']]);
    }

    $stmtExistente = $conn->prepare(
        'SELECT "Id", "Ativo" FROM usuario_grupo
         WHERE "Usuario" = ? AND "Grupo" = ? AND "Papel" = ?
         LIMIT 1'
    );
    $stmtExistente->execute([$usuarioId, $grupoId, $papel]);
    $existente = $stmtExistente->fetch();

    if ($existente) {
        if (!$existente['Ativo']) {
            $stmtReativar = $conn->prepare('UPDATE usuario_grupo SET "Ativo" = true WHERE "Id" = ?');
            $stmtReativar->execute([$existente['Id']]);
        }

        return;
    }

    $stmtInsert = $conn->prepare(
        'INSERT INTO usuario_grupo ("Usuario", "Grupo", "Papel", "Ativo")
         VALUES (?, ?, ?, true)'
    );
    $stmtInsert->execute([$usuarioId, $grupoId, $papel]);
}

function encerrarEncargosGrupo(PDO $conn, int $usuarioId, int $grupoId): int
{
    $stmt = $conn->prepare(
        'UPDATE usuario_grupo SET "Ativo" = false
         WHERE "Usuario" = ? AND "Grupo" = ? AND "Ativo" = true'
    );
    $stmt->execute([$usuarioId, $grupoId]);

    return $stmt->rowCount();
}

?>
