# Apoio na Rede — funcionalidades propostas para validação

Data: 5 de outubro de 2026.

Status: proposta para avaliação. Este documento não representa funcionalidades já implementadas nem aprovação de execução.

## Objetivo

Evoluir o Apoio na Rede de um catálogo de informações para uma ferramenta que ajude as pessoas a planejar visitas e passeios conforme suas necessidades de acessibilidade, considerando o destino, o entorno e os pontos de apoio.

O projeto já conta com mapa, busca de locais, critérios de acessibilidade, avaliações, cadastro de profissionais e relatos de rotas. As propostas abaixo ampliam essa base.

## Resumo para decisão

Marque apenas uma decisão por funcionalidade. As prioridades são sugestões e podem ser alteradas.

| Funcionalidade | Prioridade sugerida | Decisão |
| --- | --- | --- |
| Compatibilidade com minhas necessidades | Primeira etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |
| Prévia da visita com evidências | Primeira etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |
| Mapa de barreiras urbanas | Primeira etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |
| Informações de acessibilidade sensorial | Segunda etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |
| Planejador de passeio acessível | Segunda etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |
| Painel de melhorias para estabelecimentos | Terceira etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |
| Painel de impacto de Cataguases | Terceira etapa | [ ] Aprovar / [ ] Ajustar / [ ] Adiar / [ ] Rejeitar |

## 1. Compatibilidade com minhas necessidades

### Objetivo

Ajudar a pessoa a entender quais recursos de um local atendem às suas necessidades e o que ainda precisa ser confirmado.

### Escopo proposto

- Criar um perfil opcional com necessidades concretas: entrada sem degraus, banheiro adaptado, espaço de circulação, atendimento em Libras, ambiente tranquilo e outros critérios disponíveis.
- Permitir definir requisitos indispensáveis e preferências.
- Comparar o perfil com os critérios cadastrados de cada estabelecimento.
- Mostrar requisitos atendidos, não atendidos e sem informação.
- Explicar a compatibilidade nos resultados da busca e na página do local.
- Permitir editar ou limpar as preferências.

### Exemplo

“Este local atende 4 dos seus 5 requisitos. A entrada sem degraus foi informada; o banheiro adaptado ainda não foi confirmado.”

### Dependências e APIs

Não exige uma nova API externa nem IA. A comparação pode ser feita com regras em TypeScript. A primeira versão pode guardar preferências no navegador; sincronização entre dispositivos exige backend.

### Critérios de validação

- [ ] O usuário consegue escolher e alterar necessidades sem informar um diagnóstico.
- [ ] A comparação explica cada resultado.
- [ ] Informação desconhecida não é tratada como recurso ausente ou presente.
- [ ] Um requisito indispensável não atendido aparece em destaque.
- [ ] O resultado não é apresentado como certificação de acessibilidade.

Observações para ajuste: _______________________________________________

## 2. Prévia da visita com evidências

### Objetivo

Permitir que a pessoa antecipe o que encontrará ao chegar ao estabelecimento.

### Escopo proposto

- Organizar fotos por ambiente ou recurso: entrada, circulação, banheiro e atendimento.
- Apresentar uma sequência de visita, da chegada aos espaços internos.
- Associar descrições, observações e medidas às fotos, quando disponíveis.
- Identificar a origem da informação e a data da última confirmação de cada recurso.
- Permitir sinalizar informação desatualizada ou divergente.
- Diferenciar informação declarada pelo estabelecimento, relato comunitário e verificação documentada.

### Exemplo

Antes de visitar um restaurante, a pessoa consulta a entrada, verifica a circulação entre as mesas e vê uma foto do banheiro com observações sobre os recursos disponíveis.

### Dependências e APIs

Não exige uma API especializada. A experiência pode ser construída no frontend. Fotos compartilhadas exigem armazenamento de arquivos e backend para seus metadados e revisão.

### Critérios de validação

- [ ] As fotos estão associadas a ambientes ou recursos específicos.
- [ ] A sequência pode ser utilizada por teclado e possui descrições textuais.
- [ ] A origem e a data das informações ficam visíveis.
- [ ] Recursos sem fotos ou medidas aparecem como informação incompleta.
- [ ] O usuário consegue reportar divergências para revisão.

Observações para ajuste: _______________________________________________

## 3. Mapa de barreiras urbanas

### Objetivo

Registrar obstáculos no entorno dos locais e acompanhar mudanças nas condições urbanas.

### Escopo proposto

