# Conferência da Energisa em Cataguases

Consulta realizada em 9 de outubro de 2026. Endereços abaixo constam nas fontes oficiais consultadas; isso não certifica acessibilidade nem confirma todos os resultados de provedores de mapas.

| Unidade | Endereço publicado | Fonte |
| --- | --- | --- |
| Agência de atendimento | Avenida Astolfo Dutra, 70, Centro, Cataguases/MG | [Agências da Energisa](https://www.energisa.com.br/agencias) |
| Energisa S.A., sede do grupo | Praça Rui Barbosa, 80, Centro, Cataguases/MG, CEP 36770-901 | [Fale com RI](https://ri.energisa.com.br/servicos-de-ri/fale-com-ri/), [Política de Privacidade](https://www.energisa.com.br/politica-de-privacidade) |
| Energisa Minas Gerais, sede da distribuidora | Avenida Manoel Inácio Peixoto, 1200, Parque Industrial, Cataguases/MG | [ANEEL — Fale com a sua distribuidora](https://www.gov.br/aneel/pt-br/canais_atendimento/fale-com-a-sua-distribuidora) |
| Museu Energisa | Avenida Astolfo Dutra, 41, Centro, Cataguases/MG | [Instituto Energisa](https://www.energisa.com.br/instituto-energisa), [Portal de Turismo de Minas Gerais](https://www.minasgerais.com.br/pt/atracoes/cataguases/museu-energisa) |

A página oficial de agências publica atendimento de segunda a sexta, das 07h30 às 11h30 e das 12h30 às 16h30, para a agência de Cataguases. A página retornou HTTP 403 na abertura direta; o endereço e o horário estavam disponíveis no conteúdo indexado da fonte oficial.

## Divergências e limites

Resultados públicos do Waze indicam agência no número 92 e Central de Serviços no número 93 da Avenida Astolfo Dutra. Esses números não coincidem com o número 70 publicado pela Energisa para sua agência de atendimento. Não há evidência suficiente para tratar esses registros como a mesma unidade ou substituir seus endereços automaticamente.

Não existem registros da Energisa nos arquivos do catálogo local pesquisados. A busca utiliza Google Places e também resultados de um índice urbano derivado de provedores externos. A conferência de exibição ao vivo não foi concluída: a chamada a `PlacesService.search('Energisa')` no navegador local falhou com `VITE_GOOGLE_MAPS_API_KEY não configurada`.

Nenhum endereço, coordenada, Place ID ou cadastro remoto foi sobrescrito. É necessário comparar os resultados do site publicado com esta tabela para concluir a auditoria de exibição, incluindo unidades adicionais que apareçam na busca. Os endereços das sedes não devem ser apresentados como agência de atendimento.

## Verificação visual

Título atualizado para “Descubra se um lugar é acessível para você antes de sair.” Categorias em grade, sem rolagem horizontal, com duas linhas iniciais conforme a largura e expansão por “Ver todas”. Conferidos no Chrome em 320, 390, 600, 768 e 1440 px: textos dentro dos cards, nenhuma rolagem horizontal da grade e expansão para as nove categorias. Build de produção e 78 testes aprovados.
