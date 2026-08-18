# Despesas sem salvar reunião antes

- **Data:** 2026-08-15
- **Status:** aceita
- **Contexto:** Na tela de reunião (`reuniao.component`), o tesoureiro precisa cadastrar despesas na aba **Tesouraria**, muitas vezes **antes** de os dados de **Secretaria** estarem preenchidos ou salvos. Hoje o fluxo exige que a reunião exista no banco (`reuniao.Id`) antes de qualquer despesa:

  - Botão "Adicionar Despesa" desabilitado quando `!reuniao.Id`
  - Aviso: "Salve a reunião primeiro para adicionar despesas"
  - `saveDespesa()` bloqueia com alert se `!despesa.IdReuniao`

  No banco, `despesas."IdReuniao"` é `NOT NULL` (FK implícita para `reuniao`). A API de despesas (`POST /api/despesas`) exige `IdReuniao`, `Descricao` e `ValorDespesa`. Não há endpoint transacional reuniao+despesas. A API de reunião (`POST /api/reuniao`) já aceita valores zerados nos campos numéricos obrigatórios (`Membros`, `Visitantes`, marcos temporais, etc.) — o que permite criar um registro "mínimo" com `IdGrupo`, `Data` e defaults.

  Com onboarding de papéis por grupo, o mesmo usuário pode ter só `tesouraria` ou ambos os papéis; o bloqueio atual força uma ordem de preenchimento que não reflete o trabalho real do tesoureiro.

- **Decisão:**

  Adotar **auto-save silencioso da reunião** no frontend: ao tentar adicionar ou salvar a primeira despesa em uma reunião ainda sem `Id`, o sistema persiste automaticamente a reunião com os valores atuais do formulário (zeros/strings vazias onde aplicável), obtém `id` da API, atualiza `reuniao.Id` e prossegue com o `POST`/`PUT` da despesa — **sem exigir** que o usuário clique em "Salvar reunião" antes.

  Regras complementares:

  1. **Pré-requisito mínimo para auto-save:** `IdGrupo` e `Data` preenchidos (já garantidos ao abrir nova reunião a partir dos filtros de grupo/mês/ano).
  2. **Sem alteração de schema** nem de contrato obrigatório da API na v1.
  3. **Feedback discreto:** auto-save não dispara o mesmo alert de sucesso de "Reunião criada"; erro de auto-save deve ser exibido e impedir a despesa.
  4. **Edição de reunião existente:** fluxo atual inalterado (`reuniao.Id` já definido).
  5. **Salvar reunião** continua disponível para atualizar dados de secretaria/tesouraria; após auto-save, passa a ser `PUT` (reunião já persistida).

- **Alternativas consideradas:**

  | Alternativa | Prós | Contras | Veredito |
  |-------------|------|---------|----------|
  | **Despesas em memória (staging) no frontend** até salvar reunião | Zero mudança em API/banco; implementação localizada | Perda de dados ao recarregar/fechar aba; editar/excluir despesa staging exige lógica paralela; `saveReuniao()` precisa orquestrar N `POST` despesas | Rejeitada — pior UX e mais complexidade no componente |
  | **Auto-save silencioso da reunião** ao adicionar/salvar primeira despesa | Melhor UX; despesas persistem imediatamente; reutiliza endpoints atuais; sem migração | Reunião "incompleta" aparece na listagem antes do preenchimento total de secretaria | **Aceita** |
  | **POST transacional `reuniao` + `Despesas[]`** na API | Atomicidade; um request no save final | Não resolve cadastro incremental de despesas; mudança de contrato e transação PHP; duplica lógica de `despesas` | Adiada — útil como evolução opcional, não necessária agora |
  | **Coluna `Status` / rascunho em `reuniao`** | Ocultar incompletas em relatórios/listagens | Migração; filtros em API, relatórios e frontend; escopo maior que o pedido | Rejeitada na v1 — reavaliar se listagens poluídas virarem problema |

- **Impacto:**

  - **frontend:**
    - Remover `[disabled]="!reuniao.Id"` no botão "Adicionar Despesa" e o aviso "Salve a reunião primeiro…"
    - Remover guard `if (!this.despesa.IdReuniao)` com alert em `saveDespesa()`
    - Novo método `garantirReuniaoPersistida(): Observable<number>` (ou `Promise`): se `reuniao.Id` → emite id; senão → `POST` reunião com payload atual, seta `reuniao.Id`, `isEdit = true`, emite id
    - `saveDespesa()` e, opcionalmente, `abrirFormularioDespesa()` chamam `garantirReuniaoPersistida()` antes de abrir/persistir despesa
    - Tratar loading/erro durante auto-save (desabilitar botões ou spinner leve)
    - Após auto-save na criação, `saveReuniao()` passa a usar `PUT` — alinhar mensagens ("Reunião atualizada" vs criada)

  - **api:**
    - **Nenhuma mudança obrigatória** — `POST /api/reuniao` e `POST /api/despesas` já suportam o fluxo
    - Validar em teste que `FatosRelevantes: ''` e campos numéricos `0` são aceitos no `POST` reuniao
    - Opcional (fora da decisão principal): documentar em `api.md` o padrão de reunião criada com defaults

  - **banco:**
    - Nenhuma alteração de schema
    - Reuniões parciais passam a existir antes do preenchimento completo — aceito na v1

  - **operação:**
    - Nenhuma variável de ambiente ou deploy especial

