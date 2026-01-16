# Solução para Erro 301 (Redirecionamento)

## Problema Identificado

O erro 301 indica que o servidor está redirecionando a requisição POST para GET, fazendo com que os dados sejam perdidos.

## Soluções Aplicadas

### 1. Adicionado trailing slash (/) nas URLs
As URLs agora terminam com `/` para evitar redirecionamentos:
- `https://williamsantos82.free.nf/api/grupo/`
- `https://williamsantos82.free.nf/api/reuniao/`

### 2. Headers CORS movidos para os arquivos index.php
Os headers CORS agora são enviados diretamente nos arquivos `index.php` antes de qualquer output, evitando problemas com redirecionamentos.

### 3. Arquivos .htaccess criados
Criados arquivos `.htaccess` nas pastas para desabilitar redirecionamentos automáticos.

## Se Ainda Não Funcionar

### Opção A: Usar index.php explicitamente

Se o problema persistir, altere as URLs no `api.service.ts` para usar `index.php`:

```typescript
const API_URL = 'https://williamsantos82.free.nf/api';

// Ao invés de:
// `${API_URL}/grupo/`

// Use:
// `${API_URL}/grupo/index.php`
```

### Opção B: Verificar estrutura no servidor

Certifique-se de que a estrutura no servidor está assim:

```
public_html/
├── api/
│   ├── .htaccess
│   ├── config/
│   │   └── database.php
│   ├── grupo/
│   │   ├── .htaccess
│   │   └── index.php
│   └── reuniao/
│       ├── .htaccess
│       └── index.php
```

### Opção C: Testar diretamente no navegador

Teste a API diretamente:

1. Abra o navegador
2. Acesse: `https://williamsantos82.free.nf/api/grupo/`
3. Deve retornar um JSON (mesmo que vazio: `[]`)

### Opção D: Usar cURL para testar

No terminal (se tiver acesso):

```bash
curl -X POST https://williamsantos82.free.nf/api/grupo/ \
  -H "Content-Type: application/json" \
  -d '{"Nome":"Teste","Endereco":"Rua Teste","CSA":1}'
```

## Próximos Passos

1. Faça upload dos arquivos atualizados para o servidor
2. Faça um novo build do frontend
3. Teste novamente
4. Verifique no Console (F12) se ainda há erro 301

Se o erro 301 persistir mesmo com trailing slash, provavelmente é uma configuração do InfinityFree. Nesse caso, use a **Opção A** (index.php explícito).
