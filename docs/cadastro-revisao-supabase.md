# Cadastro e revisão pelo Supabase

O cadastro público online de locais, profissionais e trechos não exige login do colaborador. A API valida os dados e grava o registro como pendente, para decisão administrativa antes da publicação.

## Painel atual

O painel fica em `/admin`, com login por e-mail e senha de contas autorizadas no Supabase. A rota `/gestao` permanece compatível. A fila inclui todos os registros de locais, profissionais e trechos, com filtros por tipo, status e busca. Administradores podem consultar detalhes, aprovar ou recusar pendentes e editar dados e fotos dos locais.

O fluxo atual não solicita links por e-mail. A API `/api/register-place` informa que o cadastro foi enviado ao painel, sem depender de SMTP. As antigas páginas de revisão continuam acessíveis a sessões autorizadas, mas o procedimento principal é pelo painel.

Veja [uso, configuração das contas e segurança](painel-administrador.md).

## Validação e imagens

O schema declarativo de locais em `shared/registrationValidation.js` é compartilhado pelo frontend e APIs de cadastro e edição. Exige nome e cidade com pelo menos 3 caracteres, endereço com 5 e descrição com 20, desconsiderando espaços nas pontas. Textos obrigatórios vazios ou acima de 5.000 caracteres são recusados. UF, coordenadas e links de fotos também são validados. Profissionais e trechos conservam validadores específicos.

Fotos de locais aceitam links e arquivos JPG, PNG ou WebP de até 10 MB. Os arquivos são reduzidos para JPEG antes do envio e armazenados no bucket público `place-photos`. O total é de dez fotos, com a primeira usada como capa. Retirar a referência de uma foto não apaga automaticamente o arquivo antigo.

## Permissões e limites

O banco conserva as tabelas privadas de autorização e os convites administrativos. `database/admin_registration_panel.sql` acrescenta RPCs autenticadas de listagem, detalhe e decisão. Cada operação verifica a permissão de revisão; conhecer a URL não concede acesso. Senhas ficam no Supabase Auth, sem senha padrão embutida no frontend.

O endpoint público aceita até três cadastros por origem em 24 horas e até cem por dia no total, compartilhados entre locais, profissionais e trechos. A origem é representada por hash protegido. Campos enviados pelo visitante não podem promover publicação nem alterar proprietário ou avaliações.

As chaves secretas permanecem somente no servidor. Não use prefixo `VITE_` para chaves administrativas. Para desenvolvimento, `npm run dev` serve o frontend e o login/consulta direta ao Supabase; as funções Vercel exigem `vercel dev` ou o ambiente publicado. O modo demo usa apenas registros do navegador e dispensa login.

## Histórico

Os scripts `registration_email_review.sql`, `registration_review_team.sql` e complementares preservam o histórico do antigo fluxo por links. A aplicação atual substituiu esse envio pela fila administrativa. SMTP ainda pode ser necessário para outros recursos de e-mail que sejam adotados no futuro, mas não para o login e aprovação atuais.
