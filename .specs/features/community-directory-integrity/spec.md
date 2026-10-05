# Integridade do Catálogo Comunitário Specification

## Problem Statement

As telas de Rotas acessíveis e Profissionais (`CommunityDirectoryView`) aceitam cadastros com campos só de espaços e UF inválida, montam o link de WhatsApp a partir do telefone (inclusive números 0800) e fazem uma busca que diferencia acentos. As regras de validação e de busca que o restante do projeto já usa não foram aplicadas, e a tela não tem nenhum teste.

## Goals

- [ ] Nenhum cadastro inválido (campo obrigatório vazio, UF inválida, telefone/WhatsApp malformado) é salvo.
- [ ] A busca das duas seções ignora acentos, caixa e espaços repetidos, como a busca de locais.
- [ ] O botão de WhatsApp só aparece quando há um número de WhatsApp válido informado.
- [ ] As regras ficam em funções puras com testes em `npm test`.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Gravação no Supabase / moderação | Mudança grande, tratada como feature própria |
| Redesenho visual e navegação mobile | Melhoria separada já identificada |
| Abas na URL | Melhoria separada já identificada |
| Edição ou exclusão de cadastros | Não existe hoje; fora do escopo de correção |
| Validação de registro profissional (CRM, CREFITO etc.) | Formatos variam por conselho; campo continua opcional e livre |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Campo WhatsApp | Campo próprio e opcional, separado do telefone | Telefone fixo e 0800 não têm WhatsApp | n |
| Formato aceito para telefone | Opcional; se informado, 10 ou 11 dígitos após remover não dígitos, ou 0800 + 7 dígitos | Cobre fixo, celular com DDD e os 0800 dos dados de exemplo | n |
| Formato aceito para WhatsApp | Opcional; 10 ou 11 dígitos (DDD + número), ou 12–13 começando com 55 | Celular brasileiro com ou sem código do país | n |
| Link de WhatsApp | `https://wa.me/55` + DDD + número; não duplica o 55 | Evita `wa.me/5555...` | n |
| UF digitada em minúsculas | Converter para maiúsculas antes de validar e salvar | `mg` é uma digitação comum e não ambígua | n |
| Campos de texto | Salvar sem espaços nas pontas (trim) | Evita cadastros com espaços sobrando | n |
| Mensagem de erro | Exibida em elemento `role="alert"` no formulário; nada é salvo | Mesmo padrão de alerta acessível | n |
| Profissional sem necessidade marcada | Permitido | Hoje é permitido; restringir mudaria produto | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Cadastro de profissional validado ⭐ MVP

**User Story**: Como pessoa que cadastra um profissional, quero ser avisada quando um dado está errado para que o catálogo não tenha contatos quebrados.

**Acceptance Criteria**:

1. IF nome, especialidade, cidade ou estado contém apenas espaços THEN the system SHALL rejeitar o cadastro com a mensagem "Preencha nome, especialidade, cidade e estado." <!-- COMM-01 -->
2. IF o estado, após conversão para maiúsculas, não for uma das 27 UFs THEN the system SHALL rejeitar o cadastro com a mensagem "Informe uma UF válida." <!-- COMM-02 -->
3. IF o telefone informado não tiver 10 ou 11 dígitos nem o formato 0800 + 7 dígitos THEN the system SHALL rejeitar o cadastro com a mensagem "Informe um telefone com DDD." <!-- COMM-03 -->
4. IF o WhatsApp informado não tiver 10–11 dígitos, nem 12–13 dígitos começando com 55, THEN the system SHALL rejeitar o cadastro com a mensagem "Informe um WhatsApp com DDD." <!-- COMM-04 -->
5. WHEN o cadastro é válido THEN the system SHALL salvar os textos sem espaços nas pontas e a UF em maiúsculas. <!-- COMM-05 -->
6. IF o cadastro é rejeitado THEN the system SHALL exibir a mensagem em `role="alert"` e não adicionar o profissional à lista. <!-- COMM-06 -->

**Independent Test**: Submeter o formulário com estado "zz" mostra "Informe uma UF válida." e a lista não muda.

---

### P1: Link de WhatsApp correto ⭐ MVP

**User Story**: Como pessoa que procura atendimento, quero que o botão de WhatsApp abra a conversa certa.

**Acceptance Criteria**:

