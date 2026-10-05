Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |Implementing |# Compatibilidade com Minhas Necessidades Specification

## Problem Statement

Hoje a pessoa vê a lista de recursos de cada local (Sim, Não, Não verificado) e precisa conferir sozinha se o local serve para ela. A preferência existente é por tipo de deficiência, que é quase um diagnóstico e não diz qual recurso importa. Esta feature deixa a pessoa marcar requisitos concretos e mostra, em cada local, o que atende, o que não atende e o que ainda não foi informado.

## Goals

- [ ] A pessoa sabe, pelo card ou pela página do local, quantos dos seus requisitos o local atende.
- [ ] Um requisito indispensável não atendido fica em destaque.
- [ ] Informação desconhecida nunca conta como atendida nem como ausente.
- [ ] Nada sai do navegador.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Sincronizar requisitos entre dispositivos | Precisa de backend e consentimento LGPD (dado sensível de saúde) |
| Relatos sensoriais com data e horário (ruído, lotação) | Subjetivos e comunitários; precisam de backend |
| Ordenar resultados por compatibilidade | Decidido: a ordem atual não muda |
| Filtrar pinos do mapa | O filtro vale só para a lista de resultados nesta versão |
| Remover a preferência atual por tipo de deficiência | Continua existindo e usada na busca; não muda |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Critérios sensoriais | 3 recursos fixos: `area_descanso`, `iluminacao_ajustavel`, `horario_tranquilo` | Decidido com o usuário | y |
| Efeito na busca | Selo em cada card + filtro opcional, desligado por padrão | Decidido com o usuário | y |
| Onde editar | Nova seção "Meus requisitos" no modal "Ajustes" existente | Já é o lugar das preferências | n |
| Níveis | "Indispensável", "Desejável", "Não preciso" (padrão) | Atende "indispensáveis e preferências" da proposta | n |
| Armazenamento | `browserStorage`, chave `apoio_requirements_v1` | Mesmo padrão das preferências atuais | n |
| Tipo dos recursos sensoriais no cadastro | `intelectual` (rótulo "Intelectual / sensorial") | Hoje o cadastro marca recursos extras como `mobilidade`, o que estaria errado | n |
| Local sem cadastro (só Google/OSM) | Todos os requisitos contam como sem informação | Não há critérios para comparar | n |
| Filtro e mapa | O filtro afeta só a lista de resultados | Menor mudança; o mapa continua mostrando todos os pinos | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Definir meus requisitos ⭐ MVP

**User Story**: Como pessoa com necessidades de acessibilidade, quero marcar os recursos de que preciso, sem informar diagnóstico, para que o app compare os locais comigo.

**Acceptance Criteria**:

1. The system SHALL oferecer, na seção "Meus requisitos" do modal "Ajustes", cada um dos 12 recursos com os níveis "Indispensável", "Desejável" e "Não preciso", com "Não preciso" como padrão. <!-- COMP-01 -->
2. WHEN a pessoa salva os requisitos THEN the system SHALL guardá-los em `apoio_requirements_v1` e restaurá-los ao recarregar a página. <!-- COMP-02 -->
3. WHEN a pessoa aciona "Limpar requisitos" THEN the system SHALL voltar todos os recursos para "Não preciso". <!-- COMP-03 -->
4. IF o valor guardado for inválido ou tiver recursos ou níveis desconhecidos THEN the system SHALL ignorar essas entradas e tratá-las como "Não preciso". <!-- COMP-04 -->
5. The system SHALL não pedir tipo de deficiência nem diagnóstico na seção "Meus requisitos". <!-- COMP-05 -->

**Independent Test**: Marcar "Banheiro PCD" como indispensável, recarregar e ver a marcação mantida.

---

### P1: Comparar um local com meus requisitos ⭐ MVP

**User Story**: Como pessoa planejando uma visita, quero ver o que o local atende e o que falta confirmar.

**Acceptance Criteria**:

1. WHEN há requisitos marcados THEN the system SHALL classificar cada um como "atendido" (recurso Sim), "não atendido" (recurso Não) ou "sem informação" (recurso Não verificado), usando `resourceState`. <!-- COMP-06 -->
2. WHEN há N requisitos marcados e X atendidos THEN the system SHALL exibir o texto "Atende X de N requisitos". <!-- COMP-07 -->
3. The system SHALL nunca contar um requisito sem informação como atendido ou como não atendido. <!-- COMP-08 -->
4. WHEN um requisito indispensável está não atendido THEN the system SHALL exibir em destaque "Requisito indispensável não atendido: [rótulo do recurso]". <!-- COMP-09 -->
5. WHEN há requisitos marcados THEN the system SHALL listar no resumo de acessibilidade do local (popup do mapa e painel do local) os requisitos agrupados em "Atendidos", "Não atendidos" e "Sem informação". <!-- COMP-10 -->
6. WHILE não há requisitos marcados the system SHALL não exibir compatibilidade. <!-- COMP-11 -->
7. WHEN a compatibilidade é exibida THEN the system SHALL mostrar a nota "Comparação com as informações cadastradas. Não é uma certificação de acessibilidade." <!-- COMP-12 -->

