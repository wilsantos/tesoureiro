# Sistema de Tesouraria

Sistema PHP com Angular para gerenciamento de grupos e reuniões.

## Estrutura do Projeto

```
tesouraria/
├── api/                    # API PHP REST
│   ├── config/
│   │   └── database.php    # Configuração do banco de dados
│   ├── grupo/
│   │   └── index.php       # Endpoints para grupos
│   └── reuniao/
│       └── index.php       # Endpoints para reuniões
├── frontend/               # Aplicação Angular
│   └── src/
│       └── app/
└── README.md
```

## Configuração

### 1. Banco de Dados

Edite o arquivo `api/config/database.php` e configure as credenciais do banco de dados:

```php
private $host = 'sql203.infinityfree.com';
private $db_name = 'if0_40900505_db_tesouraria';
private $username = 'if0_40900505';
private $password = 'SUA_SENHA_AQUI';
```

### 2. API PHP

A API já está configurada com CORS para permitir requisições do frontend Angular.

#### Endpoints disponíveis:

**Grupos:**
- `GET /api/grupo` - Lista todos os grupos
- `GET /api/grupo?id={id}` - Busca um grupo específico
- `POST /api/grupo` - Cria um novo grupo
- `PUT /api/grupo` - Atualiza um grupo
- `DELETE /api/grupo?id={id}` - Deleta um grupo

**Reuniões:**
- `GET /api/reuniao` - Lista todas as reuniões
- `GET /api/reuniao?id={id}` - Busca uma reunião específica
- `GET /api/reuniao?IdGrupo={id}` - Lista reuniões de um grupo
- `POST /api/reuniao` - Cria uma nova reunião
- `PUT /api/reuniao` - Atualiza uma reunião
- `DELETE /api/reuniao?id={id}` - Deleta uma reunião

### 3. Frontend Angular

1. Instale as dependências:
```bash
cd frontend
npm install
```

2. Configure a URL da API no arquivo `src/app/services/api.service.ts`:
```typescript
const API_URL = 'https://seu-dominio.infinityfreeapp.com/api';
```

3. Para desenvolvimento local, altere para:
```typescript
const API_URL = 'http://localhost/tesouraria/api';
```

4. Execute o servidor de desenvolvimento:
```bash
ng serve
```

5. Para produção, faça o build:
```bash
ng build --configuration production
```

Os arquivos gerados estarão em `frontend/dist/tesouraria/`

## Publicação no InfinityFree

### API
1. Faça upload da pasta `api/` para o servidor InfinityFree
2. Certifique-se de que a senha do banco de dados está configurada corretamente
3. Teste os endpoints usando um cliente REST (Postman, Insomnia, etc.)

### Frontend
1. Faça o build de produção do Angular:
```bash
cd frontend
ng build --configuration production
```

2. Faça upload dos arquivos de `frontend/dist/tesouraria/` para o servidor InfinityFree
3. Certifique-se de atualizar a URL da API no `api.service.ts` antes do build para apontar para o domínio de produção

## Funcionalidades

- ✅ CRUD completo de Grupos
- ✅ CRUD completo de Reuniões
- ✅ Filtro de reuniões por grupo
- ✅ Interface moderna e responsiva
- ✅ Validação de formulários
- ✅ Sem autenticação (conforme solicitado)

## Tecnologias Utilizadas

- **Backend**: PHP 7.4+
- **Frontend**: Angular 17
- **Banco de Dados**: MySQL
- **Servidor**: InfinityFree
