-- =============================================================================
-- Migração: autenticação — tabela usuario
-- =============================================================================
-- Objetivo:
--   Criar a tabela `usuario` para login por e-mail/senha e Google OAuth (v1).
--   Suporta cadastro aberto (CADASTRO_ABERTO=true) e contas somente Google
--   (SenhaHash NULL) ou somente local (GoogleSub NULL), desde que ao menos um
--   método de credencial esteja presente.
--
-- Tabelas afetadas:
--   usuario (nova)
--
-- Dependências:
--   PostgreSQL 16+
--   Nenhuma FK com tabelas de domínio (csa, grupo, reuniao, despesas) na v1.
--
-- Rollback:
--   database/20260814_usuario_auth_rollback.sql
--
-- Como aplicar (não executar automaticamente):
--   psql -h host.docker.internal -p 5432 -U tesoureiro -d tesouraria \
--     -f database/20260814_usuario_auth.sql
--
--   Ou, com variáveis do .env:
--   PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
--     -d "$DB_NAME" -f database/20260814_usuario_auth.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS usuario (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(200) NOT NULL,
  "Email" VARCHAR(320) NOT NULL,
  "SenhaHash" VARCHAR(255),
  "GoogleSub" VARCHAR(255),
  "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "AtualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE usuario
    ADD CONSTRAINT usuario_email_unique UNIQUE ("Email");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE usuario
    ADD CONSTRAINT usuario_credencial_check
    CHECK ("SenhaHash" IS NOT NULL OR "GoogleSub" IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS usuario_googlesub_unique_idx
  ON usuario ("GoogleSub")
  WHERE "GoogleSub" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS usuario_email_lower_idx
  ON usuario (LOWER("Email"));

COMMENT ON TABLE usuario IS
  'Usuários autenticados do Servidor de NA (e-mail/senha e/ou Google OAuth).';

COMMENT ON COLUMN usuario."Id" IS
  'Identificador interno do usuário (SERIAL).';

COMMENT ON COLUMN usuario."Nome" IS
  'Nome de exibição (ex.: cabeçalho "Bem-vindo").';

COMMENT ON COLUMN usuario."Email" IS
  'E-mail único; busca case-insensitive via índice LOWER("Email").';

COMMENT ON COLUMN usuario."SenhaHash" IS
  'Hash Argon2id/bcrypt da senha; NULL em contas somente Google.';

COMMENT ON COLUMN usuario."GoogleSub" IS
  'Subject (sub) do id_token Google; único quando preenchido.';

COMMENT ON COLUMN usuario."CriadoEm" IS
  'Data/hora de criação do registro (UTC).';

COMMENT ON COLUMN usuario."AtualizadoEm" IS
  'Data/hora da última atualização (login, cadastro ou vínculo Google).';

COMMIT;
