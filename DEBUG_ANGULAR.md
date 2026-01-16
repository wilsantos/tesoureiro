# Como Debugar Angular no Cursor

## Configuração Criada

Foram criados dois arquivos de configuração:

1. **`.vscode/launch.json`** - Configurações de debug
2. **`.vscode/tasks.json`** - Tarefa para iniciar o servidor Angular

## Como Usar

### Método 1: Debug Automático (Recomendado)

1. **Abra o painel de Debug**:
   - Pressione `F5` ou `Ctrl+Shift+D` (ou `Cmd+Shift+D` no Mac)
   - Ou clique no ícone de "Run and Debug" na barra lateral

2. **Selecione a configuração**:
   - No dropdown no topo do painel, escolha **"Debug Angular App"**

3. **Inicie o debug**:
   - Clique no botão verde de play ▶️ ou pressione `F5`
   - O Cursor irá:
     - Iniciar o servidor Angular automaticamente (`ng serve`)
     - Abrir o Chrome em modo debug
     - Conectar o debugger ao código TypeScript

4. **Coloque breakpoints**:
   - Clique na margem esquerda do editor (ao lado dos números de linha) nos arquivos `.ts`
   - Os breakpoints aparecerão como pontos vermelhos

5. **Execute o código**:
   - Quando o código atingir um breakpoint, a execução pausará
   - Você poderá inspecionar variáveis, ver o call stack, etc.

### Método 2: Attach Manual (Alternativo)

Se você já tem o Angular rodando em outro terminal:

1. **Inicie o Angular manualmente**:
   ```bash
   cd frontend
   npm start
   ```

2. **Inicie o Chrome com debug habilitado**:
   ```bash
   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

   # Mac
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

   # Linux
   google-chrome --remote-debugging-port=9222
   ```

3. **No Cursor**:
   - Selecione **"Attach to Chrome"** no dropdown de debug
   - Pressione `F5`

## Funcionalidades do Debug

- ✅ **Breakpoints**: Pause a execução em qualquer linha de código TypeScript
- ✅ **Inspeção de Variáveis**: Veja o valor de variáveis ao passar o mouse ou no painel de variáveis
- ✅ **Call Stack**: Veja a pilha de chamadas de funções
- ✅ **Watch**: Monitore expressões específicas
- ✅ **Console**: Execute código JavaScript no contexto atual

## Dicas

1. **Source Maps**: A configuração já inclui source maps, então você verá o código TypeScript original, não o JavaScript compilado

2. **Hot Reload**: O Angular tem hot reload, então mudanças no código são refletidas automaticamente

3. **Breakpoints Condicionais**: Clique com botão direito em um breakpoint para adicionar condições

4. **Logpoints**: Use `console.log()` ou adicione logpoints (breakpoints que apenas logam) sem pausar a execução

## Solução de Problemas

### O Chrome não abre
- Verifique se a porta 4200 está livre
- Certifique-se de que não há outro processo usando essa porta

### Breakpoints não funcionam
- Verifique se os source maps estão habilitados (já estão na configuração)
- Recarregue a página no Chrome
- Verifique se o código TypeScript está sendo compilado corretamente

### O servidor não inicia automaticamente
- Verifique se o `tasks.json` está configurado corretamente
- Tente iniciar manualmente: `cd frontend && npm start`

## Atalhos Úteis

- `F5` - Iniciar/Continuar debug
- `F9` - Alternar breakpoint na linha atual
- `F10` - Step Over (próxima linha)
- `F11` - Step Into (entrar na função)
- `Shift+F11` - Step Out (sair da função)
- `Ctrl+Shift+F5` - Reiniciar debug
- `Shift+F5` - Parar debug
