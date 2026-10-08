# Avaliações sem e-mail

O visitante publica sem conta, senha ou confirmação de e-mail. Um UUID aleatório fica salvo no navegador. A API `/api/review` transforma esse identificador em hash usando a chave de servidor; o hash fica somente em `private.visitor_reviews`, sem exposição no catálogo público.

Uma chave única por local e hash impede dois comentários do mesmo identificador, inclusive em requisições simultâneas. A identificação permanece após moderação ou remoção de uma avaliação. O servidor define o nome público como “Visitante da comunidade”; campos de autoria e moderação enviados pelo cliente são ignorados. A API consulta se o identificador já publicou, para exibir o aviso no lugar do botão.

Isso identifica um navegador, não uma pessoa: limpar seus dados, trocar de navegador ou alterar deliberadamente o UUID permite criar outra identidade. Sem autenticação, não há garantia de uma avaliação por pessoa. Os registros anteriores são preservados e não podem ser associados retroativamente a esse UUID.

A migração `database/visitor_reviews.sql` foi aplicada ao Supabase existente. As regras de revisão dos cadastros de locais, rotas e profissionais continuam restritas ao responsável; esta mudança remove a confirmação de e-mail da publicação de comentários.

Validação: `tests/visitor-review.test.mjs`, `tests/visitor-review-security.sql` (transação revertida) e testes de navegador. A validação técnica de nota, comentário, local e identificador continua necessária para proteger a integridade dos dados.
