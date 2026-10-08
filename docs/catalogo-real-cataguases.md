# Catálogo real de Cataguases

Pesquisa realizada em 07/10/2026. O catálogo online usa os registros do banco existente e a descoberta do Google/OpenStreetMap; os exemplos fictícios deixaram de ser usados como preenchimento automático.

Foram publicados nove locais, três profissionais e cinco ligações entre endereços reais. Os dados e suas fontes estão em `database/public_catalog_cataguases.json`; a carga idempotente `database/public_catalog_cataguases.sql` preserva os cadastros existentes. Telefones e WhatsApp aparecem somente quando a fonte publica o contato como tal. Não foram copiadas avaliações de outros sites nem declarados recursos de acessibilidade sem confirmação.

## Fontes

- [Prefeitura — contato](https://www.cataguases.mg.gov.br/portal/contato): endereço, telefone, e-mail e horário da administração municipal.
- [Secretaria de Cultura e Turismo](https://www.cataguases.mg.gov.br/portal/secretarias/21/secretaria-de-cultura-e-turismo): endereço e contato institucional da Casa de Cultura Dona Catarina. Horário da secretaria não é presumido como horário de visitação.
- [Hotel Cataguases](https://www.hotelcataguases.com.br/): endereço e telefone/WhatsApp do hotel.
- [Restaurante do Hotel — Tripadvisor](https://www.tripadvisor.com.br/Restaurant_Review-g1102709-d7158257-Reviews-Restaurante_Do_Hotel_Cataguases-Cataguases_State_of_Minas_Gerais.html): endereço do restaurante e telefone institucional; avaliações e alegações de acessibilidade não foram importadas.
- [Supermercado Morais — Guia Cataguases](https://www.guiacataguases.com.br/index.php/home-2/alimentos-e-bebidas/supermercados/95-supermercado-morais-centro): endereço e telefone comercial. O site próprio não forneceu esses dados em texto acessível durante a consulta.
- [IF Sudeste MG — Fale Conosco](https://www.ifsudestemg.edu.br/cataguases/fale-conosco/fale-conosco/): endereço atual na Rua Romualdo Menezes, 701; secretaria e contatos. As referências antigas à Chácara Granjaria não foram usadas.
- [Studio Thamyres Lobo](https://thamyreslobopilates.com/): endereço, WhatsApp, horário e identificação de Thamyres Lobo e Micaelly Saraiva. Para ambas, o telefone é o contato do studio. Não foi inventado registro no conselho nem atendimento específico por deficiência.
- [Fernanda Resende](https://psifernandaresende.com.br/): endereço profissional, WhatsApp e registro CRP divulgado no site.
- [APAE — contato institucional](https://apaecataguases.webnode.com.br/contato/): endereço, telefone, e-mail e horário publicado. Disponibilidade atual de serviços depende da entidade.
- [Rodoviária — serviço de passagens](https://www.viacaocatedral.queropassagem.com.br/rodoviaria-de-cataguases): endereço do terminal. Os telefones divergem entre o portal municipal e vendedores de passagem, por isso não foi escolhido um número como confirmado.

As rotas ligam esses endereços pelo Google Maps em modo a pé. Não são auditorias de calçadas: distâncias, tempos, rampas e travessias não foram inventados. A publicação da ligação não confirma acessibilidade nem segurança. A categoria Banheiro Adaptado permanece sem carga pesquisada porque não encontramos comprovação suficiente de acesso e adaptação.

Coordenadas obtidas por geocodificação de ruas são apenas referências aproximadas. Alguns registros sem ponto exato usam a referência da cidade. Todos esses registros têm `coordenadas_confirmadas=false`: não exibem distância, não são ordenados por proximidade e não calculam trajeto interno até esse ponto. A navegação usa o endereço completo e, quando identificado na busca pública, o Place ID do Google.

Para locais descobertos no Google, a tela consulta telefone, website e horário com `Place.fetchFields()` ao abrir o local. Falhas de quota ou de rede não substituem contatos por valores fictícios. Não se presume WhatsApp a partir de um telefone comum.

## Novos envios

Compartilhar um trecho e Cadastrar profissional usam o mesmo endpoint seguro de locais, sem login do colaborador. O servidor grava somente campos permitidos e estado pendente, e solicita ao Supabase um link para a revisão do titular. A página `/revisao` decide um cadastro por vez. Conhecer a URL, confirmar outro e-mail ou enviar `status=verificado` não autoriza publicação.

As migrações `directory_email_review.sql` e `registration_shared_limits.sql` foram aplicadas ao banco existente. Os limites de três cadastros por origem em 24 horas e cem por dia são compartilhados entre os três formulários. Os limites e restrições do envio padrão do Supabase continuam válidos; cadastro salvo não garante entrega do aviso. Veja [cadastro e revisão](cadastro-revisao-supabase.md).

As avaliações do site foram preservadas. O visual mostra média, contagem, distribuição de estrelas, filtros e relato, sem avaliações de demonstração nos registros reais. A galeria de fotos foi removida da página de cada local; fotos de evidência de relatos e revisão continuam disponíveis.
