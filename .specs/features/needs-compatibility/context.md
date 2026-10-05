# Compatibilidade com Minhas Necessidades Context

**Gathered:** 2026-10-05
**Spec:** `.specs/features/needs-compatibility/spec.md`
**Status:** Ready for design

---

## Feature Boundary

A pessoa marca requisitos concretos (indispensáveis ou desejáveis), sem informar diagnóstico. O app compara esses requisitos com os recursos cadastrados de cada local e explica o resultado. Tudo fica no navegador. Origem: funcionalidades 1 e 4 (parte fixa) de `docs/funcionalidades-propostas-validacao.md`.

---

## Implementation Decisions

### Critérios sensoriais

- Entram 3 recursos fixos: "Área de descanso ou espaço tranquilo", "Iluminação suave ou ajustável" e "Horário com menos estímulos".
- Ruído, filas e lotação, que são subjetivos, ficam fora até haver backend.

### Efeito na busca

- Cada card de resultado mostra um selo de compatibilidade.
- Há um filtro, desligado por padrão, que oculta locais com requisito indispensável marcado como Não.
- Locais sem informação continuam aparecendo com o filtro ligado.
- A ordem dos resultados não muda.

### Agent's Discretion

- O editor de requisitos fica no modal "Ajustes" já existente, como uma seção nova.
- O nível padrão de cada recurso é "Não preciso".

### Declined / Undiscussed Gray Areas → Assumptions

- Filtro afeta só a lista de resultados, não os pinos do mapa. Registrado no spec.
- A preferência atual por tipo de deficiência continua como está. Registrado no spec.

---

## Specific References

Exemplo do documento de proposta: "Este local atende 4 dos seus 5 requisitos. A entrada sem degraus foi informada; o banheiro adaptado ainda não foi confirmado."

---

## Deferred Ideas

- Relatos sensoriais com data e horário (precisa de backend).
- Sincronizar o perfil entre dispositivos (precisa de backend e consentimento LGPD).
- Ordenar resultados por compatibilidade.
