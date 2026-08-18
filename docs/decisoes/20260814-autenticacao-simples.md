# Autenticação simples com e-mail/senha e Google OAuth

- **Data:** 2026-08-14
- **Status:** aceita
- **Contexto:** O sistema opera hoje **sem autenticação** — qualquer cliente com acesso à URL pode ler e alterar dados de grupos, reuniões, despesas e relatórios. O produto evoluiu e passa a exigir identificação do usuário, cadastro, login (e-mail/senha e Google), cabeçalho global com boas-vindas e renomeação da marca para **Servidor de NA**. A stack permanece PHP procedural + Angular 17 standalone + PostgreSQL, sem framework PHP nem NgRx.

- **Decisão:**
  1. Introduzir tabela `usuario` no PostgreSQL com suporte a credencial local (hash de senha) e vínculo Google (`GoogleSub`).
  2. Autenticação na API via **JWT (HS256)** no header `Authorization: Bearer <token>`, sem sessão PHP e sem cookies — adequado ao SPA Angular desacoplado e ao CORS atual.
  3. Novo recurso `api/auth/` com cadastro, login e-mail/senha, login Google (validação de `id_token` no backend) e endpoint `me` para o cabeçalho.
  4. Middleware PHP compartilhado (`api/config/auth.php`) exigindo JWT em **todos** os endpoints existentes (`grupo`, `reuniao`, `despesas`, `relatorios`, `csa`), exceto `auth` e `test.php`.
  5. Frontend passa a usar **Angular Router** com rotas públicas (`/login`, `/cadastro`) e área autenticada (`/app/...`), `AuthGuard`, `AuthInterceptor` e cabeçalho global **"Bem-vindo, {Nome}"**.
  6. Google Sign-In via **Google Identity Services (GIS)** no browser; o backend valida o `id_token` (audience = `GOOGLE_CLIENT_ID`).
  7. Renomear exibição **"Sistema de Tesouraria" → "Servidor de NA"** no shell Angular e `<title>`; demais referências em documentação conforme plano.

- **Alternativas consideradas:**

  | Alternativa | Prós | Contras | Veredito |
  |-------------|------|---------|----------|
  | Sessão PHP + cookie | Revogação imediata; familiar em PHP | Exige `credentials` no CORS, origem fixa, sticky session em cluster | Rejeitada — conflita com SPA + CORS `*` atual |
  | JWT + refresh token em tabela | Logout server-side, tokens curtos | Mais tabelas, endpoints e complexidade | Adiada — v2 se necessário |
  | OAuth Google só no frontend (sem validar no backend) | Implementação rápida | Inseguro — qualquer um forja identidade | Rejeitada |
  | Biblioteca `google/apiclient` (Composer) | Validação robusta de token | Introduz Composer só para auth | Opcional — v1 pode usar `tokeninfo` ou JWKS via cURL |
  | Manter abas sem Router | Menos refactor | Dificulta guard de rotas e telas login/cadastro | Rejeitada — Router é pré-requisito |

- **Impacto:**
  - **api:** novo `auth/`, `config/auth.php`, Composer mínimo (`firebase/php-jwt`), proteção nos 5 recursos existentes, novas env vars.
  - **frontend:** rotas, 2 telas novas, `AuthService`, interceptor, refactor do `AppComponent`, renomeação de marca, `environment.googleClientId`.
  - **banco:** tabela `usuario`; sem FK para domínio de tesouraria na v1 (usuário autenticado acessa todos os dados — ver riscos).
  - **operação:** configurar `JWT_SECRET`, `GOOGLE_CLIENT_ID` (e opcionalmente `GOOGLE_CLIENT_SECRET` se fluxo server-side no futuro); revisar exposição pública.

- **Riscos e mitigação:**

  | Risco | Mitigação |
  |-------|-----------|
  | JWT em `localStorage` vulnerável a XSS | Sanitizar inputs; CSP futura; tokens com TTL curto (ex.: 8h) |
  | Usuário autenticado vê/edita todos os grupos (sem RBAC) | Onboarding vincula usuário a grupos ([20260815-onboarding-grupos-papeis.md](./20260815-onboarding-grupos-papeis.md)); RBAC por papel ainda pendente |
  | `display_errors=1` vaza stack traces | Desligar em produção ao tocar nos endpoints (já listado em arquitetura) |
  | Conta Google e e-mail/senha com mesmo e-mail | Regra de negócio: vincular `GoogleSub` a registro existente pelo e-mail |
  | Cadastro aberto em rede pública | v1 aceita auto-cadastro; flag `CADASTRO_ABERTO=false` como evolução |

- **Próximos passos:**
  - **dba:** script `database/20260814_usuario_auth.sql` (tabela `usuario`, índices, constraints).
  - **dev-php:** `api/auth/index.php`, `api/config/auth.php`, `composer.json` + JWT, proteger recursos, atualizar `.env.example`.
  - **frontend-dev:** rotas, login/cadastro, guard, interceptor, cabeçalho, renomeação, GIS Google.
  - **arquiteto (pós-implementação):** atualizar `.cursor/docs/api.md` e `.cursor/docs/arquitetura.md`; marcar ADR como **aceita** após revisão do usuário.

- **Fora de escopo (v1):**
  - Recuperação de senha por e-mail
  - RBAC / vínculo usuário ↔ grupo ou CSA
  - Refresh token e blacklist de JWT
  - Autenticação em `test.php`
  - Renomear banco `tesouraria`, pacote npm ou pastas do repositório

- **Documento detalhado:** [autenticacao-plano-implementacao.md](../autenticacao-plano-implementacao.md)
