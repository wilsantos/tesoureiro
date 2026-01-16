# Guia de Debug - Sistema de Tesouraria

## Como Verificar Logs no InfinityFree

O InfinityFree não fornece acesso direto a logs de erro via interface web. Siga estes passos:

### 1. Teste Direto da API

Acesse diretamente no navegador ou use uma ferramenta como Postman:

- **Teste de conexão**: `https://williamsantos82.free.nf/api/test.php`
  - Este arquivo verifica se a conexão com o banco está funcionando

- **Listar grupos**: `https://williamsantos82.free.nf/api/grupo`
  - Deve retornar um JSON (mesmo que vazio: `[]`)

- **Listar reuniões**: `https://williamsantos82.free.nf/api/reuniao`
  - Deve retornar um JSON (mesmo que vazio: `[]`)

### 2. Verificar Erros no Console do Navegador

1. Abra o site: `https://williamsantos82.free.nf`
2. Pressione **F12** (ou clique com botão direito → Inspecionar)
3. Vá na aba **Console**
4. Tente criar um grupo/reunião
5. Veja se aparecem erros em vermelho

### 3. Verificar Requisições na Aba Network

1. Com o DevTools aberto (F12), vá na aba **Network** (Rede)
2. Tente criar um grupo
3. Procure pela requisição para `/api/grupo` ou `/api/reuniao`
4. Clique na requisição e veja:
   - **Status**: Deve ser 201 (criado) ou 200 (sucesso)
   - **Response**: Veja a resposta do servidor
   - **Payload**: Veja os dados que foram enviados

### 4. Problemas Comuns

#### A. Erro 500 (Internal Server Error)
- **Causa**: Problema na conexão com banco ou erro PHP
- **Solução**: 
  1. Verifique `api/config/database.php` - senha e host corretos?
  2. Acesse `https://williamsantos82.free.nf/api/test.php` para testar

#### B. Erro 404 (Not Found)
- **Causa**: Arquivo não encontrado
- **Solução**: Verifique se os arquivos foram enviados corretamente para o servidor

#### C. Erro CORS
- **Causa**: Headers CORS não configurados
- **Solução**: Os headers já estão configurados em `api/config/database.php`

#### D. "Gravou com sucesso" mas não aparece nada
- **Causa provável**: 
  1. A requisição retorna sucesso mas há erro no banco
  2. Os dados não estão sendo recarregados após salvar
  3. Erro silencioso na API

- **Como verificar**:
  1. Abra o Console (F12)
  2. Veja a aba Network
  3. Verifique a resposta da API ao salvar
  4. Veja se há erros em vermelho no console

### 5. Verificar Banco de Dados Diretamente

1. Acesse o painel do InfinityFree
2. Vá em "MySQL Databases"
3. Clique em "phpMyAdmin"
4. Verifique se os dados estão sendo salvos nas tabelas

### 6. Testar API com cURL

Se tiver acesso ao terminal, teste com:

```bash
curl -X POST https://williamsantos82.free.nf/api/grupo \
  -H "Content-Type: application/json" \
  -d '{"Nome":"Teste","Endereco":"Rua Teste","CSA":1}'
```

### 7. Arquivo de Teste

Acesse `https://williamsantos82.free.nf/api/test.php` - este arquivo:
- Testa a conexão com o banco
- Verifica se as tabelas existem
- Mostra quantos registros há em cada tabela

## Checklist de Problemas

- [ ] Arquivo `api/config/database.php` tem as credenciais corretas?
- [ ] Arquivos da API foram enviados para `public_html/api/`?
- [ ] Arquivos do frontend estão na raiz do `public_html/`?
- [ ] URL da API em `api.service.ts` está correta?
- [ ] O arquivo `.htaccess` está na raiz do `public_html/`?
- [ ] Console do navegador mostra erros?
- [ ] Aba Network mostra requisições com status 200/201?

## Próximos Passos

Se ainda tiver problemas, verifique:

1. **Console do navegador** - sempre comece por aqui
2. **Aba Network** - veja o que a API está retornando
3. **Arquivo test.php** - verifique conexão com banco
4. **phpMyAdmin** - veja se dados estão no banco
