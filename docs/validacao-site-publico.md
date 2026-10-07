# Revisão do site público — 07/10/2026

Escopo: busca, catálogo, endereços, trajetos a pé, navegação e acessibilidade. A configuração de e-mail e a administração foram adiadas a pedido do titular. Não houve alteração de dados, migração de banco ou publicação de exemplos no catálogo remoto.

## Correções

- A localização de um endereço tenta o Photon quando o Nominatim falha por rede, HTTP, JSON inválido ou resultado fora de Cataguases. Cada consulta tem limite de espera de oito segundos.
- O cálculo a pé recusa coordenadas inválidas, geometria inválida e distância/duração negativas. Ao trocar de destino ou sair da tela, cancela a consulta anterior e ignora respostas de localização atrasadas.
- Links de locais OpenStreetMap usam coordenadas, sem enviar o identificador OSM como se fosse um Place ID do Google.
- O carregamento Google reutiliza a API já disponível na página. Os testes com provedores simulados não precisam de uma chave real.
- Testes de endereço foram atualizados para a navegação e o cache atuais. Os quatro testes que exigiam mapas e panoramas removidos foram substituídos por um teste dos fluxos públicos atuais, incluindo indisponibilidade e recuperação de provedores.

## Evidências

- Build normal e de demonstração compilam; 68 testes unitários passam; lint conserva apenas os dois avisos anteriores de Fast Refresh.
- No domínio publicado, antes deste deploy, Google Places carregou cinco sugestões sem exceções não tratadas ou erros de configuração detectados. As larguras 1440, 390 e 320 px não apresentaram rolagem horizontal global. Essa verificação comprova disponibilidade naquele momento, não a disponibilidade contínua de serviços externos.
- Uma consulta real ao serviço a pé OpenStreetMap entre dois pontos de Cataguases retornou 324 metros, 258,9 segundos e 11 pontos de geometria. As coordenadas eram de teste, sem dados de usuários.
- Testes isolados verificam endereço selecionado, ausência de número duplicado, link de trajeto, filtros, categorias, cache e consultas por atividade. O teste público verifica detalhes externos, sucesso/falha do cálculo, alternativa no Google Maps e filtro de locais conferidos.
- Também passaram os testes de navegador de comunidade, necessidades, categorias OSM, apresentação, regressões, busca no celular e leitura em voz alta. Os testes compartilham perfis isolados e não usam contas do titular.

## Pendências fora deste escopo

Entrega de e-mails de login, upload com conta real, autorização/moderação e transferência de cadastros reais locais continuam dependendo dos passos anteriores. Dados demonstrativos não foram transformados em cadastros reais. A consulta de trajeto a pé não verifica fisicamente calçadas, rampas ou obstáculos.
