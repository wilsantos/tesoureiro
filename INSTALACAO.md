# Instalação — Docker + PostgreSQL

Guia para subir o **Tesoureiro** em ambiente local ou servidor com **Docker** e **PostgreSQL 16+**.

O projeto não inclui container de banco: o PostgreSQL roda **fora** do `docker compose` (instância local, container dedicado ou servidor remoto).

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, macOS ou Linux)
- PostgreSQL 16+ acessível pela rede (porta `5432`)
- Node.js 18+ e npm (para build do frontend e desenvolvimento com hot-reload)
- Git

---

## Visão geral

| Componente | Função |
|------------|--------|
| `gateway` | Nginx na porta `APP_PORT` — roteia `/api` para a API e `/` para o frontend |
| `api` | PHP 8.2 + Apache — API REST |
| `frontend` | Nginx servindo o build estático em `frontend/publish` |
| PostgreSQL | Banco externo — configurado via `.env` |

URL padrão após subir: **http://localhost:8099** (ou a porta definida em `APP_PORT`).

---

## 1. Clonar e configurar o ambiente

```bash
git clone <url-do-repositorio> tesoureiro
cd tesoureiro
cp .env.example .env
```

Edite o `.env` com as credenciais do PostgreSQL e autenticação:

```env
DB_HOST=host.docker.internal
DB_PORT=5432
DB_NAME=tesouraria
DB_USER=tesoureiro
DB_PASSWORD=sua_senha_segura

APP_PORT=8099

JWT_SECRET=gere_um_valor_longo_e_aleatorio
JWT_TTL_SECONDS=28800
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
CADASTRO_ABERTO=true
```

| Variável | Descrição |
|----------|-----------|
| `DB_HOST` | Host do PostgreSQL. Na mesma máquina que o Docker: `host.docker.internal`. Em servidor remoto: IP ou hostname. |
| `DB_PORT` | Porta do PostgreSQL (padrão `5432`) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Credenciais do banco |
| `APP_PORT` | Porta exposta do gateway |
| `JWT_SECRET` | Chave para assinar tokens JWT (obrigatório) |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Web do Google (login com Google) |
| `CADASTRO_ABERTO` | `true` permite cadastro de novos usuários |

A API lê essas variáveis automaticamente no Docker. Não commite o `.env`.

---

## 2. Criar o banco PostgreSQL

Crie o usuário e o banco (ajuste senha conforme o `.env`):

```sql
CREATE USER tesoureiro WITH PASSWORD 'sua_senha_segura';
CREATE DATABASE tesouraria OWNER tesoureiro;
```

Se o PostgreSQL estiver em um container Docker (ex.: `shared-postgres`):

```bash
docker exec -it shared-postgres psql -U postgres -c "CREATE USER tesoureiro WITH PASSWORD 'sua_senha_segura';"
docker exec -it shared-postgres psql -U postgres -c "CREATE DATABASE tesouraria OWNER tesoureiro;"
```

---

## 3. Aplicar schema e migrações

Execute os scripts **nesta ordem** no banco `tesouraria`.

### 3.1 Schema base

```bash
# Linux/macOS (psql local)
psql -h localhost -U tesoureiro -d tesouraria -f docker/postgres/init/01-schema.sql
psql -h localhost -U tesoureiro -d tesouraria -f docker/postgres/init/02-sequences.sql
```

```powershell
# Windows — PostgreSQL em container Docker
Get-Content docker\postgres\init\01-schema.sql | docker exec -i shared-postgres psql -U tesoureiro -d tesouraria
Get-Content docker\postgres\init\02-sequences.sql | docker exec -i shared-postgres psql -U tesoureiro -d tesouraria
```

### 3.2 Migrações incrementais

```bash
psql -h localhost -U tesoureiro -d tesouraria -f database/20260814_usuario_auth.sql
psql -h localhost -U tesoureiro -d tesouraria -f database/20260815_usuario_grupo_onboarding.sql
psql -h localhost -U tesoureiro -d tesouraria -f database/20260815_csr_csa_bmlt.sql
```

No PowerShell com container Docker, substitua `psql ... -f arquivo` por:

```powershell
Get-Content database\20260814_usuario_auth.sql | docker exec -i shared-postgres psql -U tesoureiro -d tesouraria
Get-Content database\20260815_usuario_grupo_onboarding.sql | docker exec -i shared-postgres psql -U tesoureiro -d tesouraria
Get-Content database\20260815_csr_csa_bmlt.sql | docker exec -i shared-postgres psql -U tesoureiro -d tesouraria
```

Cada migração tem um arquivo `*_rollback.sql` correspondente em `database/`, caso precise reverter.

---

## 4. Importar CSRs e CSAs do BMLT

Após a migração `20260815_csr_csa_bmlt.sql`, importe a hierarquia oficial de estruturas de serviço da ABNA.

**Fonte:** `https://bmlt.na.org.br/ativo/main_server/client_interface/json/?switcher=GetServiceBodies`

- `type: "RS"` → tabela `csr` (Comunidade de Serviço Regional)
- `type: "AS"` → tabela `csa`, vinculada ao CSR pelo `parent_id` do JSON

### Simular (sem gravar)

```bash
docker compose exec api php /var/www/html/scripts/import-bmlt-csr-csa.php --dry-run
```

### Importar

```bash
docker compose exec api php /var/www/html/scripts/import-bmlt-csr-csa.php
```

A importação é **idempotente** — pode ser executada novamente para atualizar nomes e metadados. CSAs seed legados (ex.: `CSA ABC`) são vinculados automaticamente por similaridade de nome.