- **Riscos e mitigação:**

  | Risco | Mitigação |
  |-------|-----------|
  | Reunião incompleta visível no grid mensal | Aceito v1; usuário completa depois via edição; ADR futura de `Status`/rascunho se necessário |
  | Auto-save falha (rede/validação) e usuário acha que despesa foi salva | Bloquear fluxo de despesa até sucesso; mensagem clara de erro |
  | Duplicidade de reunião mesmo grupo+data | Pré-existente; fora desta ADR — validação única pode ser ADR futura |
  | Tesoureiro sem papel secretaria salva reunião só com defaults | Alinhado ao domínio; secretaria pode editar depois se tiver o papel |
  | `DELETE reuniao` sem cascade em `despesas` | Verificar comportamento atual; não introduzido por esta mudança |

- **Contrato de API (v1 — sem mudança obrigatória):**

  Fluxo atual permanece. Referência para implementação:

  **`POST /api/reuniao`** (auto-save) — corpo mínimo típico ao abrir nova reunião:

  ```json
  {
    "IdGrupo": 1,
    "Data": "2026-08-15",
    "Membros": 0,
    "Visitantes": 0,
    "ValorSetima": 0,
    "ValorSetimaPix": 0,
    "VendaLiteratura": 0,
    "Ingresso": 0,
    "TrintaDias": 0,
    "SessentaDias": 0,
    "NoventaDias": 0,
    "SeisMeses": 0,
    "NoveMeses": 0,
    "UmAno": 0,
    "DezoitoMeses": 0,
    "MultiplosAnos": 0,
    "FatosRelevantes": ""
  }
  ```

  Resposta: `{ "message": "...", "id": <number> }` (201)

  **`POST /api/despesas`** (após auto-save) — inalterado:

  ```json
  {
    "IdReuniao": <id retornado>,
    "Descricao": "Aluguel sala",
    "ValorDespesa": 150.00,
    "repasse": false,
    "compra_literatura": false
  }
  ```

  **Evolução opcional (não v1):** `POST /api/reuniao` aceitar `Despesas?: Array<{ Descricao, ValorDespesa, repasse?, compra_literatura? }>` em transação — reduz round-trips no save manual, mas não substitui auto-save para UX incremental.

- **Próximos passos:**

  ### `frontend-dev`

  1. Implementar `garantirReuniaoPersistida()` em `reuniao.component.ts` usando `ApiService.createReuniao()` com o objeto `reuniao` atual (normalizar números como em `saveReuniao()`).
  2. Em `saveDespesa()`: `switchMap` / `concatMap` — `garantirReuniaoPersistida()` → atribuir `despesa.IdReuniao` → `createDespesa` / `updateDespesa`.
  3. Remover bloqueios de UI em `.html` (`[disabled]="!reuniao.Id"`, `*ngIf` do aviso).
  4. Ajustar `saveReuniao()` para tratar reunião já auto-salva (`isEdit === true` após primeiro auto-save).
  5. Testar jornadas: (a) só tesouraria, despesas antes de secretaria; (b) edição de reunião existente; (c) falha de rede no auto-save.

  ### `dev-php`

  1. Smoke test: `POST reuniao` com todos os numéricos em zero e `FatosRelevantes` vazio retorna 201.
  2. Nenhuma alteração de código esperada; se validação impedir algum default, relaxar apenas o necessário (sem mudar campos obrigatórios do schema).

  ### `dba`

  - Nenhuma ação.

  ### `arquiteto` (pós-implementação)

  - Atualizar `.cursor/docs/api.md` com nota sobre auto-save e reuniões parciais, se aplicável.
  - Marcar ADR como **aceita** após validação do usuário.

- **Fora de escopo (v1):**

  - Coluna `Status` / rascunho em `reuniao`
  - `POST` transacional reuniao + `Despesas[]`
  - Staging de despesas apenas em memória
  - Validação de unicidade grupo + data
  - RBAC restringindo auto-save de reunião por papel (papéis continuam só na UI, conforme ADR de onboarding)
  - Ocultar reuniões incompletas em relatórios
