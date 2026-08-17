-- =============================================================================
-- Migração: hierarquia BMLT — tabela csr e extensão de csa
-- =============================================================================
-- Objetivo:
--   Suportar importação do endpoint BMLT GetServiceBodies:
--   - type "RS" → tabela csr (Regional Service / CSR)
--   - type "AS" → tabela csa existente, com FK CSR via parent_id do JSON
--
-- Tabelas afetadas:
--   csr (nova)
--   csa (colunas BmltId, CSR, metadados BMLT, timestamps de importação)
--
-- Dependências:
--   Tabela csa existente (docker/postgres/init/01-schema.sql ou dump)
--
-- Rollback:
--   database/20260815_csr_csa_bmlt_rollback.sql
--
-- Como aplicar (não executar automaticamente):
--   PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
--     -d "$DB_NAME" -f database/20260815_csr_csa_bmlt.sql
--
-- Fonte BMLT (etapa 2 — importação de dados):
--   https://bmlt.na.org.br/ativo/main_server/client_interface/json/?switcher=GetServiceBodies
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- csr — Comunidade de Serviço Regional (BMLT type "RS")
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS csr (
  "Id" SERIAL PRIMARY KEY,
  "BmltId" INTEGER NOT NULL,
  "Nome" VARCHAR(400) NOT NULL,
  "Descricao" TEXT,
  "Url" VARCHAR(500),
  "Helpline" VARCHAR(100),
  "WorldId" VARCHAR(20),
  "ImportadoEm" TIMESTAMPTZ,
  "AtualizadoEm" TIMESTAMPTZ
);

DO $$
BEGIN
  ALTER TABLE csr
    ADD CONSTRAINT csr_bmlt_id_unique UNIQUE ("BmltId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS csr_nome_idx
  ON csr (LOWER("Nome"));

COMMENT ON TABLE csr IS
  'CSR (Regional Service) importado do BMLT (GetServiceBodies, type RS).';

COMMENT ON COLUMN csr."BmltId" IS
  'ID do service body no BMLT (JSON id); chave para upsert na importação.';

COMMENT ON COLUMN csr."Nome" IS
  'Nome oficial da região (JSON name).';

COMMENT ON COLUMN csr."Descricao" IS
  'Descrição do BMLT (JSON description).';

COMMENT ON COLUMN csr."Url" IS
  'URL do site da região (JSON url).';

COMMENT ON COLUMN csr."Helpline" IS
  'Telefone de ajuda regional (JSON helpline).';

COMMENT ON COLUMN csr."WorldId" IS
  'Identificador mundial NA (JSON world_id), ex.: RG089.';

COMMENT ON COLUMN csr."ImportadoEm" IS
  'Primeira importação bem-sucedida deste registro (preenchido na etapa 2).';

COMMENT ON COLUMN csr."AtualizadoEm" IS
  'Última atualização via importação BMLT (preenchido na etapa 2).';

-- -----------------------------------------------------------------------------
-- csa — extensão para vínculo com CSR e metadados BMLT (type "AS")
-- -----------------------------------------------------------------------------

ALTER TABLE csa
  ADD COLUMN IF NOT EXISTS "BmltId" INTEGER,
  ADD COLUMN IF NOT EXISTS "CSR" INTEGER,
  ADD COLUMN IF NOT EXISTS "Descricao" TEXT,
  ADD COLUMN IF NOT EXISTS "Url" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "Helpline" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "WorldId" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "ImportadoEm" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "AtualizadoEm" TIMESTAMPTZ;

DO $$
BEGIN
  ALTER TABLE csa
    ADD CONSTRAINT csa_bmlt_id_unique UNIQUE ("BmltId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE csa
    ADD CONSTRAINT csa_csr_fk
    FOREIGN KEY ("CSR") REFERENCES csr ("Id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS csa_csr_idx
  ON csa ("CSR");

CREATE INDEX IF NOT EXISTS csa_nome_idx
  ON csa (LOWER("Nome"));

COMMENT ON COLUMN csa."BmltId" IS
  'ID do service body no BMLT (JSON id) para CSAs (type AS); NULL em registros legados/seed.';

COMMENT ON COLUMN csa."CSR" IS
  'FK csr.Id — região pai; na importação, resolver csr.BmltId = JSON parent_id.';

COMMENT ON COLUMN csa."Descricao" IS
  'Descrição do BMLT (JSON description).';

COMMENT ON COLUMN csa."Url" IS
  'URL do CSA (JSON url).';

COMMENT ON COLUMN csa."Helpline" IS
  'Telefone de ajuda do CSA (JSON helpline).';

COMMENT ON COLUMN csa."WorldId" IS
  'Identificador mundial NA (JSON world_id), ex.: AR24418.';

COMMENT ON COLUMN csa."ImportadoEm" IS
  'Primeira importação bem-sucedida deste registro (preenchido na etapa 2).';

COMMENT ON COLUMN csa."AtualizadoEm" IS
  'Última atualização via importação BMLT (preenchido na etapa 2).';

COMMIT;
