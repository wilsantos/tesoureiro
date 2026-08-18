# Termos de Serviço

**Servidor de NA**  
Versão 1.0 — vigência a partir de **16 de agosto de 2026**

> **Aviso:** este documento descreve as regras de uso deste aplicativo. Não substitui assessoria jurídica, contábil ou as tradições e diretrizes oficiais de Narcóticos Anônimos. Em caso de dúvida legal, consulte um profissional habilitado. Em caso de dúvida sobre o serviço, fale com o administrador desta instância.

---

## 1. Quem oferece o serviço

1.1. **Servidor de NA** é um aplicativo de tesouraria para grupos de Narcóticos Anônimos. Destina-se a **servidores de confiança** com encargo de secretaria e/ou tesouraria: cadastro de grupos, registro de reuniões, lançamento de despesas e emissão de relatórios.

1.2. Este software pode ser disponibilizado em instâncias distintas (por exemplo, Docker, ambiente local ou hospedagem compartilhada). **Quem opera esta instância** — a pessoa ou o corpo de serviço que a instala, configura e mantém — é o responsável pelo serviço perante os usuários desta instalação.

1.3. Estes Termos aplicam-se ao uso **desta instância**, no endereço em que você a acessa. Não criam vínculo com Narcóticos Anônimos como irmandade, com a ABNA ou com qualquer estrutura de serviço, salvo se essa estrutura for, ela própria, a operadora desta instância.

## 2. Aceitação

2.1. Ao criar uma conta em **Criar conta** (`/cadastro`) e marcar o aceite, você declara que leu, compreendeu e concorda com estes Termos e com a [Política de Privacidade](./politica-de-privacidade.md).

2.2. O uso continuado do serviço após o cadastro também implica observância destes Termos.

2.3. Se você não concordar, não crie conta e não utilize o aplicativo.

## 3. Destinatários e idade mínima

3.1. O serviço é voltado a adultos que exercem serviço de confiança em grupos de NA (secretaria, tesouraria ou ambos). **Não** é um aplicativo para crianças ou adolescentes e **não** se destina ao cadastro de membros em recuperação.

3.2. Você declara ter **18 anos ou mais** e capacidade para aceitar estes Termos.

3.3. O administrador da instância não deve criar, de forma consciente, contas para menores de 18 anos.

## 4. Conta de usuário

4.1. No cadastro por e-mail e senha, você informa **nome**, **e-mail** e **senha** (mínimo de 8 caracteres). A senha é armazenada apenas como hash (Argon2id ou bcrypt), nunca em texto claro.

4.2. Você é responsável por manter a senha em sigilo e por toda atividade realizada com a sua conta.

4.3. O aplicativo também pode oferecer entrada com **Google**. Nesse fluxo, o Google informa ao aplicativo nome, e-mail e um identificador da conta Google (`sub`). A conta nesta instância pode ser criada ou vinculada a partir desses dados. O tratamento feito pelo Google rege-se pelos termos e pela política de privacidade da Google.

4.4. Após o login, o aplicativo emite um token de acesso (JWT) gravado no **armazenamento local do navegador** (`localStorage`), não em cookie de sessão. Quem tiver acesso ao seu dispositivo ou a esse token pode agir em seu nome até o token expirar. Não compartilhe o dispositivo desbloqueado nem o conteúdo do `localStorage`.

4.5. O administrador da instância pode recusar, suspender ou encerrar contas em caso de uso indevido, risco à segurança ou decisão operacional da instância.

## 5. O que o serviço faz — e o que não faz

5.1. **O serviço faz:** apoiar a tesouraria e a secretaria do grupo (grupos, reuniões, despesas e relatórios), com vínculo do usuário a um ou mais grupos e papéis de secretaria e/ou tesouraria.

5.2. **O serviço não faz:**

- cadastro de lista de membros ou de pessoas em recuperação;
- registro de nomes de addicts nas reuniões — as reuniões guardam **contagens** (membros, visitantes, faixas de tempo limpo) e valores da 7ª Tradição, não identidades;
- aconselhamento espiritual, jurídico, fiscal ou contábil;
- substituição das tradições, conceitos de serviço ou manuais da irmandade.

5.3. Campos de **texto livre** (por exemplo, fatos relevantes da reunião) e o **endereço do grupo** podem, se mal preenchidos, conter dados pessoais. Cabe a você não incluir nomes de membros, telefones, documentos ou qualquer informação que identifique pessoas em recuperação, salvo o estritamente necessário à tesouraria do grupo e permitido pelas tradições de anonimato.

## 6. Uso permitido e proibido

6.1. Você se compromete a:

- usar o serviço apenas para tesouraria e secretaria de grupos de NA aos quais esteja vinculado como servidor de confiança;
- informar dados verdadeiros na sua conta;
- respeitar o anonimato e a confidencialidade das informações do grupo;
- cumprir a legislação brasileira aplicável, inclusive a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

6.2. É proibido:

- tentar acessar contas, grupos ou dados de terceiros sem autorização;
- burlar autenticação, copiar o token JWT de outra pessoa ou explorar falhas de segurança;
- usar o aplicativo para vigiar, expor ou identificar membros da irmandade;
- inserir conteúdo ilícito, ofensivo ou que viole direitos de terceiros;
- sobrecarregar a instância de forma abusiva (ataques, extração massiva não autorizada, etc.).

