# Prontidão para Apresentação Specification

## Problem Statement

A auditoria de 2026-10-05 mostrou que o app promete "trace sua rota", mas não traça rota nenhuma: a função de rota a pé existe e nenhuma tela a usa. A primeira tela não diz o que o app faz, e no celular a busca fica abaixo da dobra. A barra inferior tem 7 itens com ícones repetidos. Existem dois menus de "acessibilidade" com papéis confusos, e há falhas pontuais de WCAG: um filtro sem rótulo, alvos de toque abaixo de 24 px e um botão flutuante que cobre o conteúdo. Telas vazias não explicam o motivo. O projeto precisa ser apresentável, com a proposta de valor clara.

## Goals

- [ ] Em 5 segundos, quem abre o app entende o que ele faz: saber se um lugar é acessível para você e como chegar.
- [ ] Toda promessa da interface e do README corresponde a algo que o app faz.
- [ ] A pessoa calcula uma rota a pé até um local, dentro do app, com distância e tempo.
- [ ] As falhas de WCAG encontradas na auditoria estão corrigidas.
- [ ] A navegação tem 5 destinos claros, cada um com link próprio.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Mapa interativo na tela Explorar | Foi retirado por causa da cota do Google; depende de chave e custo |
| Instruções de rota passo a passo | O serviço retorna manobras em inglês; a tradução é uma feature própria |
| Rota acessível para cadeira de rodas | Não há dados de calçadas; a rota calculada é só a pé e não verificada |
| Dados de exemplo em produção | Dados fictícios de acessibilidade enganariam quem depende deles |
| Backend, contas e moderação | Feature própria (base técnica do documento de propostas) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Título principal | "Saiba se um lugar é acessível para você antes de sair." | Diz o valor em uma frase | y (pedido: proposta de valor clara) |
| Como funciona | Faixa com 3 passos: "Diga do que você precisa", "Encontre o local", "Veja como chegar" | Mostra o fluxo inteiro sem texto longo | y |
| Rota no app | Botão "Calcular rota a pé" na página do local, usando a localização autorizada e `fetchWalkingRoute` (OpenStreetMap); mostra distância, tempo e aviso de rota não verificada | Reaproveita código existente e testado | y |
| Link externo | "Abrir no Google Maps" com `travelmode=walking` | O link atual não define modo; o padrão pode ser carro | y |
| Dois menus | "Ajustes" vira "Minhas necessidades" (requisitos e perfil). O botão flutuante "Acessibilidade" segue para exibição e leitura. Cada um tem um link para o outro | Separa "o que eu preciso dos lugares" de "como o site aparece" | y |
| Navegação | 5 destinos: Explorar, Rotas, Profissionais, Cadastrar, Minhas necessidades. "Buscar" e "Catálogo" saem (são partes de Explorar) | Menos itens e sem ícones repetidos | y |
| Abas na URL | Parâmetro `aba` com `rotas`, `profissionais` ou `cadastro`; sem parâmetro = Explorar | Links compartilháveis e recarga sem perder a tela | y |
| Tamanho mínimo dos alvos | 24×24 px (WCAG 2.2, 2.5.8), exceto links dentro de frases | Critério AA | y |
| Item antigo do cadastro | Remover "Espaço com baixo ruído sonoro e iluminação suave (horário/sala silenciosa)" dos itens padrão | Sobrepõe os 3 critérios sensoriais | y |
| Testes antigos | Atualizar `tests/browser-regressions.mjs` para a interface atual (o botão "Lista" não existe) | O teste está desatualizado, não o app | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Proposta de valor clara ⭐ MVP

**User Story**: Como pessoa que abre o app pela primeira vez, quero entender na hora o que ele faz por mim.

**Acceptance Criteria**:

