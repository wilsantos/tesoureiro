# Diagnóstico: login Google em produção

Guia operacional para deploy do **Servidor de NA** (Angular + PHP + Google Identity Services).

**Não é ADR** — decisão de arquitetura em [20260814-autenticacao-simples.md](../decisoes/20260814-autenticacao-simples.md).

---

## O que precisa estar alinhado

| Camada | Onde configurar | Valor esperado |
|--------|-----------------|----------------|
| Google Cloud Console | APIs & Services → Credentials → OAuth 2.0 Client ID (**Web application**) | Client ID termina em `.apps.googleusercontent.com` |
| Frontend (build) | `frontend/src/environments/environment.production.ts` → `googleClientId` | **Idêntico** ao Client ID do Console |
| Backend (runtime) | Variável de ambiente `GOOGLE_CLIENT_ID` (Docker: `.env` na raiz; hospedagem: painel ou `SetEnv`) | **Idêntico** ao frontend |
| Google Console | **Authorized JavaScript origins** | URL exata do site: `https://seu-dominio.com` (sem barra final) |
| Token JWT Google | Campo `aud` do `id_token` | Deve ser igual aos três itens acima |

O backend valida `aud` em `api/config/auth.php` (`validateGoogleIdToken`). Qualquer divergência → `401 Token Google inválido`.

---

## Checklist passo a passo (produção)

### 1. Confirmar URL e build do frontend

1. Abra a página de login em produção: `https://<seu-dominio>/login`.
2. Verifique se o botão **“Entrar com Google”** aparece abaixo do divisor “ou”.
   - Se aparecer a mensagem *“Configure GOOGLE_CLIENT_ID no environment…”*, o `googleClientId` está vazio no bundle — rebuild necessário.
3. No servidor (ou no artefato publicado), confira se o Client ID está no JS de produção:
   ```bash
   grep -r "apps.googleusercontent.com" frontend/dist/tesouraria/browser/
   ```
   O valor deve ser o Client ID de **produção**, não de outro ambiente.
4. Confirme que o build usou produção:
   ```bash
   cd frontend && ng build --configuration production
   ```
5. Confirme `apiUrl` em `environment.production.ts` (ex.: `/api` com gateway nginx, ou URL absoluta se API em outro host).

### 2. Confirmar backend e variáveis de ambiente

1. **Docker:** no host, `GOOGLE_CLIENT_ID` no `.env` da raiz e container recriado após alteração:
   ```bash
   docker compose up -d --build api
   ```
2. **Hospedagem compartilhada (ex. InfinityFree):** o PHP usa `getenv()` — o arquivo `.env` na raiz do repositório **não é lido automaticamente**. Configure `GOOGLE_CLIENT_ID` e `JWT_SECRET` no painel da hospedagem ou via `.htaccess` (`SetEnv`).
3. Teste indireto: login e-mail/senha em `/api/auth/login` deve funcionar se `JWT_SECRET` estiver OK. Se só o Google falha, foque em `GOOGLE_CLIENT_ID` e origens no Console.

### 3. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → projeto correto → **APIs & Services** → **Credentials**.
2. Abra o OAuth client do tipo **Web application** (não Android/iOS).
3. Em **Authorized JavaScript origins**, inclua **exatamente**:
   - `https://<host-de-producao>` (ex.: `https://williamsantos82.free.nf`)
   - Se testar em subpath, a origem ainda é só scheme + host (+ porta se não for 443/80 padrão).
4. **Não** use `http://` em produção se o site é `https://`.
5. Salve e aguarde 1–5 minutos para propagar.
6. (Opcional) Em **OAuth consent screen**, confirme que o app está em **Testing** ou **Production** e que o e-mail do usuário está autorizado se ainda em modo teste.

### 4. DevTools do navegador (aba Login)

**Console (F12 → Console)**

| Sintoma | Provável causa |
|---------|----------------|
| `Not a valid origin for the client` / `origin_mismatch` | Origem não cadastrada no Console |
| `Failed to load resource: gsi/client` | Bloqueio de rede, CSP ou firewall |
| `idpiframe_initialization_failed` | Cookies de terceiros bloqueados ou iframe bloqueado |
| Nenhum erro, mas sem botão | `googleClientId` vazio ou script GIS não inicializou |

**Network (F12 → Network)**

