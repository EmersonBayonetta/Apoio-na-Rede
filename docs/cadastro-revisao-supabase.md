# Cadastro e revisão pelo Supabase

O menu Cadastrar abre o formulário público, sem login. Os envios online ficam pendentes no banco existente `supabase-green-school`; não aparecem no catálogo até serem aprovados.

Compartilhar um trecho e Cadastrar profissional seguem o mesmo fluxo. O link de revisão inclui o tipo do catálogo e o banco confirma a autorização do titular. Os limites de envio são compartilhados entre locais, trechos e profissionais.

A função `/api/register-place` solicita um link de acesso do Supabase Auth para o titular já autorizado. Nenhuma mensagem passa pelo Resend. O link abre `/revisao?cadastro=UUID`, com apenas aquele cadastro. Abrir o link não decide nada: o titular precisa clicar em Aprovar e publicar ou informar o motivo da recusa. A autorização é conferida no banco em cada operação; conhecer a URL ou confirmar outro e-mail não concede acesso. O antigo painel `/gestao` deixou de ser apresentado.

## Configuração existente e limites

Na Vercel, mantenha a URL Supabase, chave pública e chave secreta de servidor da integração existente. As chaves secretas nunca entram no build do navegador. A migração `database/registration_email_review.sql` já foi aplicada ao projeto existente.

No Supabase, Authentication → URL Configuration precisa permitir `https://apoio-na-rede.vercel.app/revisao**` (ou o curinga existente `https://apoio-na-rede.vercel.app/**`). Site URL deve ser `https://apoio-na-rede.vercel.app`. O template Magic Link deve manter `{{ .ConfirmationURL }}` para fornecer o link.

O serviço padrão do Supabase não é um serviço de notificações personalizadas: usamos seu e-mail de autenticação para acessar a revisão. Ele limita envios a dois por hora por projeto e restringe destinatários aos membros da organização. Veja [limites de Auth](https://supabase.com/docs/guides/auth/rate-limits) e [SMTP padrão](https://supabase.com/docs/guides/auth/auth-smtp). A entrega de cada aviso não pode ser garantida nessa configuração. Quando o envio falha, o cadastro continua pendente e o formulário informa a falha; não há publicação automática nem nova tentativa em segundo plano.

O endpoint aceita até três cadastros por origem em 24 horas e até cem por dia no total. Guarda somente um hash protegido da origem, não o IP original. Leitura e decisão são exclusivas do titular habilitado, e a criação por RPC é exclusiva do servidor. Os testes SQL de segurança usam transação com rollback; os testes de e-mail simulam o provedor e não comprovam entrega na caixa de entrada.

Em `npm run dev`, o Vite não executa as funções da Vercel: use a publicação para enviar ao banco ou o modo demo para testar localmente sem envio de e-mail.
