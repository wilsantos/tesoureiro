# Termos de Serviço, Política de Privacidade e aceite no cadastro

- **Data:** 2026-08-16
- **Status:** aceita
- **Contexto:** O cadastro em `/cadastro` coleta Nome, E-mail e Senha sem qualquer aceite explícito de termos. O login Google (GIS) exige, no OAuth consent screen do Google Cloud Console, URLs públicas de Política de Privacidade e Termos de Serviço. A instância opera no Brasil (LGPD) e pode ser auto-hospedada: o controlador é o **operador da instância**, não uma empresa inventada. O produto (**Servidor de NA**) é tesouraria para grupos de Narcóticos Anônimos — servidores de confiança com papel de secretaria e/ou tesouraria — e não um cadastro de membros em recuperação. Ainda assim, endereço de grupo e “fatos relevantes” em texto livre podem conter dados pessoais. É necessário publicar os textos, exibi-los em rotas estáveis sem login e exigir checkbox no cadastro por e-mail/senha.

- **Decisão:**

  1. **Fonte da verdade em Markdown** versionado no repositório:
     - [docs/legal/termos-de-servico.md](../legal/termos-de-servico.md) (versão **1.0**, vigência **16 de agosto de 2026**)
     - [docs/legal/politica-de-privacidade.md](../legal/politica-de-privacidade.md) (versão **1.0**, mesma vigência)
     O frontend **copia** o conteúdo para templates HTML. Não há fetch de Markdown em runtime na v1.
  2. **Rotas públicas Angular**, estáveis para o Console Google, **sem** `guestGuard` e **sem** `authGuard`:
     - `/termos`
     - `/privacidade`
     Declarar **antes** do `path: '**'` em `app.routes.ts`. Usuário autenticado também deve conseguir ler os documentos (o `guestGuard` redirecionaria para `/app`).
  3. **Checkbox obrigatório só em `/cadastro`** (e-mail/senha): controle `aceiteTermos` com `Validators.requiredTrue`. Links para os dois documentos com `target="_blank"` e `rel="noopener noreferrer"`, para não perder o formulário. O botão Cadastrar só procede com o formulário válido, inclusive o aceite.
  4. **Não persistir o aceite no banco nesta v1.** Nenhum trabalho de `dba` nem `dev-php`. O checkbox existe apenas no cliente. Limitação LGPD (Art. 8º — registro do consentimento) registrada abaixo; evolução futura: colunas `AceiteTermosEm` e versão do texto (`AceiteTermosVersao`, ex. `1.0`).
  5. **Login Google que cria conta automaticamente permanece fora do checkbox nesta v1.** Risco explícito: a conta pode nascer sem o mesmo clique de aceite da tela de cadastro. Os textos continuam públicos e aplicáveis ao uso do serviço.

- **Alternativas consideradas:**

  | Alternativa | Prós | Contras | Veredito |
  |-------------|------|---------|----------|
  | Só arquivos Markdown no GitHub, sem páginas no app | Menos UI | Console Google exige URL pública no domínio do app; usuário do cadastro não lê no próprio site | Rejeitada |
  | PDF estático em `/assets` | URLs simples | Tipografia e manutenção piores; duplica a fonte da verdade | Rejeitada na v1 |
  | Rotas `/termos` e `/privacidade` com `guestGuard` | Reusa o padrão de `/login` | Usuário logado não lê; Google/revisores autenticados são redirecionados | Rejeitada |
  | Persistir `AceiteTermosEm` + versão já na v1 | Atende melhor o Art. 8º da LGPD | Exige migração e API; o pedido desta entrega é só textos + checkbox | Adiada — v2 |
  | Checkbox também no login Google (`/login`) | Mesmo padrão de aceite para os dois fluxos | GIS cria conta no callback; UX extra e fora do pedido | Fora de escopo v1 (risco) |
  | Modal com o texto inteiro no cadastro | Aceite no mesmo fluxo, sem nova aba | Formulário longo; Google ainda precisa de URL pública | Rejeitada — páginas + nova aba |
  | Inventar razão social, CNPJ e e-mail de DPO | Parece “empresa de verdade” | Falso; instância auto-hospedada; controlador é o operador | Rejeitada |

- **Impacto:**
  - **frontend:** duas rotas públicas; páginas de leitura (layout jurídico reutilizável); checkbox e validação no `CadastroComponent`; estilos alinhados a `.auth-page` / documento longo. Sem Angular Material.
  - **api:** nenhuma alteração na v1.
  - **banco:** nenhuma alteração na v1.
  - **operação:** no Google Cloud Console → OAuth consent screen, preencher Privacy policy URL = `https://<dominio>/privacidade` e Terms of service URL = `https://<dominio>/termos`. Ver [google-login-producao.md](../operacao/google-login-producao.md).

- **Riscos e mitigação:**

  | Risco | Mitigação |
  |-------|-----------|
  | Aceite só no cliente, sem prova no servidor (LGPD Art. 8º) | Documentar a limitação; v2 grava `AceiteTermosEm` + `AceiteTermosVersao` no `usuario` e rejeita `POST /auth/cadastro` sem o aceite |
  | Login Google cria conta sem checkbox | Fora de escopo v1; na v2 exigir aceite antes de enviar o `id_token` ou gravar aceite no `POST /auth/google` |
  | Textos livres (fatos relevantes, endereço) com dados pessoais de terceiros | Política e termos deixam a responsabilidade no usuário; reuniões **não** cadastram nomes de membros |
  | `guestGuard` aplicado por engano nas rotas legais | Contrato de UI abaixo: **zero** guards nessas duas rotas |
  | Wildcard `**` engolir `/termos` | Declarar as rotas **antes** de `path: '**'` |
  | Textos desatualizados entre Markdown e HTML | Markdown é a fonte; qualquer alteração legal começa nestes arquivos e depois o frontend copia |
  | Documentos não substituem assessoria jurídica | Aviso no topo dos dois textos |

