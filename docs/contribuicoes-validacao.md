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
