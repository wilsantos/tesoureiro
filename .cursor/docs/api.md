# Referência da API REST — Tesoureiro

Base: `{host}/api/{recurso}/`

Todas as respostas JSON usam `Content-Type: application/json; charset=utf-8`.  
Todos os endpoints respondem a `OPTIONS` com HTTP 200 (preflight CORS).

---

## Grupos — `/api/grupo/`

### GET — Listar ou buscar

| Cenário | URL | Resposta |
|---------|-----|----------|
| Listar todos | `GET /api/grupo/` | Array de grupos com `CSA_Nome` (JOIN) |
| Buscar por ID | `GET /api/grupo/?id={id}` | Objeto grupo ou `404` |

**Campos retornados (listagem/detalhe):**

`Id`, `Nome`, `Endereco`, `CSA`, `Saldo`, `DataSaldo`, `CSA_Nome`

Ordenação na listagem: `Nome` ascendente.

### POST — Criar

**Corpo JSON:**

| Campo | Obrigatório | Tipo | Default |
|-------|-------------|------|---------|
| `Nome` | sim | string | — |
| `Endereco` | sim | string | — |
| `CSA` | sim | integer | — |
| `Saldo` | não | number | `0` |
| `DataSaldo` | não | string (date) ou vazio | `null` |

**Respostas:**

- `201`: `{ "message": "Grupo criado com sucesso", "id": <novo_id> }`
- `400`: `{ "message": "Dados incompletos", "received": {...} }` ou JSON inválido
- `500`: erro de banco

### PUT — Atualizar

**Corpo JSON:**

| Campo | Obrigatório |
|-------|-------------|
| `Id` | sim |
| `Nome` | sim |
| `Endereco` | sim |
| `CSA` | sim |
| `Saldo` | não (default `0`) |
| `DataSaldo` | não |

**Resposta:** `{ "message": "Grupo atualizado com sucesso" }`

### DELETE — Excluir

`DELETE /api/grupo/?id={id}`

**Resposta:** `{ "message": "Grupo deletado com sucesso" }`

---

## Reuniões — `/api/reuniao/`

### GET — Listar ou buscar

| Cenário | URL |
|---------|-----|
| Listar todas | `GET /api/reuniao/` |
| Com filtros | `GET /api/reuniao/?IdGrupo={id}&mes={1-12}&ano={yyyy}` |
| Buscar por ID | `GET /api/reuniao/?id={id}` |

Filtros `IdGrupo`, `mes` e `ano` são **independentes** na API (combináveis). O frontend exige os três preenchidos.

Listagem com filtros inclui `NomeGrupo` (LEFT JOIN). Ordenação: `Data` descendente.

### POST — Criar

**Campos obrigatórios no JSON:**

`IdGrupo`, `Data`, `Membros`, `Visitantes`, `ValorSetima`, `ValorSetimaPix`, `Ingresso`, `TrintaDias`, `SessentaDias`, `NoventaDias`, `SeisMeses`, `NoveMeses`, `UmAno`, `DezoitoMeses`, `MultiplosAnos`, `FatosRelevantes`

**Campo opcional:**

| Campo | Default na API |
|-------|----------------|
| `VendaLiteratura` | `0` |

**Resposta:** `201` com `{ "message": "Reunião criada com sucesso", "id": <id> }`

Em caso de campos ausentes: `400` com `{ "message": "Campos obrigatórios ausentes", "missing": [...] }`

### PUT — Atualizar

Mesmos campos obrigatórios do POST, mais `Id` obrigatório.

### DELETE — Excluir

`DELETE /api/reuniao/?id={id}`

---

## CSA — `/api/csa/`

Somente leitura.

### GET — Listar

`GET /api/csa/`

Retorna array: `[{ "Id": 1, "Nome": "..." }, ...]` ordenado por `Nome`.

Outros métodos retornam `405`.

---

## Despesas — `/api/despesas/`

### GET — Listar ou buscar

| Cenário | URL | Observação |
|---------|-----|------------|
| Todas | `GET /api/despesas/` | Listagem padrão |
| Por reunião | `GET /api/despesas/?IdReuniao={id}` | Despesas de uma reunião |
| Por ID | `GET /api/despesas/?id={id}` | Mesmos campos da listagem |

**Campos retornados:** `Id`, `IdReuniao`, `Descricao`, `ValorDespesa`, `repasse`, `compra_literatura` (booleanos)

> Comprovantes fora do escopo da v1 — ver [ADR](../../docs/decisoes/20260815-comprovantes-fora-escopo-v1.md).

### POST — Criar

| Campo | Obrigatório | Tipo | Default |
|-------|-------------|------|---------|
| `IdReuniao` | sim | integer | — |
| `Descricao` | sim | string | — |
| `ValorDespesa` | sim | number | — |
| `repasse` | não | boolean | `false` |
| `compra_literatura` | não | boolean | `false` |

**Resposta:** `201` com `{ "message": "Despesa criada com sucesso", "id": <id> }`

### PUT — Atualizar

| Campo | Obrigatório |
|-------|-------------|
| `Id` | sim |
| `IdReuniao` | sim |
| `Descricao` | sim |
| `ValorDespesa` | sim |
| `repasse` | não (default `false`) |
| `compra_literatura` | não (default `false`) |

