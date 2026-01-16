# Instruções de Instalação - InfinityFree

## Passo a Passo

### 1. Configurar o Banco de Dados

Edite o arquivo `api/config/database.php` e preencha a senha do banco de dados:

```php
private $password = 'SUA_SENHA_AQUI';
```

### 2. Publicar a API

1. Faça upload de toda a pasta `api/` para o seu servidor InfinityFree
2. A estrutura no servidor deve ser:
   ```
   public_html/
   └── api/
       ├── config/
       │   └── database.php
       ├── grupo/
       │   └── index.php
       └── reuniao/
           └── index.php
   ```

3. Teste a API acessando:
   - `https://williamsantos82.free.nf/api/grupo`
   - `https://williamsantos82.free.nf/api/reuniao`

### 3. Publicar o Frontend Angular

1. Instale as dependências do Angular (localmente ou no servidor):
```bash
cd frontend
npm install
```

2. **IMPORTANTE**: Antes de fazer o build, edite `frontend/src/app/services/api.service.ts`:

```typescript
const API_URL = 'https://seu-dominio.infinityfreeapp.com/api';
```

3. Gere o build de produção:
```bash
cd frontend
ng build --configuration production
```

4. Faça upload de todos os arquivos de `frontend/dist/tesouraria/` para o servidor InfinityFree.

5. A estrutura no servidor deve ser:
   ```
   public_html/
   ├── api/
   ├── index.html
   ├── favicon.ico
   ├── main-[hash].js
   ├── polyfills-[hash].js
   ├── styles-[hash].css
   └── ... (outros arquivos do build)
   ```

6. Certifique-se de que o arquivo `.htaccess` foi copiado para a raiz do `public_html`.

### 4. Testes

1. Acesse `https://seu-dominio.infinityfreeapp.com`
2. Verifique se a página carrega corretamente
3. Teste criar, editar e excluir grupos
4. Teste criar, editar e excluir reuniões

## Solução de Problemas

### Erro de CORS
Se houver problemas de CORS, verifique se os headers estão configurados corretamente em `api/config/database.php`.

### Erro 404 no Angular
Certifique-se de que o arquivo `.htaccess` está na raiz do `public_html` e que o mod_rewrite está habilitado no servidor.

### Erro de conexão com o banco
Verifique:
- A senha do banco está correta em `api/config/database.php`
- O nome do banco está correto
- O usuário do banco está correto
- O servidor permite conexões do PHP ao MySQL

### Angular não conecta com a API
Verifique se a URL da API em `api.service.ts` está correta e apontando para o domínio de produção.

## Desenvolvimento Local

Para desenvolver localmente:

1. Configure o XAMPP para servir a pasta `api/` em `http://localhost/tesouraria/api`

2. No `frontend/src/app/services/api.service.ts`, use:
```typescript
const API_URL = 'http://localhost/tesouraria/api';
```

3. Execute o Angular:
```bash
cd frontend
npm install
ng serve
```

4. Acesse `http://localhost:4200`
