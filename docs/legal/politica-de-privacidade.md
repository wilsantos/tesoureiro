# Política de Privacidade

**Servidor de NA**  
Versão 1.0 — vigência a partir de **16 de agosto de 2026**

> **Aviso:** esta política explica, em linguagem clara, como dados pessoais podem ser tratados nesta instância do aplicativo. Não substitui assessoria jurídica nem dispensa o cumprimento da Lei nº 13.709/2018 (LGPD) pelo operador da instância. Dúvidas sobre os seus dados: fale com o **administrador desta instância**.

---

## 1. Quem é o controlador

1.1. O **Servidor de NA** é um aplicativo de tesouraria para grupos de Narcóticos Anônimos. Pode ser instalado por diferentes operadores (auto-hospedagem em Docker, ambiente local, hospedagem compartilhada ou outro meio).

1.2. O **controlador** dos dados pessoais, nos termos da LGPD, é quem **opera esta instância**: a pessoa física, o grupo de servidores ou o corpo de serviço que a disponibiliza neste endereço. Não há, neste documento, razão social, CNPJ ou encarregado (DPO) fictícios.

1.3. Se você não souber quem administra a instalação, pergunte a quem lhe enviou o link ou aos servidores de confiança do seu grupo.

## 2. Esta política não descreve um cadastro de membros

2.1. O aplicativo **não** é uma lista de membros em recuperação e **não** se destina a guardar nomes de addicts.

2.2. As **reuniões** registram contagens (quantos membros, visitantes, faixas de tempo limpo) e valores da 7ª Tradição, não a identidade de quem esteve presente.

2.3. Ainda assim, o **endereço do grupo** e o campo **fatos relevantes** (texto livre) podem conter dados pessoais se alguém os digitar. Isso deve ser evitado. Ver seção 11.

## 3. Quais dados são tratados

### 3.1. Dados da sua conta

| Dado | Origem | Observação |
|------|--------|------------|
| Nome | Cadastro ou Google | Identificação no aplicativo |
| E-mail | Cadastro ou Google | Login e comunicação operacional do administrador, se houver |
| Senha | Cadastro por e-mail | Só o **hash** (Argon2id ou bcrypt) é guardado; a senha em claro não é armazenada |
| Identificador Google (`sub`) | Login Google (GIS) | Vínculo da conta Google a esta instância |
| Datas de criação e atualização | Sistema | Auditoria mínima da conta |
| Último acesso | Sistema | Usado em regras de vínculo com grupos (por exemplo, encargo ocupado) |

Não há, na versão atual do cadastro por e-mail, foto, telefone, CPF ou endereço residencial do usuário.

### 3.2. Dados gerados no uso (após o onboarding)

Quando você vincula grupos e usa tesouraria/secretaria, a instância passa a guardar, entre outros:

- **vínculo usuário ↔ grupo** e **papel** (secretaria e/ou tesouraria);
- **grupo:** nome, endereço, CSA (Comunidade de Serviço de Área), saldo e data de saldo;
- **reunião:** data, contagens de membros e visitantes, faixas de tempo limpo, valores da 7ª Tradição (inclusive Pix, se lançado), venda de literatura, fatos relevantes em texto livre;
- **despesa:** valor, descrição e classificação (por exemplo, repasse ou compra de literatura).

Na versão atual **não** há envio de comprovantes (fotos ou PDFs de recibos) pelo aplicativo.

### 3.3. Dados de estruturas de serviço (CSA/CSR)

A escolha de CSA/CSR pode usar listas públicas do **BMLT** (nomes de comunidades e regiões de serviço). Esses registros descrevem estruturas da irmandade, não contas de usuários deste aplicativo.

### 3.4. Dados técnicos

O servidor web (Apache, Nginx ou equivalente) e a hospedagem podem registrar, nos logs, endereço IP, data e hora, página acessada e identificador do navegador. Isso é típico de qualquer site e depende da configuração feita pelo administrador da instância. O aplicativo em si autentica com JWT no `localStorage`, não com cookie de sessão próprio.

## 4. Para que os dados são usados

| Finalidade | Exemplos |
|------------|----------|
| Criar e autenticar a conta | Cadastro, login e-mail/senha, login Google, token JWT |
| Prestar o serviço de tesouraria | Grupos, reuniões, despesas, relatórios |
| Vincular servidores aos grupos | Papéis de secretaria e tesouraria; regras de encargo |
| Segurança da instância | Detectar abuso, proteger hashes de senha, expirar tokens |
| Cumprir a lei | Atender direitos do titular ou ordem legal válida |
| Operação da instalação | Backup, restauração e manutenção feitos pelo administrador |

