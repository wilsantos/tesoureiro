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

?>
