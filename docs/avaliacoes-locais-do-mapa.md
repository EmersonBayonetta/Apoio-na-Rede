# Avaliações de locais encontrados no mapa

Locais do Google Maps e do OpenStreetMap podem receber avaliações sem cadastro prévio no Apoio na rede. A avaliação usa `external_place_id` com a identificação estável do provedor e fica na mesma tabela `reviews`, mantendo leitura pública, denúncia e moderação. Não cria um estabelecimento nem altera sua situação de acessibilidade.

`database/external_visitor_reviews.sql` permite que uma avaliação tenha exatamente um destino: estabelecimento cadastrado ou identificação externa. A API valida nota, comentário e identificação; a gravação passa por uma função restrita ao servidor. A identidade do visitante permanece na tabela privada, com restrição única para impedir publicações duplicadas.

O formulário consulta avaliações pelo identificador do mapa ao abrir o local, inclusive depois de recarregar a página, e mantém confirmação ou erro junto ao botão.

Validação: build de produção, 80 testes, testes de navegador para local cadastrado e local externo; teste transacional no banco verificou gravação, leitura anônima, bloqueio de duplicatas e proteção da identidade privada. O teste no banco foi revertido sem deixar avaliações fictícias.
