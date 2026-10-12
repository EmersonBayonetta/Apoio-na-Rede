# Cadastro e revisão pelo Supabase

O menu Cadastrar abre o formulário público, sem login. Os envios online ficam pendentes no banco existente `supabase-green-school`; não aparecem no catálogo até serem aprovados.

Compartilhar um trecho e Cadastrar profissional seguem o mesmo fluxo. O link de revisão inclui o tipo do catálogo e o banco confirma a autorização do titular. Os limites de envio são compartilhados entre locais, trechos e profissionais.

A função `/api/register-place` solicita um link de acesso do Supabase Auth para o titular já autorizado. Nenhuma mensagem passa pelo Resend. O link abre `/revisao?cadastro=UUID`, com apenas aquele cadastro. Abrir o link não decide nada: o titular precisa clicar em Aprovar e publicar ou informar o motivo da recusa. A autorização é conferida no banco em cada operação; conhecer a URL ou confirmar outro e-mail não concede acesso.

## Gerenciar e editar locais

O link **Gerenciar locais** no rodapé e **Gerenciar locais cadastrados** no cadastro abre `/gestao`. Informe um e-mail administrativo já cadastrado e abra o link de acesso enviado pelo Supabase. A autenticação usa `shouldCreateUser: false`; receber um link não concede autorização administrativa. O endpoint `/api/manage-places` verifica o usuário e `is_site_admin` em cada leitura e gravação, além das políticas RLS existentes. Não é necessária uma migração nova.

Na lista, busque pelo nome, filtre por status e clique em **Editar**. O formulário carrega os dados existentes e permite corrigir nome, categoria, descrição, endereço, coordenadas, telefone, WhatsApp, horário e fotos. Ao alterar o endereço, confirme o ponto no mapa antes de salvar. As fotos podem ser adicionadas por link ou arquivo JPG, PNG ou WebP de até 10 MB; os arquivos são reduzidos para JPEG antes do envio. A primeira foto é a capa, com até dez fotos no total.

Os arquivos enviados são guardados no bucket público `place-photos`, preparado pelo servidor quando necessário. A chave secreta fica somente no servidor; a consulta e a atualização dos locais usam a chave pública e o JWT do administrador. Fotos retiradas de um cadastro deixam de aparecer nele; arquivos antigos não são apagados automaticamente, pois podem estar referenciados por outros cadastros.

Salvar atualiza o mesmo registro e preserva seu status, proprietário e avaliações. Locais publicados continuam publicados; pendentes continuam pendentes e recusados continuam recusados. O fluxo de aprovação permanece em `/revisao`. A versão `atualizado_em` impede que duas edições deste formulário sobrescrevam uma à outra: diante de conflito, volte à lista e abra o cadastro novamente.

No Supabase, permita também `https://apoio-na-rede.vercel.app/gestao` em Authentication → URL Configuration, caso o curinga `https://apoio-na-rede.vercel.app/**` ainda não esteja permitido. O envio de links segue os limites e a configuração SMTP já existentes. Em modo demo, a gestão edita apenas os registros do navegador e dispensa login.

Validação: `npm test`, `npm run build`, `npm run lint`; o teste `tests/browser-place-management.mjs` usa Chrome isolado em `:9227` e Vite demo em `:4187`. `tests/place-management-security.sql` verifica as permissões no banco em uma transação com rollback, sem deixar cadastros de teste.

## Configuração existente e limites

Na Vercel, mantenha a URL Supabase, chave pública e chave secreta de servidor da integração existente. As chaves secretas nunca entram no build do navegador. A migração `database/registration_email_review.sql` já foi aplicada ao projeto existente.

No Supabase, Authentication → URL Configuration precisa permitir `https://apoio-na-rede.vercel.app/revisao**` (ou o curinga existente `https://apoio-na-rede.vercel.app/**`). Site URL deve ser `https://apoio-na-rede.vercel.app`. O template Magic Link deve manter `{{ .ConfirmationURL }}` para fornecer o link.

O serviço padrão do Supabase não é um serviço de notificações personalizadas: usamos seu e-mail de autenticação para acessar a revisão. Ele limita envios a dois por hora por projeto e restringe destinatários aos membros da organização. Veja [limites de Auth](https://supabase.com/docs/guides/auth/rate-limits) e [SMTP padrão](https://supabase.com/docs/guides/auth/auth-smtp). A entrega de cada aviso não pode ser garantida nessa configuração. Quando o envio falha, o cadastro continua pendente e o formulário informa a falha; não há publicação automática nem nova tentativa em segundo plano.

O endpoint aceita até três cadastros por origem em 24 horas e até cem por dia no total. Guarda somente um hash protegido da origem, não o IP original. Leitura e decisão são exclusivas do titular habilitado, e a criação por RPC é exclusiva do servidor. Os testes SQL de segurança usam transação com rollback; os testes de e-mail simulam o provedor e não comprovam entrega na caixa de entrada.

Em `npm run dev`, o Vite não executa as funções da Vercel: use a publicação para enviar ao banco ou o modo demo para testar localmente sem envio de e-mail.