1. WHEN o WhatsApp tem 10 ou 11 dígitos THEN the system SHALL gerar o link `https://wa.me/55` seguido desses dígitos. <!-- COMM-07 -->
2. WHEN o WhatsApp já começa com 55 e tem 12 ou 13 dígitos THEN the system SHALL gerar o link `https://wa.me/` seguido dos dígitos, sem acrescentar outro 55. <!-- COMM-08 -->
3. IF o profissional não tem WhatsApp válido THEN the system SHALL omitir o botão de WhatsApp. <!-- COMM-09 -->
4. The system SHALL salvar o WhatsApp apenas a partir do campo WhatsApp, nunca copiando o telefone. <!-- COMM-10 -->

**Independent Test**: Um profissional com telefone "0800 770 7722" e sem WhatsApp não mostra botão de WhatsApp.

---

### P1: Cadastro de trecho validado ⭐ MVP

**User Story**: Como pessoa que compartilha um trecho, quero que relatos incompletos não sejam publicados.

**Acceptance Criteria**:

1. IF partida, destino, cidade ou condições observadas contém apenas espaços THEN the system SHALL rejeitar o trecho com a mensagem "Preencha partida, destino, cidade e condições observadas." <!-- COMM-11 -->
2. WHEN o trecho é válido THEN the system SHALL salvar os textos sem espaços nas pontas e o título como "partida → destino" já aparados. <!-- COMM-12 -->
3. IF o trecho é rejeitado THEN the system SHALL exibir a mensagem em `role="alert"` e não adicionar o trecho à lista. <!-- COMM-13 -->

**Independent Test**: Submeter "   " como destino mostra o alerta e a lista não muda.

---

### P2: Busca sem diferenciar acentos

**User Story**: Como pessoa que busca, quero encontrar "São José" digitando "sao jose".

**Acceptance Criteria**:

1. WHEN o termo de busca difere do texto do profissional apenas por acentos, caixa ou espaços repetidos THEN the system SHALL incluir o profissional no resultado. <!-- COMM-14 -->
2. WHEN o termo de busca difere do texto do trecho apenas por acentos, caixa ou espaços repetidos THEN the system SHALL incluir o trecho no resultado. <!-- COMM-15 -->
3. WHILE um filtro de necessidade está selecionado the system SHALL listar apenas profissionais que atendem essa necessidade. <!-- COMM-16 -->

**Independent Test**: Buscar "fisioterapia sao" encontra um profissional de "Fisioterapia" em "São Paulo".

---

## Edge Cases

- IF o termo de busca contém apenas espaços THEN the system SHALL listar todos os itens (sujeitos ao filtro de necessidade).
- IF telefone e WhatsApp estão vazios THEN the system SHALL aceitar o cadastro e não exibir botões de contato.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| COMM-01 | P1: Cadastro de profissional | Execute | Implementing |
| COMM-02 | P1: Cadastro de profissional | Execute | Implementing |
| COMM-03 | P1: Cadastro de profissional | Execute | Implementing |
| COMM-04 | P1: Cadastro de profissional | Execute | Implementing |
| COMM-05 | P1: Cadastro de profissional | Execute | Implementing |
| COMM-06 | P1: Cadastro de profissional | Execute | Pending |
| COMM-07 | P1: Link de WhatsApp | Execute | Implementing |
| COMM-08 | P1: Link de WhatsApp | Execute | Implementing |
| COMM-09 | P1: Link de WhatsApp | Execute | Pending |
| COMM-10 | P1: Link de WhatsApp | Execute | Pending |
| COMM-11 | P1: Cadastro de trecho | Execute | Implementing |
| COMM-12 | P1: Cadastro de trecho | Execute | Implementing |
| COMM-13 | P1: Cadastro de trecho | Execute | Pending |
| COMM-14 | P2: Busca sem acentos | Execute | Pending |
| COMM-15 | P2: Busca sem acentos | Execute | Pending |
| COMM-16 | P2: Busca sem acentos | Execute | Pending |

**Coverage:** 16 total, 16 mapped to Execute, 0 unmapped.

---

## Success Criteria

- [ ] `npm test` cobre COMM-01 a COMM-16 com testes que falham se a regra for removida.
- [ ] `npm run lint` e `npm run build` passam sem novos avisos.
