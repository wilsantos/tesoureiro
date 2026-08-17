-- =============================================================================
-- Rollback: hierarquia BMLT — csr e extensão de csa
-- =============================================================================
-- Reverte database/20260815_csr_csa_bmlt.sql
-- ATENÇÃO: remove metadados BMLT de csa; CSAs seed voltam a ter só Id/Nome.
-- =============================================================================

BEGIN;

ALTER TABLE csa DROP CONSTRAINT IF EXISTS csa_csr_fk;
ALTER TABLE csa DROP CONSTRAINT IF EXISTS csa_bmlt_id_unique;

DROP INDEX IF EXISTS csa_csr_idx;
DROP INDEX IF EXISTS csa_nome_idx;

ALTER TABLE csa
  DROP COLUMN IF EXISTS "BmltId",
  DROP COLUMN IF EXISTS "CSR",
  DROP COLUMN IF EXISTS "Descricao",
  DROP COLUMN IF EXISTS "Url",
  DROP COLUMN IF EXISTS "Helpline",
  DROP COLUMN IF EXISTS "WorldId",
  DROP COLUMN IF EXISTS "ImportadoEm",
  DROP COLUMN IF EXISTS "AtualizadoEm";

DROP TABLE IF EXISTS csr CASCADE;

COMMIT;