Não utilizamos os dados da conta para publicidade de terceiros nem para vender listas de e-mails. Esta política não autoriza marketing dirigido a membros da irmandade.

## 5. Bases legais (LGPD, art. 7º)

O tratamento apoia-se, conforme o caso, em:

5.1. **Execução de contrato** (art. 7º, V): criar a conta, autenticar, manter o vínculo com grupos e operar tesouraria/secretaria — o núcleo do serviço que você solicita.

5.2. **Consentimento** (art. 7º, I): no cadastro por e-mail/senha, o checkbox de aceite destes documentos. Na versão atual o aceite é registrado **apenas no navegador** (o formulário não envia comprovante ao servidor). Isso **não substitui** o registro completo previsto no art. 8º da LGPD; a evolução prevista é gravar data e versão do texto na conta. Enquanto isso, a execução do contrato permanece a base principal da conta.

5.3. **Legítimo interesse** (art. 7º, IX), quando cabível e respeitados os direitos do titular: segurança da instância, logs técnicos mínimos, preservação do histórico de tesouraria do **grupo** (que não se confunde com ficha de membro) e sugestão de CSA/CSR a partir de listas públicas.

5.4. **Cumprimento de obrigação legal ou regulatória** (art. 7º, II), se o administrador for legalmente obrigado a conservar ou a fornecer determinado registro.

5.5. Dados eventualmente sensíveis ou relativos à saúde **não** são a finalidade do sistema. Não descreva nas telas a condição de recuperação de pessoas identificáveis. Se um texto livre revelar dado sensível de terceiro, a base legal torna-se inadequada — apague ou edite o conteúdo e avise o administrador.

## 6. Cookies e armazenamento no navegador

6.1. **JWT no `localStorage`.** Após o login, um token de acesso (algoritmo HS256) fica no armazenamento local do navegador. Não é um cookie de sessão HTTP do aplicativo. Qualquer script que rode na origem do site pode, em tese, ler esse token (risco de XSS). Não use o aplicativo em computador público sem encerrar a sessão e sem desconfiar de extensões desconhecidas.

6.2. **Cookies de terceiros.** O botão “Entrar com Google” carrega scripts da Google (Google Identity Services). A Google pode definir cookies no domínio dela, segundo a política da Google. O aplicativo não controla esses cookies.

6.3. **Banner de cookies.** Nesta versão não há banner próprio, porque o aplicativo não utiliza cookie de sessão para autenticar. Se o administrador da instância ativar outras ferramentas de medição, deverá informar à parte.

## 7. Compartilhamento e operadores

Os dados **não** são vendidos. Podem ser acessados ou processados por:

7.1. **Administrador desta instância** e quem ele autorizar para manter o servidor (backup, restauração, correção de falhas).

7.2. **Google**, se você usar o login Google: a Google trata o seu login segundo as regras dela; esta instância recebe nome, e-mail e `sub` para criar ou reconhecer a conta.

7.3. **Provedor de hospedagem** e infraestrutura (servidor, banco PostgreSQL, certificados, cópias de segurança), na medida em que o administrador os utilizar. O conteúdo armazenado nesse provedor segue o contrato entre o administrador e o provedor.

7.4. **BMLT / publicação de estruturas de serviço**, apenas no sentido inverso: a instância **consulta** listas públicas para autocomplete; não envia a sua conta nem as reuniões do grupo a esse diretório.

7.5. **Autoridades**, mediante ordem legal válida.

Outros usuários autenticados nesta instância podem ver dados de tesouraria dos grupos a que tiverem acesso operacional, conforme as regras do aplicativo. Não trate o sistema como diário pessoal.

## 8. Transferências e local de armazenamento

8.1. Os dados da tesouraria ficam no **banco e no servidor escolhidos pelo administrador** desta instância (no Brasil ou no exterior, conforme a hospedagem).

8.2. O login Google implica comunicação com servidores da Google, que podem estar fora do Brasil. Nesse caso aplicam-se as salvaguardas da Google e, no que couber, o art. 33 da LGPD. O uso do botão Google é facultativo: você pode cadastrar-se só com e-mail e senha.