**Independent Test**: Com 5 requisitos e um local com 4 Sim e 1 Não verificado, o resumo mostra "Atende 4 de 5 requisitos" e o banheiro em "Sem informação".

---

### P1: Selo nos resultados da busca ⭐ MVP

**User Story**: Como pessoa buscando locais, quero ver a compatibilidade sem abrir cada local.

**Acceptance Criteria**:

1. WHEN há requisitos marcados e o card tem um local cadastrado THEN the system SHALL exibir no card o selo "Atende X de N requisitos". <!-- COMP-13 -->
2. WHEN o local do card tem requisito indispensável não atendido THEN the system SHALL exibir no selo o texto "Indispensável não atendido". <!-- COMP-14 -->
3. WHEN há requisitos marcados e o card não tem local cadastrado THEN the system SHALL exibir "Sem informações para seus requisitos". <!-- COMP-15 -->

**Independent Test**: Buscar um local cadastrado e ver o selo no card.

---

### P2: Filtro de indispensáveis

**User Story**: Como pessoa com um requisito sem o qual não consigo visitar, quero ocultar locais que não o atendem.

**Acceptance Criteria**:

1. WHEN há requisito indispensável marcado THEN the system SHALL exibir o filtro "Ocultar locais com requisito indispensável não atendido", desligado por padrão. <!-- COMP-16 -->
2. WHILE o filtro está ligado the system SHALL ocultar da lista de resultados os locais com pelo menos um requisito indispensável não atendido. <!-- COMP-17 -->
3. WHILE o filtro está ligado the system SHALL manter na lista os locais cujos indispensáveis estão apenas sem informação. <!-- COMP-18 -->

**Independent Test**: Com "Rampa" indispensável e o filtro ligado, um local com Rampa = Não some da lista e um local sem cadastro continua.

---

### P2: Critérios sensoriais

**User Story**: Como pessoa com necessidades sensoriais, quero saber se o local tem espaço tranquilo, iluminação suave ou horário com menos estímulos.

**Acceptance Criteria**:

1. The system SHALL incluir os recursos "Área de descanso ou espaço tranquilo", "Iluminação suave ou ajustável" e "Horário com menos estímulos" na lista de recursos, com os mesmos estados Sim, Não e Não verificado. <!-- COMP-19 -->
2. WHEN o cadastro de estabelecimento lista esses três recursos THEN the system SHALL associá-los ao tipo `intelectual`. <!-- COMP-20 -->

**Independent Test**: Cadastrar um local com "Área de descanso" = Sim e vê-lo como Sim no resumo.

---

## Edge Cases

- IF dois relatos do mesmo recurso se contradizem THEN the system SHALL tratar o requisito como sem informação (comportamento atual de `resourceState`).
- IF todos os requisitos são "Desejável" THEN the system SHALL não exibir o filtro de indispensáveis.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| COMP-01 | P1: Definir meus requisitos | Tasks | Implementing |
| COMP-02 | P1: Definir meus requisitos | Tasks | Implementing |
| COMP-03 | P1: Definir meus requisitos | Tasks | Implementing |
| COMP-04 | P1: Definir meus requisitos | Tasks | Implementing |
| COMP-05 | P1: Definir meus requisitos | Tasks | Implementing |
| COMP-06 | P1: Comparar um local | Tasks | Implementing |
| COMP-07 | P1: Comparar um local | Tasks | Implementing |
| COMP-08 | P1: Comparar um local | Tasks | Implementing |
| COMP-09 | P1: Comparar um local | Tasks | Implementing |
| COMP-10 | P1: Comparar um local | Tasks | Implementing |
| COMP-11 | P1: Comparar um local | Tasks | Implementing |
| COMP-12 | P1: Comparar um local | Tasks | Implementing |
| COMP-13 | P1: Selo nos resultados | Tasks | Implementing |
| COMP-14 | P1: Selo nos resultados | Tasks | Implementing |
| COMP-15 | P1: Selo nos resultados | Tasks | Implementing |
| COMP-16 | P2: Filtro de indispensáveis | Tasks | Implementing |
| COMP-17 | P2: Filtro de indispensáveis | Tasks | Implementing |
| COMP-18 | P2: Filtro de indispensáveis | Tasks | Implementing |
| COMP-19 | P2: Critérios sensoriais | Tasks | Implementing |
| COMP-20 | P2: Critérios sensoriais | Tasks | Implementing |

**Coverage:** 20 total, 20 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Uma pessoa com requisitos marcados descobre, em menos de 30 s, se um local atende aos seus indispensáveis.
- [ ] `npm test` e o teste de navegador cobrem COMP-01 a COMP-20.
- [ ] `npm run lint` e `npm run build` passam sem novos avisos.
