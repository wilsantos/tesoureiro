-- =============================================================================
-- Rollback: autenticação — tabela usuario
-- =============================================================================
-- Objetivo:
--   Remover a tabela `usuario` e objetos dependentes (índices, sequence).
--
-- Tabelas afetadas:
--   usuario (removida)
--
-- Dependências:
--   Executar somente se nenhum outro objeto do banco referenciar `usuario`.
--   Na v1 não há FKs de domínio apontando para esta tabela.
--
-- Implementação revertida:
--   database/20260814_usuario_auth.sql
--
-- Como aplicar (não executar automaticamente):
--   psql -h host.docker.internal -p 5432 -U tesoureiro -d tesouraria \
--     -f database/20260814_usuario_auth_rollback.sql
--
--   Ou, com variáveis do .env:
--   PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
--     -d "$DB_NAME" -f database/20260814_usuario_auth_rollback.sql
--
-- ATENÇÃO: remove todos os usuários cadastrados. Operação irreversível.
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS usuario CASCADE;

COMMIT;
