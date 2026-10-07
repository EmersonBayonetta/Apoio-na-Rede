# Validação das contribuições — 06/10/2026

Projeto Supabase existente: `supabase-green-school` (`pwzqivjkpiqsizuebjlt`). Nenhum projeto novo foi criado. As migrações de inicialização, segurança e índices foram aplicadas no projeto remoto. O `.env.local` aponta para ele usando somente a chave pública e está ignorado pelo Git.

## Verificado

- Build normal e build de demonstração compilam.
- 55 testes unitários passam; lint mantém somente os dois avisos anteriores.
- Os sete testes de navegador exigidos pelo handoff passam: community, needs, osm-categories, presentation, regressions, search-viewport e speech.
- Novo teste de contribuições passa: envio único, recarga, rejeição de SVG, foto do dispositivo no modo local, moderação, selo do responsável, relatos aprovados, layout móvel e noindex.
- Novo teste Auth simulado passa: login obrigatório, acesso negado ao não administrador, ausência de consultas privadas antes da autorização e impossibilidade de usar user_metadata para conceder acesso.
- A API real responde às consultas de cadastros, recursos e relatos aprovados. O provedor Email está habilitado.
- A chave pública recebe 401 ao tentar consultar relatos brutos ou colunas privadas dos estabelecimentos.
- O teste SQL transacional passou no banco real: cadastro, identidade normalizada, duplicata recusada, proteção de campos, rejeição de respostas inválidas, limites de 10 relatos/3 cadastros em 24 horas, RLS e retorno público sem campos privados. Os usuários e registros de teste foram revertidos com ROLLBACK.
- Supabase Security Advisors não apresenta alertas. npm audit fix concluiu com zero vulnerabilidades.

## Pendente antes da publicação

- Confirmar o domínio real e configurar Site URL/Redirect URLs no Supabase Auth.
- Definir uma conta administradora existente, por app_metadata, e renovar seu token.
- Verificar entrega real dos e-mails de acesso e configurar SMTP de produção/template de código, se necessário.
- Confirmar VITE_GOOGLE_MAPS_API_KEY e VITE_GOOGLE_MAPS_MAP_ID na Vercel; essas variáveis estão ausentes no ambiente local. Validar Maps/Places real no domínio autorizado.
- Testar upload e visualização de fotos com uma conta real. O armazenamento remoto está configurado, mas esse teste não foi feito com uma sessão real.
- Configurar as variáveis públicas Supabase no ambiente de deploy. Não houve deploy nem alteração das variáveis da Vercel nesta execução.

Os sete testes antigos que o handoff identifica como já falhando não foram reexecutados nesta entrega. Os testes de navegador isolados bloqueiam as APIs externas, portanto seus resultados não comprovam disponibilidade de Google, SMTP ou outros serviços em produção.

Os cabeçalhos de segurança estão preparados no vercel.json e passam a valer após o deploy. A proteção dos dados no banco já está aplicada por permissões, RLS e triggers.

## Atualização — 07/10/2026: catálogo compartilhado