### DELETE — Excluir

`DELETE /api/despesas/?id={id}`

---

## Relatórios — `/api/relatorios/`

Somente `GET`. Parâmetros via query string.

### Saldo acumulado

```
GET /api/relatorios/?tipo=saldo-acumulado&IdGrupo={id}&mes={mes}&ano={ano}
```

Calcula saldo do grupo ao longo do mês, partindo do saldo inicial (`grupo.Saldo` / `DataSaldo`) e acumulando `(ValorSetima + ValorSetimaPix + VendaLiteratura) - despesas` por reunião.

**Resposta:**

```json
{
  "grupoId": 1,
  "dataInicial": "2026-08-01",
  "dataFinal": "2026-08-31",
  "saldoInicial": 0.00,
  "saldoFinal": 150.00,
  "saldoPorData": [
    {
      "data": "2026-08-01",
      "saldo": 0.00,
      "tipo": "saldo_inicial"
    },
    {
      "data": "2026-08-10",
      "saldo": 150.00,
      "setimaDinheiro": 100.00,
      "setimaPix": 50.00,
      "vendaLiteratura": 0.00,
      "total": 150.00,
      "despesas": 0.00,
      "saldo_dia": 150.00,
      "tipo": "transacao"
    }
  ]
}
```

### Relatório geral

```
GET /api/relatorios/?tipo=geral&IdGrupo={id}&mes={mes}&ano={ano}
```

**Resposta:**

```json
{
  "tipo": "geral",
  "grupo": "Nome do Grupo",
  "mes": 8,
  "ano": 2026,
  "totais": {
    "TotalReunioes": 4,
    "TotalMembros": 120,
    "TotalVisitantes": 15,
    "TotalSetimaMes": 500.00,
    "TotalSetimaPixMes": 200.00,
    "TotalDespesasMes": 100.00,
    "TotalRepasseMes": 50.00,
    "TotalCompraLiteraturaMes": 30.00,
    "TotalIngresso": 2,
    "TotalTrintaDias": 1,
    "TotalSessentaDias": 0,
    "TotalNoventaDias": 0,
    "TotalSeisMeses": 0,
    "TotalNoveMeses": 0,
    "TotalUmAno": 0,
    "TotalDezoitoMeses": 0,
    "TotalMultiplosAnos": 0
  }
}
```

### Relatório detalhado

```
GET /api/relatorios/?tipo=detalhado&IdGrupo={id}&mes={mes}&ano={ano}
```

**Resposta:**

```json
{
  "tipo": "detalhado",
  "grupo": "Nome do Grupo",
  "mes": 8,
  "ano": 2026,
  "reunioes": [
    {
      "reuniao": { "...campos da reuniao...", "NomeGrupo": "..." },
      "despesas": [
        { "Id": 1, "Descricao": "...", "ValorDespesa": 25.00 }
      ],
      "totalSetima": 150.00,
      "totalDespesas": 25.00,
      "saldo": 125.00
    }
  ],
  "totais": {
    "TotalSetimaMes": 500.00,
    "TotalSetimaPixMes": 200.00,
    "TotalVendaLiteraturaMes": 50.00,
    "TotalSetimaGeral": 750.00,
    "TotalDespesasMes": 100.00,
    "SaldoMes": 650.00
  }
}
```

### Erros comuns

| HTTP | Condição |
|------|----------|
| `400` | Parâmetros obrigatórios ausentes ou `tipo` inválido |
| `404` | Grupo não encontrado (saldo acumulado) |
| `405` | Método diferente de GET |
| `500` | Erro PDO |

---

## Diagnóstico — `/api/test.php`

`GET /api/test.php` — resposta **text/plain**, não JSON.

Verifica conexão PDO e conta registros em `grupo` e `reuniao`.

---

## Mapeamento ApiService → endpoints

| Método Angular | HTTP | Endpoint |
|----------------|------|----------|
| `getGrupos()` | GET | `/grupo/` |
| `getGrupo(id)` | GET | `/grupo/?id=` |
| `createGrupo(data)` | POST | `/grupo/` |
| `updateGrupo(data)` | PUT | `/grupo/` |
| `deleteGrupo(id)` | DELETE | `/grupo/?id=` |
| `getReunioes(filtros?)` | GET | `/reuniao/?...` |
| `getReuniao(id)` | GET | `/reuniao/?id=` |
| `createReuniao(data)` | POST | `/reuniao/` |
| `updateReuniao(data)` | PUT | `/reuniao/` |
| `deleteReuniao(id)` | DELETE | `/reuniao/?id=` |
| `getCSAs()` | GET | `/csa/` |
| `getDespesas(idReuniao?)` | GET | `/despesas/` ou `?IdReuniao=` |
| `getDespesa(id)` | GET | `/despesas/?id=` |
| `createDespesa(data)` | POST | `/despesas/` |
| `updateDespesa(data)` | PUT | `/despesas/` |
| `deleteDespesa(id)` | DELETE | `/despesas/?id=` |
| `getRelatorio(tipo, ...)` | GET | `/relatorios/?tipo=geral\|detalhado&...` |
| `getSaldoAcumulado(...)` | GET | `/relatorios/?tipo=saldo-acumulado&...` |
