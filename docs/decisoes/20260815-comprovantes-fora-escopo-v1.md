# Comprovantes de despesa fora do escopo da v1

- **Data:** 2026-08-15
- **Status:** aceita
- **Contexto:** O sistema já possui suporte a upload opcional de comprovante de despesa: coluna `"Comprovante"` (`BYTEA`, nullable) na tabela `despesas`, envio/recebimento em Base64 na API (`api/despesas/index.php`) e campo de upload na tela de reunião (`reuniao.component`). A v1 prioriza cadastro de grupos, reuniões, despesas e relatórios com autenticação e onboarding — o fluxo de comprovantes adiciona complexidade (arquivos grandes em BYTEA, UX de upload/visualização, payload pesado) sem ser requisito para o lançamento inicial.

- **Decisão:**
  1. **Remover** da v1 toda interação com comprovantes no **frontend** (formulário de despesa, coluna na listagem, conversão Base64).
  2. **Remover** da v1 o tratamento do campo `Comprovante` na **API** (`POST`/`PUT`/`GET` por id) — o endpoint não aceita nem retorna o campo.
  3. **Manter** a coluna `"Comprovante"` no banco (`BYTEA NULL`) — sem migração para dropar a coluna agora; dados existentes permanecem intactos.
  4. Reintrodução planejada para **v2**, preferencialmente com **object storage** (S3/compatível) em vez de BYTEA no PostgreSQL.

- **Alternativas consideradas:**

  | Alternativa | Prós | Contras | Veredito |
  |-------------|------|---------|----------|
  | Manter feature na v1 | Já implementada; usuário anexa recibo | Escopo, BYTEA no banco, UX incompleta (sem visualização robusta) | Rejeitada para v1 |
  | Dropar coluna `Comprovante` agora | Schema mais limpo | Perde dados legados; migração desnecessária se v2 reativar | Adiada |
  | Manter coluna, remover UI/API | Baixo risco; reversível | Coluna órfã temporariamente | **Aceita** |

- **Impacto:**
  - **frontend:** remover campo de upload, propriedade `Comprovante` do modelo de despesa e coluna "Comprovante" em `reuniao.component` (`.ts` e `.html`).
  - **api:** simplificar `api/despesas/index.php` — sem `encode`/`base64` no `GET`, sem `INSERT`/`UPDATE` de `Comprovante`.
  - **banco:** nenhuma alteração de schema na v1.
  - **docs:** atualizar `README.md`, `.cursor/docs/api.md` e `.cursor/docs/arquitetura.md` para refletir ausência do campo na v1.

- **Riscos e mitigação:**

  | Risco | Mitigação |
  |-------|-----------|
  | Dados de comprovante legados inacessíveis via API na v1 | Coluna preservada; script de exportação pontual se necessário antes da v2 |
  | Reativação na v2 exige novo contrato de API | ADR futura para object storage + URL assinada; não reutilizar BYTEA em produção |
  | Documentação desatualizada menciona upload | Atualizar docs junto com a remoção no código |

- **Próximos passos:**
  - **dev-php:** remover leitura/escrita de `Comprovante` em `api/despesas/index.php`; ajustar contrato documentado.
  - **frontend-dev:** remover upload, estado `Comprovante` e coluna na tabela de despesas em `reuniao.component`.
  - **arquiteto (pós-implementação):** atualizar `api.md` e `arquitetura.md`; registrar ADR de v2 quando object storage for definido.

- **Fora de escopo (v1):**
  - Upload de comprovante (imagem/PDF)
  - Exibição ou download de comprovante na UI
  - Campo `Comprovante` no contrato da API (`POST`, `PUT`, `GET`)
  - Migração para dropar coluna `"Comprovante"`
  - Object storage e URLs assinadas (previsto para v2)
