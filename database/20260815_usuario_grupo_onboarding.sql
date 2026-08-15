-- =============================================================================
-- Migração: onboarding — usuario_grupo, UltimoAcesso, índice grupo por CSA
-- =============================================================================
-- Objetivo:
--   Vínculo N:N entre usuario e grupo com papel (secretaria|tesouraria) e flag
--   Ativo. Um encargo ativo por grupo+papel no sistema. UltimoAcesso em usuario
--   para regra dos 20 dias na transferência de encargo.
--
-- Tabelas afetadas:
--   usuario (coluna UltimoAcesso)
--   usuario_grupo (nova)
--   grupo (índice único CSA + Nome)
--
-- Dependências:
--   database/20260814_usuario_auth.sql
--   Tabelas grupo, csa existentes
--
-- Rollback:
--   database/20260815_usuario_grupo_onboarding_rollback.sql
--
-- Como aplicar (não executar automaticamente):
--   PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
--     -d "$DB_NAME" -f database/20260815_usuario_grupo_onboarding.sql
-- =============================================================================

BEGIN;

ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS "UltimoAcesso" TIMESTAMPTZ;

COMMENT ON COLUMN usuario."UltimoAcesso" IS
  'Último login ou chamada autenticada a /auth/me; regra dos 20 dias no encargo.';

CREATE TABLE IF NOT EXISTS usuario_grupo (
  "Id" SERIAL PRIMARY KEY,
  "Usuario" INTEGER NOT NULL,
  "Grupo" INTEGER NOT NULL,
  "Papel" VARCHAR(20) NOT NULL,
  "Ativo" BOOLEAN NOT NULL DEFAULT true,
  "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE usuario_grupo
    ADD CONSTRAINT usuario_grupo_usuario_fk
    FOREIGN KEY ("Usuario") REFERENCES usuario ("Id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE usuario_grupo
    ADD CONSTRAINT usuario_grupo_grupo_fk
    FOREIGN KEY ("Grupo") REFERENCES grupo ("Id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE usuario_grupo
    ADD CONSTRAINT usuario_grupo_usuario_grupo_papel_unique
    UNIQUE ("Usuario", "Grupo", "Papel");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE usuario_grupo
    ADD CONSTRAINT usuario_grupo_papel_check
    CHECK ("Papel" IN ('secretaria', 'tesouraria'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS usuario_grupo_usuario_idx
  ON usuario_grupo ("Usuario");

CREATE INDEX IF NOT EXISTS usuario_grupo_grupo_idx
  ON usuario_grupo ("Grupo");

CREATE UNIQUE INDEX IF NOT EXISTS usuario_grupo_grupo_papel_ativo_idx
  ON usuario_grupo ("Grupo", "Papel")
  WHERE "Ativo" = true;

CREATE UNIQUE INDEX IF NOT EXISTS grupo_csa_nome_lower_idx
  ON grupo ("CSA", LOWER("Nome"));

COMMENT ON TABLE usuario_grupo IS
  'Vínculo usuário ↔ grupo com papel (secretaria ou tesouraria) e flag Ativo.';

COMMENT ON COLUMN usuario_grupo."Usuario" IS
  'FK usuario.Id — usuário que declara o encargo.';

COMMENT ON COLUMN usuario_grupo."Grupo" IS
  'FK grupo.Id — grupo de atuação.';

COMMENT ON COLUMN usuario_grupo."Papel" IS
  'Encargo: secretaria ou tesouraria (CHECK).';

COMMENT ON COLUMN usuario_grupo."Ativo" IS
  'Encargo vigente; apenas um Ativo=true por Grupo+Papel (índice parcial).';

COMMENT ON COLUMN usuario_grupo."CriadoEm" IS
  'Data/hora de criação do vínculo (UTC).';

COMMIT;