- Relatar calçada bloqueada, rampa danificada, obra, elevador indisponível e outras barreiras.
- Registrar localização, categoria, descrição, foto opcional e data da observação.
- Exibir barreiras no mapa existente, com filtros por tipo e situação.
- Permitir que outras pessoas confirmem a ocorrência ou relatem sua resolução.
- Mostrar histórico e situações como relatada, confirmada, resolução relatada e resolvida após revisão.
- Permitir denunciar registros incorretos ou abusivos.
- Exibir também uma lista acessível de ocorrências.

### Exemplo

Uma pessoa relata uma calçada bloqueada perto de uma clínica. O registro aparece no mapa com a data e as confirmações recebidas. Quando o obstáculo é removido, a resolução pode ser documentada.

### Dependências e APIs

Pode aproveitar a integração de mapas já existente. Não exige uma nova API para registrar barreiras. O uso comunitário exige backend, armazenamento de fotos e moderação.

### Critérios de validação

- [ ] É possível cadastrar uma barreira e localizar o registro no mapa e na lista.
- [ ] Data, origem e situação aparecem de forma clara.
- [ ] Confirmações e atualizações preservam o histórico.
- [ ] Há fluxo de revisão para denúncias e mudanças de situação.
- [ ] O sistema não afirma que um trajeto está livre de obstáculos apenas por não haver relatos.

Observações para ajuste: _______________________________________________

## 4. Informações de acessibilidade sensorial

### Objetivo

Ampliar as informações sobre ambientes para pessoas com necessidades sensoriais.

### Escopo proposto

- Registrar observações sobre ruído, iluminação intensa, filas e aglomeração.
- Informar espaços de descanso e horários relatados como mais tranquilos.
- Associar as observações a data, horário e fonte.
- Permitir filtrar locais conforme preferências sensoriais.
- Integrar esses critérios à compatibilidade personalizada.

### Exemplo

Um local informa que possui uma área de descanso. Relatos recentes indicam menor movimento nas manhãs de determinados dias, ajudando a pessoa a escolher quando visitar.

### Dependências e APIs

Não exige API externa. Os dados podem ser preenchidos por estabelecimentos e pela comunidade. Relatos compartilhados exigem backend.

### Critérios de validação

- [ ] Os critérios sensoriais possuem descrições compreensíveis.
- [ ] Relatos mostram o contexto de data e horário.
- [ ] Observações subjetivas são identificadas como relatos, sem simular medições técnicas.
- [ ] Ausência de informação não equivale a ambiente tranquilo.
- [ ] Os critérios podem ser usados nas preferências e na busca.

Observações para ajuste: _______________________________________________

## 5. Planejador de passeio acessível

### Objetivo

Organizar uma saída com vários destinos, pausas e pontos de apoio, reunindo as informações das outras funcionalidades.

### Escopo proposto

- Adicionar vários destinos a um roteiro.
- Organizar a ordem das visitas e inserir pausas.
- Consultar banheiros e pontos de apoio cadastrados próximos aos destinos.
- Resumir a compatibilidade de cada local com as necessidades selecionadas.
- Apresentar informações desconhecidas e barreiras relatadas no entorno.
- Salvar o roteiro; compartilhar quando houver persistência remota.
- Em uma evolução posterior, calcular trajetos entre as paradas e comparar alternativas com dados de acessibilidade disponíveis.

### Exemplo

“Preciso ir a uma consulta e almoçar depois. Uso cadeira de rodas.” A pessoa seleciona destinos, consulta evidências dos acessos, inclui um ponto de apoio e identifica o que precisa confirmar antes de sair.

### Dependências e APIs

Organizar destinos e pausas não exige uma nova API. Calcular trajetos pelas ruas depende de um serviço de rotas ou de infraestrutura própria. O projeto já possui integrações de mapas e rotas que devem ser avaliadas para esse uso.

Uma rota calculada não é automaticamente uma rota acessível. Para recomendar trajetos conforme necessidades, será necessário combinar a geometria da rota com dados de trechos, obstáculos e verificações. A primeira versão pode limitar-se ao planejamento das visitas e à consulta das informações disponíveis.

### Critérios de validação

- [ ] O usuário consegue adicionar, remover e reordenar destinos.
- [ ] O roteiro reúne recursos, pendências e pontos de apoio.
- [ ] Trajetos calculados e trechos conferidos são identificados separadamente.
- [ ] O sistema informa quando não possui dados suficientes sobre um trecho.
- [ ] Falhas no serviço de rotas não impedem consultar o roteiro salvo.

Observações para ajuste: _______________________________________________

## 6. Painel de melhorias para estabelecimentos

### Objetivo

Ajudar responsáveis por estabelecimentos a organizar e documentar melhorias de acessibilidade.

### Escopo proposto

- Gerar uma lista de ações a partir de critérios ausentes ou ainda não verificados.
- Permitir definir responsável, prazo e situação de cada ação.
- Registrar evidências de melhorias realizadas.
- Mostrar o progresso e o histórico de atualizações.
- Publicar melhorias documentadas após o fluxo de revisão definido.
- Permitir que a comunidade consulte mudanças e relate divergências.