1. The system SHALL exibir como título principal (h1) da tela Explorar "Saiba se um lugar é acessível para você antes de sair." <!-- PRES-01 -->
2. The system SHALL exibir na tela Explorar uma seção "Como funciona" com os 3 passos "Diga do que você precisa", "Encontre o local" e "Veja como chegar". <!-- PRES-02 -->
3. WHILE a largura da tela é de até 600 px the system SHALL mostrar o campo de busca inteiro dentro da primeira tela (sem rolar), em uma tela de 360×780. <!-- PRES-03 -->
4. The system SHALL não exibir o texto "Trace sua rota" em nenhuma tela. <!-- PRES-04 -->
5. The system SHALL ter um README que começa pela proposta de valor e lista só recursos existentes, sem as seções do modelo Vite. <!-- PRES-05 -->

**Independent Test**: Abrir o app em 360×780 e ver título, passos e busca sem rolar.

---

### P1: Rota a pé no app ⭐ MVP

**User Story**: Como pessoa que vai visitar um local, quero saber a distância e o tempo a pé a partir de onde estou.

**Acceptance Criteria**:

1. WHEN a pessoa aciona "Calcular rota a pé" na página do local e autoriza a localização THEN the system SHALL exibir a distância e o tempo estimado da rota a pé (formato "1,2 km · 15 min"). <!-- PRES-06 -->
2. WHEN a rota é exibida THEN the system SHALL mostrar o aviso "Rota calculada pelo OpenStreetMap. Não verifica calçadas, rampas ou obstáculos." <!-- PRES-07 -->
3. IF a localização é negada ou o serviço de rotas falha THEN the system SHALL exibir uma mensagem em `role="alert"` com o motivo e manter o link "Abrir no Google Maps". <!-- PRES-08 -->
4. The system SHALL abrir os links de direção dos cards e da página do local no Google Maps com `travelmode=walking`. <!-- PRES-09 -->

**Independent Test**: Na página de um local, com localização simulada, ver "… km · … min" e o aviso.

---

### P1: Acessibilidade da interface ⭐ MVP

**User Story**: Como pessoa com deficiência, quero que todos os controles sejam operáveis e nomeados.

**Acceptance Criteria**:

1. The system SHALL dar ao filtro de necessidade da tela Profissionais o nome acessível "Filtrar por necessidade atendida". <!-- PRES-10 -->
2. The system SHALL ter todos os botões e links visíveis fora de frases com pelo menos 24×24 px nas telas Explorar, Rotas e Profissionais, em 360 e 1280 px de largura. <!-- PRES-11 -->
3. WHEN a página é rolada até o fim THEN the system SHALL não sobrepor o botão flutuante "Acessibilidade" a nenhum botão ou link. <!-- PRES-12 -->

**Independent Test**: Rodar a checagem automática de alvos e nomes nas três telas.

---

### P1: Navegação simples ⭐ MVP

**User Story**: Como pessoa que usa o app, quero poucos destinos claros e links que funcionem ao recarregar.

**Acceptance Criteria**:

1. The system SHALL oferecer exatamente 5 destinos na navegação do celular e do desktop: "Explorar", "Rotas", "Profissionais", "Cadastrar" e "Minhas necessidades" (no desktop, "Rotas acessíveis" e "Cadastrar local" são aceitos como rótulos). <!-- PRES-13 -->
2. The system SHALL usar um ícone diferente para cada destino da navegação do celular. <!-- PRES-14 -->
3. The system SHALL exibir os rótulos da navegação do celular com pelo menos 12 px. <!-- PRES-15 -->
4. WHEN a pessoa abre Rotas, Profissionais ou Cadastrar THEN the system SHALL refletir a tela na URL (`?aba=rotas`, `?aba=profissionais`, `?aba=cadastro`). <!-- PRES-16 -->
5. WHEN a página é aberta ou recarregada com `?aba=` THEN the system SHALL abrir a tela correspondente. <!-- PRES-17 -->
6. WHEN a pessoa usa o botão Voltar do navegador THEN the system SHALL voltar à tela anterior. <!-- PRES-18 -->
7. The system SHALL chamar o diálogo de perfil de "Minhas necessidades" e incluir nele o link "Opções de exibição e leitura", que abre o painel de acessibilidade. <!-- PRES-19 -->
8. The system SHALL incluir no painel de acessibilidade o link "Minhas necessidades", que abre o diálogo de perfil. <!-- PRES-20 -->