Detalhes da modelagem: [docs/decisoes/20260815-importacao-bmlt-csr-csa.md](docs/decisoes/20260815-importacao-bmlt-csr-csa.md).

> **Nota:** após alterar `api/config/bmlt-import.php` ou `api/scripts/import-bmlt-csr-csa.php`, reconstrua a imagem da API (`docker compose build api`) ou use `docker-compose.dev.yml`, que monta `./api` como volume.

---

## 5. Build do frontend e subir os containers

### 5.1 Build de produção do Angular

```bash
cd frontend
npm install
npm run build
```

Copie o artefato para a pasta servida pelo Docker:

```bash
# Linux/macOS
mkdir -p ../frontend/publish
cp -r dist/tesouraria/browser/* ../frontend/publish/
```

```powershell
# Windows
New-Item -ItemType Directory -Force -Path ..\frontend\publish
Copy-Item -Recurse -Force dist\tesouraria\browser\* ..\frontend\publish\
```

### 5.2 Subir a aplicação

Na raiz do projeto:

```bash
docker compose up -d --build
```

Verifique:

- **Aplicação:** http://localhost:8099
- **API:** http://localhost:8099/api/test.php
- **Grupos (autenticado):** http://localhost:8099/api/grupo/

```bash
docker compose ps
docker compose logs -f
```

---

## 6. Desenvolvimento com hot-reload

Para alterar a API sem rebuild a cada mudança:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

O `docker-compose.dev.yml` monta `./api` como volume no container da API.

Em outro terminal, inicie o Angular com proxy para o gateway:

```bash
cd frontend
npm install
npm start
```

- **Frontend (dev):** http://localhost:4200 — requisições `/api` são proxy para `http://localhost:8099`
- **API via gateway:** http://localhost:8099/api/

A URL da API está em `frontend/src/environments/environment.ts` (`apiUrl: '/api'`). Não é necessário alterar código ao usar o proxy.

---

## 7. Login com Google

Configure o Client ID OAuth (tipo **Web application**) no Google Cloud Console e alinhe com o `.env` e o build do frontend.

Checklist completo: [docs/operacao/google-login-producao.md](docs/operacao/google-login-producao.md).

Resumo:

1. `GOOGLE_CLIENT_ID` no `.env` (mesmo valor do Console)
2. `googleClientId` em `frontend/src/environments/environment.production.ts`
3. **Authorized JavaScript origins** no Console: `http://localhost:8099` (e a URL de produção, se houver)
4. Rebuild do frontend e `docker compose up -d --build api` após mudar variáveis

---

## 8. Verificação

1. Acesse http://localhost:8099 — a página de login deve carregar
2. Cadastre um usuário (com `CADASTRO_ABERTO=true`) ou entre com Google
3. Complete o onboarding (vínculo com grupos/CSAs)
4. Teste CRUD de grupos e reuniões

Teste rápido da API (requer token JWT após login):

```bash
curl -s http://localhost:8099/api/test.php
```

---

## Solução de problemas

### Porta já em uso

Altere `APP_PORT` no `.env` (ex.: `8098`) e suba novamente:

```bash
docker compose up -d
```

No Windows, identifique o processo na porta:

```powershell
netstat -ano | findstr :8099
```

### Erro de conexão com o banco

- Confirme que o PostgreSQL está rodando e aceita conexões
- Com Docker no Windows/Mac, use `DB_HOST=host.docker.internal` para banco na máquina host
- Teste credenciais: `docker exec -it <container-postgres> psql -U tesoureiro -d tesouraria`
- Veja logs da API: `docker compose logs api`

### Página em branco ou 404 no frontend

- Confirme que `frontend/publish` contém os arquivos do build (`index.html`, `*.js`, `*.css`)
- Refaça o build e a cópia (seção 5.1)

### Login Google não funciona

Siga [docs/operacao/google-login-producao.md](docs/operacao/google-login-producao.md). Causas comuns: Client ID divergente entre frontend e backend, origem não autorizada no Console, ou build sem `--configuration production`.

### Importação BMLT falha

- Confirme que `database/20260815_csr_csa_bmlt.sql` foi aplicada (`SELECT to_regclass('public.csr');` deve retornar `csr`)
- Teste com `--dry-run` antes da importação real
- Verifique conectividade do container com a internet: `docker compose exec api curl -I https://bmlt.na.org.br`

### API retorna 401 em todos os endpoints

Endpoints de domínio exigem autenticação JWT. Faça login em `/login` ou use `POST /api/auth/login`. Exceções: `auth`, `test.php`.

---

## Comandos úteis

```bash
# Parar containers
docker compose down

# Rebuild após mudanças em Dockerfile ou dependências PHP
docker compose up -d --build

# Shell no container da API
docker compose exec api bash

# Reimportar CSRs/CSAs do BMLT
docker compose exec api php /var/www/html/scripts/import-bmlt-csr-csa.php

# Logs em tempo real
docker compose logs -f api gateway
```

---

## Referências

- Arquitetura e endpoints: [README.md](README.md), [.cursor/docs/arquitetura.md](.cursor/docs/arquitetura.md)
- Migrações SQL: pasta `database/`
- ADR importação BMLT: [docs/decisoes/20260815-importacao-bmlt-csr-csa.md](docs/decisoes/20260815-importacao-bmlt-csr-csa.md)
- ADR autenticação: [docs/decisoes/20260814-autenticacao-simples.md](docs/decisoes/20260814-autenticacao-simples.md)
