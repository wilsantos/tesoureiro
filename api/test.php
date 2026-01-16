<?php
// Arquivo de teste para verificar se a API está funcionando
require_once 'config/database.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== Teste de Conexão com Banco de Dados ===\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "✓ Conexão com banco de dados estabelecida com sucesso!\n\n";
    
    // Testar query na tabela grupo
    $stmt = $conn->query("SELECT COUNT(*) as total FROM grupo");
    $result = $stmt->fetch();
    echo "✓ Tabela 'grupo' encontrada. Total de registros: " . $result['total'] . "\n";
    
    // Testar query na tabela reuniao
    $stmt = $conn->query("SELECT COUNT(*) as total FROM reuniao");
    $result = $stmt->fetch();
    echo "✓ Tabela 'reuniao' encontrada. Total de registros: " . $result['total'] . "\n\n";
    
    echo "=== Sistema funcionando corretamente! ===\n";
    
} catch (Exception $e) {
    echo "✗ ERRO: " . $e->getMessage() . "\n";
    echo "Detalhes: Verifique as configurações em config/database.php\n";
}
