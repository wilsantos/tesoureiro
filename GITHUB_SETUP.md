# Como Fazer Push para o GitHub

O commit foi criado com sucesso! Agora você precisa fazer autenticação para fazer o push.

## Opção 1: Usar Token de Acesso Pessoal (Recomendado)

1. **Criar um Token no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê um nome para o token (ex: "tesoureiro")
   - Selecione o escopo `repo` (marcar todas as opções de repo)
   - Clique em "Generate token"
   - **COPIE O TOKEN** (você só verá ele uma vez!)

2. **Fazer o push usando o token:**
   ```bash
   git push -u origin main
   ```
   
   Quando pedir usuário, digite seu username do GitHub
   Quando pedir senha, **cole o token** (não use sua senha do GitHub)

## Opção 2: Usar GitHub CLI (gh)

Se você tem o GitHub CLI instalado:
```bash
gh auth login
git push -u origin main
```

## Opção 3: Configurar SSH (Mais seguro a longo prazo)

1. Gerar chave SSH (se ainda não tiver):
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
   ```

2. Copiar a chave pública:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. Adicionar no GitHub:
   - Acesse: https://github.com/settings/keys
   - Clique em "New SSH key"
   - Cole a chave pública

4. Alterar a URL do remote:
   ```bash
   git remote set-url origin git@github.com:wilsantos/tesoureiro.git
   git push -u origin main
   ```

## O que já foi feito:

✅ Repositório Git inicializado
✅ Arquivos adicionados ao staging
✅ Commit criado com 32 arquivos
✅ Remote configurado para https://github.com/wilsantos/tesoureiro.git
✅ Branch renomeada para `main`

## Importante:

- O arquivo `api/config/database.php` **NÃO** foi commitado (está no .gitignore)
- Um arquivo `database.example.php` foi criado como exemplo
- Node modules e arquivos de build também não foram commitados

## Próximo passo:

Execute o push usando uma das opções acima!