**Independent Test**: Abrir `/?aba=rotas`, recarregar, voltar; contar 5 itens na navegação.

---

### P2: Telas vazias que explicam

**User Story**: Como pessoa que encontra uma tela sem resultados, quero saber o motivo e o que fazer.

**Acceptance Criteria**:

1. WHILE não há trechos cadastrados e a busca está vazia the system SHALL exibir "Ainda não há trechos compartilhados." e o botão "Compartilhar um trecho". <!-- PRES-21 -->
2. WHILE não há profissionais cadastrados e a busca está vazia the system SHALL exibir "Ainda não há profissionais cadastrados." e o botão "Cadastrar profissional". <!-- PRES-22 -->
3. IF os locais do Google falham e o catálogo fica vazio THEN the system SHALL exibir "Os locais próximos não carregaram." com "Tentar novamente", sem sugerir limpar filtros. <!-- PRES-23 -->

**Independent Test**: Abrir Rotas sem dados e ver o convite para compartilhar.

---

### P2: Limpeza de dados

**User Story**: Como pessoa que cadastra ou consulta, quero informações sem duplicidade nem links quebrados.

**Acceptance Criteria**:

1. The system SHALL não listar no cadastro o item "Espaço com baixo ruído sonoro e iluminação suave (horário/sala silenciosa)". <!-- PRES-24 -->
2. IF o WhatsApp salvo começa com 0 (após o 55 opcional) THEN the system SHALL não gerar link de WhatsApp. <!-- PRES-25 -->
3. The system SHALL ter `tests/browser-regressions.mjs` passando contra a interface atual. <!-- PRES-26 -->

---

## Edge Cases

- IF a pessoa abre `?aba=` com valor desconhecido THEN the system SHALL abrir Explorar.
- WHEN a pessoa abre um local por `?local=` THEN the system SHALL manter o comportamento atual (o parâmetro `local` tem prioridade sobre `aba`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PRES-01 | P1: Proposta de valor | Tasks | Implementing |
| PRES-02 | P1: Proposta de valor | Tasks | Implementing |
| PRES-03 | P1: Proposta de valor | Tasks | Implementing |
| PRES-04 | P1: Proposta de valor | Tasks | Implementing |
| PRES-05 | P1: Proposta de valor | Tasks | In Tasks |
| PRES-06 | P1: Rota a pé | Tasks | Implementing |
| PRES-07 | P1: Rota a pé | Tasks | Implementing |
| PRES-08 | P1: Rota a pé | Tasks | Implementing |
| PRES-09 | P1: Rota a pé | Tasks | Implementing |
| PRES-10 | P1: Acessibilidade | Tasks | In Tasks |
| PRES-11 | P1: Acessibilidade | Tasks | In Tasks |
| PRES-12 | P1: Acessibilidade | Tasks | In Tasks |
| PRES-13 | P1: Navegação | Tasks | In Tasks |
| PRES-14 | P1: Navegação | Tasks | In Tasks |
| PRES-15 | P1: Navegação | Tasks | In Tasks |
| PRES-16 | P1: Navegação | Tasks | In Tasks |
| PRES-17 | P1: Navegação | Tasks | In Tasks |
| PRES-18 | P1: Navegação | Tasks | In Tasks |
| PRES-19 | P1: Navegação | Tasks | In Tasks |
| PRES-20 | P1: Navegação | Tasks | In Tasks |
| PRES-21 | P2: Telas vazias | Tasks | In Tasks |
| PRES-22 | P2: Telas vazias | Tasks | In Tasks |
| PRES-23 | P2: Telas vazias | Tasks | In Tasks |
| PRES-24 | P2: Limpeza | Tasks | In Tasks |
| PRES-25 | P2: Limpeza | Tasks | Implementing |
| PRES-26 | P2: Limpeza | Tasks | In Tasks |

**Coverage:** 26 total, 26 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Em 360×780, título, passos e busca aparecem sem rolar.
- [ ] A checagem automática não encontra controle sem nome nem alvo abaixo de 24 px nas telas principais.
- [ ] `npm test`, `npm run test:browser`, os testes de navegador das features e `npm run build` passam.
