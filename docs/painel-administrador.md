# Painel administrador

A rota `/admin` reúne login por e-mail e senha, fila de cadastros e gestão de locais. `/gestao` permanece como endereço compatível para o mesmo painel.

## Uso

1. Entre com uma conta administrativa autorizada.
2. Abra **Cadastros recebidos**. O filtro inicial mostra pendentes; selecione **Todos** para consultar publicados e recusados.
3. Filtre por local, profissional ou trecho e busque por nome, endereço ou cidade.
4. Clique em **Ver cadastro** para conferir dados, recursos e fotos.
5. Escolha **Aprovar e publicar** ou **Recusar cadastro**, com motivo obrigatório para recusa.
6. Para locais, use **Editar dados e fotos**, ou abra a seção **Gerenciar locais**.

Os novos cadastros públicos ficam pendentes e são consultados no painel. A API não solicita mais links de aprovação por e-mail. O login por senha também dispensa SMTP. Aprovar um trecho não o torna auditado presencialmente e não reativa a seção pública de rotas, atualmente desabilitada.

## Configuração das contas

As permissões permanecem nas tabelas privadas existentes do Supabase, sem lista de administradores ou senha embutida no frontend. Contas são gerenciadas pelo Supabase Auth; a senha é armazenada pelo serviço como hash.

Para provisionar contas autorizadas sem depender de e-mail, use Supabase → Authentication → Users, com a opção de adicionar uma conta por e-mail e senha ou editar uma conta existente. Confirme as contas administrativas específicas nessa operação, sem desativar a confirmação global para usuários públicos.

Como alternativa, `scripts/provision-admin-users.mjs` usa a API administrativa autenticada localmente. Configure `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`) e `ADMIN_INITIAL_PASSWORD` no `.env.local`, ignorado pelo Git, e execute:

```bash
node scripts/provision-admin-users.mjs email1@example.com email2@example.com
```

O script atualiza somente os e-mails informados e não altera as tabelas de autorização. Não use prefixo `VITE_` nas credenciais administrativas. Depois da operação, retire essas duas variáveis do arquivo local. Nenhum endpoint de provisionamento é publicado.

## Dados e segurança

`database/admin_registration_panel.sql` adiciona RPCs de listagem, detalhe e decisão. As funções públicas usam `SECURITY INVOKER`; as implementações privadas verificam `private.is_registration_reviewer()` antes de consultar ou alterar registros. Chamadas anônimas não recebem permissão de execução.

A lista inclui registros das três tabelas, inclusive os cadastrados antes da criação das filas por e-mail. Usa páginas de vinte itens, busca e filtros. Decisões bloqueiam o registro e exigem status pendente, impedindo aprovação ou recusa repetida. Editar dados de locais usa o serviço de gestão já existente.

`tests/admin-registration-panel-security.sql` testa listagem, aprovação, recusa, decisões repetidas, acesso indevido e preservação da condição de trecho não auditado. A transação é revertida, sem manter os dados de teste.

Em modo demo, o painel usa registros locais e dispensa autenticação; esse modo não concede acesso administrativo ao banco online. Para testar o login real localmente, use o modo normal com as variáveis públicas do Supabase. A edição que passa pelas funções Vercel exige `vercel dev` ou o site publicado.
