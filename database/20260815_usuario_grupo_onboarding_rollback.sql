-- =============================================================================
-- Rollback: onboarding — usuario_grupo, UltimoAcesso, índice grupo por CSA
-- =============================================================================
-- Objetivo:
--   Reverter database/20260815_usuario_grupo_onboarding.sql
--
-- ATENÇÃO: remove todos os vínculos usuario_grupo. Operação irreversível.
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS usuario_grupo CASCADE;

DROP INDEX IF EXISTS grupo_csa_nome_lower_idx;

ALTER TABLE usuario DROP COLUMN IF EXISTS "UltimoAcesso";

COMMIT;
