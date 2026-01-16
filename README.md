# Sistema de Tesouraria

Sistema PHP com Angular para gerenciamento de grupos, reuniões e despesas de grupos religiosos.

## Estrutura do Projeto

```
tesoureiro/
├── api/                    # API PHP REST
│   ├── config/
│   │   └── database.php    # Configuração do banco de dados
│   ├── grupo/
│   │   └── index.php       # Endpoints para grupos
│   ├── reuniao/
│   │   └── index.php       # Endpoints para reuniões
│   ├── csa/
│   │   └── index.php       # Endpoints para CSA
│   └── despesas/
│       └── index.php       # Endpoints para despesas
├── frontend/               # Aplicação Angular
│   └── src/
│       └── app/
│           ├── components/
│           │   ├── grupo/  # Componente de grupos
│           │   └── reuniao/# Componente de reuniões
│           └── services/
│               └── api.service.ts
├── database/
│   └── tesouraria.sql     # Script SQL do banco de dados
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
- `GET /api/grupo` - Lista todos os grupos (com nome do CSA)
- `GET /api/grupo?id={id}` - Busca um grupo específico
- `POST /api/grupo` - Cria um novo grupo
- `PUT /api/grupo` - Atualiza um grupo
- `DELETE /api/grupo?id={id}` - Deleta um grupo

**Campos do Grupo:**
- `Nome` (obrigatório)
- `Endereco` (obrigatório)
- `CSA` (obrigatório) - ID do CSA
- `Saldo` (opcional) - Saldo do grupo
- `DataSaldo` (opcional) - Data do saldo

**Reuniões:**
- `GET /api/reuniao` - Lista todas as reuniões
- `GET /api/reuniao?id={id}` - Busca uma reunião específica
- `GET /api/reuniao?IdGrupo={id}&mes={mes}&ano={ano}` - Lista reuniões com filtros
- `POST /api/reuniao` - Cria uma nova reunião
- `PUT /api/reuniao` - Atualiza uma reunião
- `DELETE /api/reuniao?id={id}` - Deleta uma reunião

**Campos da Reunião:**
- `IdGrupo` (obrigatório)
- `Data` (obrigatório)
- `Membros`, `Visitantes` (obrigatórios)
- `ValorSetima`, `ValorSetimaPix` (obrigatórios)
- `Ingresso`, `TrintaDias`, `SessentaDias`, `NoventaDias`, `SeisMeses`, `NoveMeses`, `UmAno`, `DezoitoMeses`, `MultiplosAnos` (obrigatórios)
- `FatosRelevantes` (obrigatório)

**CSA:**
- `GET /api/csa` - Lista todos os CSAs

**Despesas:**
- `GET /api/despesas` - Lista todas as despesas
- `GET /api/despesas?IdReuniao={id}` - Lista despesas de uma reunião
- `GET /api/despesas?id={id}` - Busca uma despesa específica (com comprovante)
- `POST /api/despesas` - Cria uma nova despesa
- `PUT /api/despesas` - Atualiza uma despesa
- `DELETE /api/despesas?id={id}` - Deleta uma despesa

**Campos da Despesa:**
- `IdReuniao` (obrigatório)
- `Descricao` (obrigatório)
- `ValorDespesa` (obrigatório)
- `Comprovante` (opcional) - Base64 encoded (imagem ou PDF)

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
const API_URL = 'http://localhost/tesoureiro/api';
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

### Grupos
- ✅ CRUD completo de Grupos
- ✅ Seleção de CSA via combo box
- ✅ Campos de Saldo e Data do Saldo
- ✅ Exibição do nome do CSA no grid

### Reuniões
- ✅ CRUD completo de Reuniões
- ✅ Filtros por Grupo, Mês e Ano (todos obrigatórios)
- ✅ Cálculo automático de Total de Sétima (ValorSetima + ValorSetimaPix)
- ✅ Cálculo automático de Total de Despesas
- ✅ Campos de novos membros por período
- ✅ Campo de Fatos Relevantes

### Despesas
- ✅ CRUD completo de Despesas
- ✅ Vinculação de despesas às reuniões
- ✅ Upload de comprovante (imagem ou PDF)
- ✅ Cálculo automático do total de despesas por reunião
- ✅ Gerenciamento de despesas dentro do cadastro de reunião

### Interface
- ✅ Interface moderna e responsiva
- ✅ Validação de formulários
- ✅ Formatação de datas e valores monetários
- ✅ Modais para cadastro e edição
- ✅ Confirmação antes de excluir registros
- ✅ Sem autenticação (conforme solicitado)

## Estrutura do Banco de Dados

### Tabelas Principais

**grupo**
- `Id` (PK)
- `Nome`
- `Endereco`
- `CSA` (FK para tabela csa)
- `Saldo` (decimal 12,2)
- `DataSaldo` (date, nullable)

**reuniao**
- `Id` (PK)
- `IdGrupo` (FK)
- `Data`
- `Membros`, `Visitantes`
- `ValorSetima`, `ValorSetimaPix`
- `Ingresso`, `TrintaDias`, `SessentaDias`, `NoventaDias`, `SeisMeses`, `NoveMeses`, `UmAno`, `DezoitoMeses`, `MultiplosAnos`
- `FatosRelevantes`

**despesas**
- `Id` (PK)
- `IdReuniao` (FK)
- `Descricao`
- `ValorDespesa`
- `Comprovante` (mediumblob)

**csa**
- `Id` (PK)
- `Nome`

## Tecnologias Utilizadas

- **Backend**: PHP 7.4+
- **Frontend**: Angular 17
- **Banco de Dados**: MySQL/MariaDB
- **Servidor**: InfinityFree ou XAMPP (desenvolvimento)

## Desenvolvimento

### Debug no Cursor/VS Code

O projeto inclui configuração de debug. Para debugar:

1. Pressione `F5` ou vá em Run and Debug
2. Selecione "Debug Angular App"
3. O servidor Angular será iniciado automaticamente e o Chrome abrirá em modo debug

Veja mais detalhes em `DEBUG_ANGULAR.md`

### Scripts Disponíveis

```bash
# Instalar dependências
cd frontend
npm install

# Servidor de desenvolvimento
npm start
# ou
ng serve

# Build de produção
npm run build
# ou
ng build --configuration production
```

## Notas Importantes

- Os filtros de reunião (Grupo, Mês, Ano) são obrigatórios - todos os 3 devem ser preenchidos para visualizar reuniões
- O campo CSA no cadastro de grupo é obrigatório e deve ser selecionado de uma lista
- As despesas só podem ser cadastradas após salvar a reunião
- Os comprovantes de despesas são armazenados como BLOB no banco de dados
