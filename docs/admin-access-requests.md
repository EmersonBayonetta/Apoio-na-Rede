# Solicitações de acesso administrativo

O titular já autorizado permanece com acesso. Outras pessoas entram com seu e-mail, confirmam a identidade e clicam em **Solicitar acesso**. O cadastro e a solicitação não concedem privilégios. O titular recebe um aviso e decide em **Administração → Acessos da equipe**. Outros membros administrativos não podem decidir acessos da equipe.

O link do aviso abre a lista protegida; abrir o link não aprova ninguém. A decisão exige a sessão do titular e uma ação explícita. A aprovação habilita a conta na lista privada; a recusa mantém a pessoa sem acesso. Cada conta tem uma solicitação, impedindo duplicação por recarga ou repetição do envio. O histórico registra quem decidiu e quando.

## Configurar os avisos na Vercel

1. Crie a conta Resend com o mesmo e-mail do titular autorizado e gere uma API Key.
2. Em Vercel → projeto apoio-na-rede → Settings → Environment Variables, configure em **Production**:
   - `RESEND_API_KEY`: chave gerada no Resend.
   - `ADMIN_EMAIL_FROM`: remetente. Para o teste inicial, `Apoio na Rede <onboarding@resend.dev>`.
3. Confirme as variáveis existentes da integração Supabase: URL, chave pública e `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`. A chave secreta é usada somente pela função do servidor para obter o destinatário correto e registrar a notificação; nunca entra no frontend.
4. Faça um novo deploy após salvar as variáveis.

O destinatário é obtido da identidade privada do titular no banco. O cliente não escolhe destinatário, solicitante ou identificador de outra solicitação. `APP_SITE_URL` é opcional; o endereço padrão dos links é `https://apoio-na-rede.vercel.app`.

O remetente `resend.dev` é para teste e permite envio somente ao e-mail associado à própria conta Resend. Para uso em produção, verifique um domínio próprio e troque `ADMIN_EMAIL_FROM` por um endereço desse domínio. [Restrição oficial do Resend](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

## Login de pessoas da equipe

O envio de avisos pela API Resend e o envio de links de login pelo Supabase são configurações distintas. O serviço padrão do Supabase limita os destinatários a membros da organização. Para outras pessoas confirmarem seu e-mail, configure SMTP próprio no Supabase Auth. Com Resend, é necessário domínio verificado; use host `smtp.resend.com`, usuário `resend`, senha igual à API Key e uma porta TLS suportada. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Resend SMTP](https://resend.com/docs/send-with-smtp).

## Falhas e validação

Se o provedor ou as credenciais estiverem indisponíveis, a solicitação é preservada como pendente e a interface informa que o aviso não foi enviado. A pessoa pode tentar enviar novamente; o titular também pode revisar a fila no painel. A API usa idempotência no provedor e só marca o aviso como enviado depois da aceitação pelo Resend. Aceitação pelo provedor não comprova entrega na caixa de entrada.

As migrações terminam com `database/administrator_requests.sql`. As tabelas de acesso e solicitações ficam no schema privado, com RLS e sem permissões para leitura/escrita direta por usuários comuns. Apenas o titular pode listar e decidir solicitações. As funções de payload e confirmação de envio são exclusivas de `service_role`.

### Limite no envio do link de login

Os logs do teste real registraram `over_email_send_rate_limit` (HTTP 429) em `/auth/v1/otp`. A tela agora informa o limite, em vez de sugerir um código incorreto. Configurar Resend na Vercel não altera o SMTP do Supabase Auth. O provedor embutido tem limite de dois e-mails por hora por projeto; customizar o envio requer SMTP próprio ou Send Email hook. [Limites oficiais](https://supabase.com/docs/guides/auth/rate-limits). A configuração SMTP permanece uma etapa externa ao código e não foi alterada pelas ferramentas desta sessão.

Verificações automatizadas: 65 testes unitários, build, lint e teste de navegador do fluxo de solicitação/decisão. Testes SQL transacionais no projeto real confirmam solicitação única, ausência de promoção automática, bloqueio de autoaprovação, bloqueio de aprovação por outro administrador, aprovação pelo titular, recusa e restrição dos dados de notificação ao servidor. Testes de e-mail usam respostas simuladas: a entrega real exige as credenciais acima e uma solicitação real.