### Exemplo

O estabelecimento identifica que faltam informações sobre o banheiro, cria uma tarefa para documentá-lo e registra fotos após uma melhoria. A atualização fica disponível conforme a revisão prevista.

### Dependências e APIs

Não exige API especializada nem IA. Exige autenticação, vínculo entre responsável e estabelecimento, backend, armazenamento de evidências e revisão para publicação compartilhada.

### Critérios de validação

- [ ] Apenas responsáveis autorizados podem gerenciar as tarefas do estabelecimento.
- [ ] Critérios desconhecidos geram ações de verificação, sem serem classificados automaticamente como inadequações.
- [ ] Tarefas podem ser acompanhadas por situação e prazo.
- [ ] Melhorias publicadas apresentam evidências e data.
- [ ] Concluir uma tarefa não gera certificação automática de acessibilidade.

Observações para ajuste: _______________________________________________

## 7. Painel de impacto de Cataguases

### Objetivo

Tornar visível a cobertura do projeto e os resultados das contribuições da comunidade.

### Escopo proposto

- Mostrar quantidade de locais mapeados por bairro e categoria.
- Mostrar locais com informações recentes, segundo um período definido.
- Apresentar barreiras relatadas e resolvidas no período.
- Identificar bairros com poucos registros e informações incompletas.
- Permitir filtros por bairro, período e categoria.
- Oferecer tabelas acessíveis junto aos gráficos.

### Exemplo

O painel mostra quais bairros possuem mais estabelecimentos documentados e onde faltam informações, orientando novas ações de mapeamento.

### Dependências e APIs

Não exige API externa para os indicadores. Eles podem ser calculados a partir do banco do projeto. Agrupamentos por bairro dependem de dados de localização consistentes; uma primeira versão pode usar o bairro informado no cadastro.

### Critérios de validação

- [ ] Cada indicador possui definição, período e fonte claros.
- [ ] Registros pendentes não são contados como verificados.
- [ ] Relatos de resolução são diferenciados de resoluções revisadas.
- [ ] Poucos registros em um bairro são apresentados como baixa cobertura de dados.
- [ ] Gráficos possuem alternativa textual ou tabular.

Observações para ajuste: _______________________________________________

## Base técnica e operacional para as funcionalidades

Estas melhorias sustentam o uso compartilhado e devem ser consideradas junto ao escopo aprovado:

- **Persistência e sincronização:** compartilhar cadastros, relatos, fotos e roteiros entre usuários e dispositivos. Pelo README atual, parte dos dados permanece no navegador e a publicação/moderação remota ainda precisa ser integrada.
- **Autenticação e permissões:** identificar quem pode editar estabelecimentos, revisar contribuições e administrar ocorrências.
- **Moderação:** definir revisão, denúncias, correções e histórico de alterações.
- **Qualidade dos dados:** registrar fonte, data e situação de verificação por informação, evitando depender apenas de um selo geral do local.
- **Armazenamento de fotos:** permitir upload e acesso às evidências compartilhadas.
- **Acessibilidade da interface:** manter navegação por teclado, descrições textuais e alternativas ao mapa e aos gráficos.

O backend pode ser próprio ou gerenciado. Não é obrigatório contratar novas APIs para a lógica das funcionalidades. A integração de mapas existente continua sendo uma dependência externa; custos e limites precisam ser avaliados conforme o serviço e o volume de uso antes da implementação.

## Sequência sugerida

1. Consolidar a persistência compartilhada e o fluxo mínimo de revisão necessários ao escopo escolhido.
2. Implementar compatibilidade personalizada e prévia da visita com evidências.
3. Adicionar o mapa de barreiras urbanas.
4. Ampliar critérios sensoriais e reunir os recursos no planejador de passeio.
5. Criar os painéis de melhorias e de impacto.

Essa sequência é uma proposta de priorização, sem estimativa de prazo ou compromisso de implementação. Não há necessidade de IA na primeira etapa.

## Validação geral

- [ ] A proposta de ajudar a planejar visitas e passeios representa a direção desejada para o projeto.
- [ ] As prioridades sugeridas foram revisadas.
- [ ] As funcionalidades aprovadas possuem escopo inicial definido.
- [ ] As dependências de backend, armazenamento e moderação foram consideradas.
- [ ] O planejador inicial foi delimitado entre organização de visitas e cálculo de trajetos.

Funcionalidades escolhidas para a primeira entrega: ______________________

Ajustes de escopo: _____________________________________________________

Responsável pela validação: ____________________________________________

Data da validação: _____________________________________________________