1. Recarregue `/login` — deve carregar `https://accounts.google.com/gsi/client` com status **200**.
2. Clique no botão Google e conclua o login.
3. Deve aparecer **POST** `.../api/auth/google` com corpo `{"idToken":"eyJ..."}`.
4. Anote o status e o JSON de resposta:
   - `401` + `"Token Google inválido"` → backend rejeitou o token (audience, expiração ou `GOOGLE_CLIENT_ID` vazio).
   - `500` → banco, `JWT_SECRET` ou exceção PHP (ver log do servidor).
   - `200` + `token` → Google OK; problema pode ser rota/guard após login.

### 5. Inspecionar o `id_token` (audience)

1. No Network, copie o valor de `idToken` do POST (ou o credential do callback GIS).
2. Cole em [jwt.io](https://jwt.io) (apenas payload; não compartilhe token em canais públicos).
3. No payload, confira:
   - `aud` = Client ID esperado
   - `email_verified`: `true`
   - `exp`: timestamp futuro
4. Se `aud` ≠ `GOOGLE_CLIENT_ID` do servidor → alinhar frontend, backend e Console.

### 6. Teste manual do endpoint (opcional)

Com um `id_token` válido obtido no passo 5 (válido ~1h):

```bash
curl -s -X POST "https://<seu-dominio>/api/auth/google" \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<cole-o-token-aqui>"}'
```

- Resposta `200` com `token` → backend e Google OK.
- Resposta `401` → validação falhou no PHP (`validateGoogleIdToken`).

### 7. Ordem de diagnóstico recomendada

```
Botão aparece? ──não──► environment / build / gsi/client
      │
     sim
      ▼
Erro no Console (origin)? ──sim──► Authorized JavaScript origins
      │
     não
      ▼
POST /auth/google 401? ──sim──► aud vs GOOGLE_CLIENT_ID / token expirado
      │
     não (200)
      ▼
Problema pós-login (router, onboarding, JWT no localStorage)
```

---

## Erros mais comuns

### 1. Origem JavaScript não autorizada

- **Sintoma:** botão não renderiza ou Console com `origin_mismatch` / `Not a valid origin`.
- **Causa:** domínio de produção ausente ou diferente (http vs https, `www` vs sem `www`, porta explícita).
- **Correção:** adicionar origem exata no OAuth client Web; aguardar propagação.

### 2. Client ID diferente entre frontend e backend

- **Sintoma:** botão funciona, login Google abre, POST retorna `401 Token Google inválido`.
- **Causa:** `environment.production.ts` com um ID e `GOOGLE_CLIENT_ID` no servidor com outro (ou vazio).
- **Correção:** mesmo Client ID nos três lugares; rebuild frontend; reiniciar API.

### 3. `GOOGLE_CLIENT_ID` não disponível no PHP em produção

- **Sintoma:** `401` ou erro interno; em log PHP: `GOOGLE_CLIENT_ID não configurado`.
- **Causa:** `.env` só na máquina local; hospedagem sem variável injetada.
- **Correção:** configurar env no painel Docker/hospedagem; não depender do arquivo `.env` no repo sem loader.

### 4. Build de desenvolvimento publicado em produção

- **Sintoma:** comportamento inconsistente; Client ID de dev ou `production: false`.
- **Causa:** `ng build` sem `--configuration production` ou cache antigo em `frontend/publish`.
- **Correção:** build production, republicar `dist/tesouraria/browser/`.

### 5. OAuth client errado (Android/iOS ou outro projeto GCP)

- **Sintoma:** GIS falha na inicialização ou `aud` no token não bate com o esperado.
- **Causa:** Client ID copiado de credencial não-Web ou de outro projeto Google Cloud.
- **Correção:** criar/usar **Web application** no projeto correto; atualizar frontend e backend.

---

## Referências no código

- Frontend GIS: `frontend/src/app/auth/login/login.component.ts`
- Validação token: `api/config/auth.php` → `validateGoogleIdToken()`
- Endpoint: `POST /api/auth/google` → `api/auth/index.php`
- ADR: `docs/decisoes/20260814-autenticacao-simples.md`

---

## Melhorias futuras (fora deste guia)

- Externalizar `googleClientId` via variável no build CI (evitar hardcode).
- Endpoint de health `GET /api/auth/config` retornando `{ googleConfigured: true }` (sem expor o ID).
- Carregar `.env` no PHP apenas em dev (não substituir env do servidor em produção).