- Rotas e profissionais agora usam o mesmo Supabase existente. Novos envios exigem login e ficam pendentes, visíveis ao autor e à administração. A aprovação publica o cadastro para todos os visitantes.
- As migrações `database/community_directory.sql` e `database/administrator_bootstrap.sql` foram aplicadas. O limite é de 10 envios por catálogo em 24 horas. Campos de autoria, status, auditoria e aprovação são controlados pelo banco; importações repetidas têm chave única por autor.
- `/gestao` inclui revisão de rotas e profissionais. A publicação de um relato de rota não certifica uma auditoria presencial; essa confirmação tem controle separado.
- A conta administradora indicada foi configurada em uma tabela privada, sem incluir o e-mail no repositório. O primeiro login com e-mail confirmado concede a função por `app_metadata`. Contas sem confirmação não recebem acesso. O endereço também pode fazer o primeiro cadastro diretamente em `/gestao`.
- A API real permite ler os campos públicos de ambos os catálogos e nega a leitura de autoria e chaves de importação. Testes SQL transacionais verificaram leitura do próprio envio, invisibilidade anônima de pendentes, impossibilidade de autoaprovação, publicação por administrador e concessão da função somente após confirmação do e-mail. Todos os registros de teste foram revertidos.
- Security Advisors sem alertas após as migrações. Build normal e de demonstração, 55 testes unitários e lint passaram (lint mantém os dois avisos anteriores). O novo `tests/browser-directory-online.mjs` verifica login, envio pendente, retirada de campos privilegiados, exclusão dos exemplos na importação e filas administrativas usando respostas simuladas.
- O bundle publicado consultado antes deste envio continha a configuração Google, mas nenhuma URL Supabase. O build passa a reconhecer também `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` e as variantes públicas de publishable/anon key criadas pela integração Vercel. Variáveis secretas não entram no bundle; uma chave `service_role` ou `sb_secret_` causa falha do build. Publicação Vercel Production sem banco configurado também falha, evitando disponibilizar silenciosamente um catálogo apenas local. Quatro testes adicionais cobrem a seleção e rejeição de credenciais, totalizando 59 testes unitários aprovados.
- Os oito testes de navegador em demonstração passaram novamente; os dois testes com Auth e catálogo online simulado também passaram. Os testes externos não demonstram entrega de e-mail, upload com sessão real ou autorização das APIs Google em produção.
- A alteração foi enviada à `main` no commit `50a8a48` e o deploy automático foi conferido em `https://apoio-na-rede.vercel.app`: o bundle contém o projeto Supabase correto, a configuração Google e a importação de catálogo. Usando a chave pública do bundle publicado, as APIs reais de rotas, profissionais e Auth retornaram 200. `/gestao` retorna 200 com `noindex`. As três telas foram abertas no navegador contra o domínio publicado, sem exceções não tratadas nem mensagens de falha no carregamento dos catálogos.
- Testes SQL adicionais com ROLLBACK confirmaram importação duplicada recusada, telefone inválido recusado, proibição de inserir o campo de auditoria, ausência de escalada via `user_metadata` e bloqueio do 11º envio de rota em 24 horas. O catálogo remoto permaneceu vazio: dados locais reais dependem da exportação e revisão descritas abaixo.

### Como transferir cadastros anteriores

1. Abra o endereço original (por exemplo, `http://localhost:5173`) no mesmo navegador em que cadastrou os dados.
2. Em Rotas ou Profissionais, abra “Importar cadastros feitos anteriormente neste navegador”, carregue os dados e exporte o arquivo JSON. Os exemplos do app são excluídos.
3. No site publicado, abra a mesma opção, selecione o arquivo, confira os nomes, entre na conta e envie para revisão. Use somente dados reais e contatos com autorização de publicação.
4. Em `/gestao`, revise e aprove os cadastros. Eles passam a aparecer para todos. Se um lote exceder o limite diário, é possível tentar novamente depois sem duplicar os registros já enviados.

### Validação que requer interação do titular

Ainda é necessário confirmar o recebimento do acesso por e-mail, entrar na conta administradora e realizar um upload real. Não foram enviados e-mails nem utilizados códigos de acesso do titular nos testes automatizados. Confira no Supabase Auth a Site URL `https://apoio-na-rede.vercel.app` e Redirect URLs para esse domínio (incluindo os caminhos usados) e, se necessário, o localhost. SMTP, restrições de domínio do Google e configurações da Vercel não foram alterados por estas migrações.

### Diagnóstico do primeiro login real

Os logs Auth registraram envio do e-mail, confirmação e login implícito, mas com destino/referer `http://localhost:3000`. Foi solicitado ao titular ajustar a Site URL e adicionar `https://apoio-na-rede.vercel.app/**` na URL Configuration. Essa configuração não pode ser editada pelas ferramentas conectadas nesta sessão.

O primeiro login revelou que uma gravação posterior de metadados pelo GoTrue retirava a função atribuída na confirmação. A migração corretiva preserva a função somente para o UUID confirmado originalmente vinculado ao alvo privado. A conta real já confirmada foi atualizada e a consulta confirmou `role=admin`. Testes com ROLLBACK verificaram que uma conta não confirmada não recebe a função, a gravação posterior mantém a função e uma conta recriada com o mesmo e-mail não herda o acesso. A revogação exige remover o vínculo privado antes de retirar a função.