## 7. Conteúdo inserido por você

7.1. Grupos, reuniões, despesas e textos que você cadastrar permanecem sob a responsabilidade de quem os inseriu e do grupo a que se referem.

7.2. Você concede ao operador desta instância a permissão técnica necessária para armazenar, copiar internamente e exibir esse conteúdo **apenas para operar o serviço** (incluindo backup da instância, se o administrador o realizar).

7.3. Relatórios exportados (por exemplo, em arquivo de texto ou documento) são de responsabilidade de quem os gera e de quem os guarda fora do aplicativo.

## 8. Instâncias auto-hospedadas e disponibilidade

8.1. O operador da instância define onde os dados ficam (servidor próprio, Docker, hospedagem compartilhada etc.), as cópias de segurança e o tempo em que o serviço permanece no ar.

8.2. O serviço é oferecido **como está**, sem garantia de funcionamento ininterrupto, de ausência de erros ou de adequação a um fim específico além do descrito nestes Termos.

8.3. Manutenções, falhas de internet, da hospedagem ou do navegador podem impedir o acesso temporário. O operador da instância não se obriga a um nível de serviço (SLA) nestes Termos, salvo compromisso escrito à parte.

## 9. Limitação de responsabilidade

9.1. Na medida permitida pela legislação brasileira, o operador da instância não responde por:

- decisões financeiras do grupo tomadas com base em relatórios do aplicativo;
- perda de dados causada por falha do dispositivo do usuário, do navegador ou de cópia de segurança inexistente ou incompleta;
- conteúdo inserido por usuários (incluindo dados pessoais colocados indevidamente em texto livre);
- atos de terceiros (Google, provedor de hospedagem, BMLT ou outros serviços externos).

9.2. Nada nestes Termos exclui responsabilidade por dolo, culpa grave ou outras hipóteses que a lei brasileira não permita afastar.

## 10. Propriedade intelectual

10.1. O nome de exibição **Servidor de NA**, a interface desta instância e o código do aplicativo, na forma em que forem disponibilizados, pertencem aos respectivos titulares. O uso do serviço não transfere titularidade de software ao usuário.

10.2. Nomes, logotipos e literatura de Narcóticos Anônimos, se eventualmente referidos, pertencem aos seus titulares e não são licenciados por estes Termos.

## 11. Serviços de terceiros

11.1. **Google.** Se você usar “Entrar com Google”, aplicam-se também os termos da Google. Esta instância recebe apenas os dados necessários à conta (nome, e-mail e identificador `sub`), conforme a [Política de Privacidade](./politica-de-privacidade.md).

11.2. **BMLT.** A sugestão de CSA/CSR (comunidades e regiões de serviço) pode basear-se em listas públicas do BMLT. Esse diretório descreve estruturas de serviço, não membros. A disponibilidade e o conteúdo dessa lista não são controlados por esta instância.

11.3. A hospedagem, o certificado HTTPS e o correio eletrônico, se existirem, são de responsabilidade do provedor contratado pelo administrador da instância.

## 12. Encerramento do uso

12.1. Você pode deixar de usar o serviço a qualquer momento. Para exclusão da conta e dos dados pessoais, solicite ao **administrador desta instância**, nos termos da Política de Privacidade.

12.2. O administrador pode encerrar ou restringir o acesso em caso de violação destes Termos, descontinuação da instância ou obrigação legal.

12.3. Dados de tesouraria do grupo (reuniões, despesas, saldos) podem permanecer na instância após a saída de um servidor, porque pertencem ao histórico do grupo, não só à conta individual — salvo pedido legítimo de exclusão ou anonimização de dados pessoais identificáveis.

## 13. Alterações destes Termos

13.1. O administrador da instância pode atualizar estes Termos. A versão vigente será publicada em `/termos`, com a data de vigência.

13.2. Alterações relevantes devem ser comunicadas de forma razoável (por exemplo, aviso na própria instância). O uso continuado após a nova vigência constitui aceite da versão atualizada, quando a lei permitir.

13.3. A fonte em texto dos Termos, para quem mantém o software, está no repositório do projeto (`docs/legal/termos-de-servico.md`). A página pública `/termos` é a versão oponível aos usuários desta instância.

## 14. Lei aplicável e foro

14.1. Estes Termos interpretam-se de acordo com a legislação da **República Federativa do Brasil**, em especial o Código Civil e a LGPD.

14.2. Eventuais controvérsias serão processadas no foro do domicílio do usuário, quando a lei do consumidor ou outra norma cogente assim determinar; nos demais casos, no foro do local de operação da instância, se conhecido, ou conforme a lei processual brasileira.

## 15. Contato

Para dúvidas sobre estes Termos, exercício de direitos ou problemas na instância, entre em contato com o **administrador desta instância** — a pessoa ou o corpo de serviço que publica e mantém este endereço na internet. Este documento não indica e-mail genérico nem encarregado (DPO) inventado: o canal é o que o próprio administrador divulgar (reunião de serviço, recado no grupo, página de aviso da instalação, etc.).

---

*Servidor de NA — Termos de Serviço v1.0, 16 de agosto de 2026.*