## 9. Retenção

9.1. **Conta:** mantida enquanto você usar o serviço e a instância existir, ou até o administrador atender pedido de exclusão, salvo obrigação legal de conservar algum registro.

9.2. **Tesouraria do grupo:** reuniões, despesas e saldos tendem a ser conservados pelo tempo em que o grupo e a instância necessitarem de histórico (prestação de contas). A exclusão da sua conta **pode não apagar** o histórico financeiro do grupo, apenas o vínculo da sua pessoa, quando for possível separar os dois.

9.3. **Logs de servidor:** prazo definido pelo administrador ou pelo provedor (muitas vezes dias ou meses).

9.4. **Token JWT:** permanece no `localStorage` até expirar, até você sair da conta (logout) ou até limpar os dados do site no navegador.

9.5. Não há, nesta versão, comprovantes de despesa armazenados pelo aplicativo.

## 10. Direitos do titular (LGPD, art. 18)

Você pode solicitar ao **administrador desta instância**:

- confirmação da existência de tratamento;
- acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos, na medida em que a lei e o histórico do grupo permitirem;
- portabilidade, quando aplicável e tecnicamente viável nesta instância;
- informação sobre compartilhamentos;
- revogação do consentimento, quando o tratamento se basear exclusivamente nele, sem prejuízo da execução do contrato enquanto a conta existir;
- revisão de decisões automatizadas, se vierem a existir (nesta versão o aplicativo não faz perfilagem publicitária nem decisão automatizada de crédito).

Para exercer direitos, identifique-se de forma razoável (por exemplo, pelo e-mail da conta) e descreva o pedido. O administrador deve responder no prazo legal. Esta política **não** publica um e-mail de encarregado inventado: use o canal que o administrador da instância indicar.

A Autoridade Nacional de Proteção de Dados (ANPD) é o órgão fiscalizador da LGPD no Brasil.

## 11. Anonimato e texto livre

11.1. A 11ª e a 12ª Tradições de NA pedem anonimato nos meios de comunicação e humildade na prestação de contas. Use o aplicativo de modo compatível com isso.

11.2. **Não** escreva em fatos relevantes, descrições de despesa ou nome de grupo informações que identifiquem pessoas em recuperação (nome completo, apelido reconhecível, telefone, foto descrita, etc.), salvo se o seu grupo, de forma consciente e lícita, decidir registrar algo estritamente operacional — e mesmo assim evite dados de saúde ou de recuperação.

11.3. O endereço do local de reunião pode ser dado pessoal ou dado de um espaço alugado. Informe o que o grupo já trata como público ou necessário à tesouraria, e nada além disso.

## 12. Menores de idade

12.1. O serviço destina-se a servidores de grupos, não a crianças. Não coletamos intencionalmente dados de menores de 18 anos para criar contas.

12.2. Se você souber que um menor cadastrou-se, avise o administrador da instância para que a conta seja encerrada e os dados da conta sejam eliminados, no que for possível.

## 13. Segurança

13.1. Medidas previstas no desenho atual incluem hash de senha, JWT com chave da instância e acesso autenticado aos recursos de tesouraria.

13.2. Nenhuma transmissão pela internet é absolutamente segura. O administrador deve proteger `JWT_SECRET`, o banco PostgreSQL e o acesso ao servidor. Você deve proteger sua senha e o dispositivo.

13.3. Em caso de incidente que afete dados pessoais, o administrador deve avaliar o dever de comunicar titulares e a ANPD, nos termos da LGPD.

## 14. Alterações desta política

14.1. Esta política pode ser atualizada. A versão vigente será publicada em `/privacidade`, com a data de vigência.

14.2. A fonte em texto, para quem mantém o software, está em `docs/legal/politica-de-privacidade.md`. A página pública `/privacidade` é a versão oponível aos usuários desta instância.

14.3. Mudanças relevantes devem ser indicadas de forma razoável. O uso continuado após a nova vigência, quando a lei permitir, implica ciência da versão atual.

## 15. Contato

Para questões de privacidade, direitos do titular ou esta política, fale com o **administrador desta instância** (quem publica e mantém este endereço). Não há, neste documento, e-mail de DPO genérico: o canal válido é o que esse administrador divulgar junto ao grupo ou à instalação.

---

*Servidor de NA — Política de Privacidade v1.0, 16 de agosto de 2026.*