## Revisão do acesso administrativo — 07/10/2026

Esta revisão substitui o mecanismo de bootstrap descrito acima. `database/administrator_access.sql` cria uma lista privada de UUIDs autorizados, preserva somente a identidade já autorizada e desativa o trigger de concessão por confirmação de e-mail. Atualmente há uma conta habilitada; não foram adicionadas pessoas da equipe sem indicação do titular.

RLS, triggers, serviços e tela administrativa verificam a lista no banco. `app_metadata.role` e `user_metadata.role`, por si só, não autorizam acesso. A lista não pode ser lida ou modificada pela API pública. Revogar `enabled` bloqueia as operações seguintes mesmo com claims antigos. Testes transacionais confirmaram negação a conta com ambos os metadados `admin` sem vínculo, impedimento de autoinscrição, autorização após inclusão administrativa e revogação sem renovar o JWT. As políticas restantes baseadas somente no papel do JWT e os triggers de promoção por e-mail foram contados: zero.

O Auth registrou envio de `magic_link` e login pelo domínio publicado. A interface foi corrigida: pede link de acesso, sem obrigar a digitação de um código ausente no template padrão; código é uma opção somente quando o e-mail o contém. O login administrativo usa `shouldCreateUser=false`. O painel de demonstração fica indisponível, e a gestão autenticada separa filas de locais/relatos e rotas/profissionais em duas abas. Para envio a pessoas fora da organização Supabase, configure SMTP próprio conforme a documentação oficial.

Build normal/de demonstração, 59 testes unitários, lint e os testes de navegador de Auth, catálogo online e contribuições passaram. Auth simulado verifica que o login administrativo não cria contas, não exige código após enviar um link e nega acesso mesmo com metadados `admin` quando a autorização do banco é falsa. O teste de contribuições confirma que o modo demo não libera moderação. A API real nega `is_site_admin` a visitantes anônimos (401).

O Security Advisor não apontou problemas nas tabelas ou políticas novas. Permanece o aviso de [proteção contra senhas vazadas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); o fluxo atual utiliza acesso por e-mail. As ferramentas conectadas não permitem alterar configurações Auth/SMTP ou o template de e-mail. [O template padrão envia link; código depende de incluir `.Token`](https://supabase.com/docs/guides/auth/auth-email-passwordless).

## Fluxo de autorização pelo titular

A pedido do titular, `database/administrator_requests.sql` adiciona solicitações privadas e identifica o único titular que pode decidir acessos. O login da página de gestão passa a permitir criação de uma conta comum para iniciar esse fluxo; isso não concede permissão administrativa. Uma solicitação exige e-mail confirmado e é única por conta. A fila de acessos é mostrada exclusivamente ao titular; membros da equipe continuam limitados à moderação das contribuições.

O endpoint servidor `/api/admin-access-request` valida a sessão, registra o pedido e obtém o destinatário do banco usando credencial de servidor. O aviso Resend tem link para revisão autenticada, sem ações de aprovação por GET ou tokens de autorização no e-mail. Na falta de configuração ou falha do provedor, o pedido permanece pendente e a interface informa que o aviso está pendente. Não foi comprovada entrega real: ainda depende de `RESEND_API_KEY`, remetente e teste com credenciais reais.

65 testes unitários passaram, incluindo identidade verificada, destinatário não controlado pelo cliente, idempotência, falha do provedor e ausência de credenciais. O teste de navegador `browser-admin-requests.mjs` passou com APIs simuladas. No banco real, testes com ROLLBACK verificaram duplicação bloqueada, ausência de promoção ao solicitar, autoaprovação negada, outro administrador sem poder de decisão, aprovação e recusa pelo titular e payload de notificação exclusivo do servidor. As novas APIs privadas retornam 401 para a chave pública anônima. Veja [a configuração e as limitações de envio](admin-access-requests.md).
