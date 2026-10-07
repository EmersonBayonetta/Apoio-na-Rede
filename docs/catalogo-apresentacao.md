# Catálogo de apresentação

Os avisos e painéis de importação foram removidos das telas públicas de rotas e profissionais.

Foram preparados 20 exemplos fictícios: nove locais (um por categoria), cinco rotas e seis profissionais. Os profissionais cobrem os cinco grupos de necessidades atendidas. Cada local tem endereço, descrição, imagem ilustrativa, horário, campos de contato e os 12 recursos de acessibilidade preenchidos. Os contatos são explicitamente ilustrativos e não utilizam números de terceiros ou registros profissionais válidos.

Os exemplos aparecem somente nas categorias/listas online sem cadastros reais. Não mascaram falhas de consulta ao banco: erros continuam sendo informados. Não são inseridos no Supabase e não modificam tabelas, RLS ou permissões. Cada card é identificado como demonstração. Links de contatos e trajetos fictícios não são oferecidos; nos locais de exemplo, relatos e avaliações estão desativados. O filtro de locais conferidos não inclui demonstrações. Ao receber dados reais, a categoria ou lista correspondente deixa de apresentar os exemplos.

O teste unitário confere o limite de 20, IDs únicos, nove categorias, cinco necessidades, recursos completos e ausência de status verificado. Os testes de navegador verificam todas as categorias, persistência da página de detalhe, ausência de importação e de contatos acionáveis, layout móvel e manutenção do fluxo de envio real para revisão.