- **Próximos passos:**
  - **frontend-dev:** implementar rotas, páginas e checkbox conforme o contrato de UI abaixo. Não implementar PHP nem SQL.
  - **dba / dev-php:** nenhum nesta v1.
  - **arquiteto (v2, quando houver acordo):** ADR de persistência do aceite (`AceiteTermosEm`, `AceiteTermosVersao`) e aceite no fluxo Google.

- **Fora de escopo (v1):**
  - Persistência do consentimento no PostgreSQL
  - Validação do aceite na API (`POST /auth/cadastro` / `POST /auth/google`)
  - Checkbox ou modal no login Google
  - Recuperação de senha, DPO nominado, CNPJ, e-mail institucional inventado
  - Cookie banner (o app não usa cookie de sessão; JWT está no `localStorage`)
  - Tradução para outros idiomas
  - Revisão por advogado (os textos alertam que não substituem assessoria)

---

## Limitação LGPD (Art. 8º) — v1

A Lei nº 13.709/2018 exige que o consentimento seja registrado, associado ao titular, e que o controlador possa demonstrá-lo. Nesta v1 o aceite é **somente um controle de formulário no Angular**. Não há timestamp, IP, versão do texto nem evidência no banco.

Isso é aceitável como etapa intermediária para publicar os documentos e destravar o Console Google, mas **não** cumpre o registro do consentimento. A evolução prevista:

| Campo (v2) | Uso |
|------------|-----|
| `usuario."AceiteTermosEm"` | `TIMESTAMPTZ` do clique (cadastro e-mail/senha; depois Google) |
| `usuario."AceiteTermosVersao"` | `VARCHAR`, ex. `1.0`, alinhado à versão nos Markdown |

Até lá, a base legal principal do tratamento da **conta** continua sendo a **execução de contrato** (cadastro e uso do serviço), não só o clique. O checkbox ainda é exigido na UI por transparência e boa-fé.

---

## Contrato de UI para o frontend-dev

### Rotas

| Caminho | Guards | Componente | Título da página |
|---------|--------|------------|------------------|
| `/termos` | nenhum | layout jurídico + conteúdo dos Termos | Termos de Serviço |
| `/privacidade` | nenhum | o mesmo layout + conteúdo da Política | Política de Privacidade |

- Inserir em `frontend/src/app/app.routes.ts` **antes** de `{ path: '**', redirectTo: '' }`.
- Não usar `guestGuard` (bloqueia quem já tem JWT).
- Não usar `authGuard` (bloqueia o Google Console e visitantes).
- Pode ser um único componente standalone (ex. `DocumentoLegalComponent`) com `data: { documento: 'termos' | 'privacidade' }` nas duas rotas.
- **Não** usar Angular Material.
- Conteúdo: copiar dos Markdown em `docs/legal/` para o template (HTML semântico: `h1`/`h2`/`p`/`ol`/`ul`). Manter a estrutura numerada.

### Layout e estilo

- Fora do `AppShellComponent` (sem abas autenticadas).
- Visual alinhado a `.auth-page` (marca **Servidor de NA**, fundo/cartão existentes).
- Documento longo: largura máxima legível (ex. ~40–48rem), tipografia de leitura, espaçamento entre seções, link “Voltar ao cadastro” / “Ir para o login” no rodapé do layout.
- Cabeçalho com marca, título do documento, data de vigência **16 de agosto de 2026** e versão **1.0**.

### Checkbox no `CadastroComponent` (`/cadastro`)

Campo do form:

```ts
aceiteTermos: [false, [Validators.requiredTrue]]
```

Copy (usar exatamente, salvo ajuste mínimo de pontuação):

> Li e aceito os [Termos de Serviço](/termos) e a [Política de Privacidade](/privacidade).

Os dois links:

- `routerLink="/termos"` e `routerLink="/privacidade"` **ou** `href="/termos"` / `href="/privacidade"`
- `target="_blank"`
- `rel="noopener noreferrer"`

Mensagem se o usuário tentar cadastrar sem marcar (controle `touched` + `hasError('required')`, no mesmo padrão dos outros campos):

> É necessário aceitar os Termos de Serviço e a Política de Privacidade para criar a conta.

Comportamento:

- `onSubmit()` já retorna se `form.invalid` e faz `markAllAsTouched()` — manter isso; o `requiredTrue` passa a fazer parte da validade.
- O botão **Cadastrar** só dispara o `POST` com o form válido (aceite incluído). Pode permanecer habilitado visualmente como hoje (o submit valida) ou ser `[disabled]` também quando `aceiteTermos` for falso; o requisito é não proceder sem aceite.
- **Não** enviar o aceite no body da API nesta v1 (o endpoint atual não tem o campo).
- **Não** alterar `/login` nem o botão Google nesta v1.

### O que não fazer

- Não colocar as páginas legais dentro de `/app/...`.
- Não exigir login para ler os textos.
- Não implementar SQL, PHP nem novo campo no `POST /auth/cadastro`.
- Não inventar CNPJ, razão social ou e-mail de DPO na UI; o contato nos textos é “administrador da instância”.
