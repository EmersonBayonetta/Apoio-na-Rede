-- Sources and public contacts researched on 2026-10-07. No ratings or accessibility claims are seeded.
begin;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',(select user_id from private.administrator_access where enabled and is_owner))::text,true);
do $seed$
declare catalog jsonb:=$catalog${
  "consultado_em":"2026-10-07",
  "places":[
    {"nome":"Prefeitura Municipal de Cataguases","categoria":"servico_publico","endereco":"Praça Santa Rita, 462","bairro":"Centro","telefone":"(32) 3422-1066","email_contato":"administracao@cataguases.mg.gov.br","horario_funcionamento":"Segunda a sexta, 08h às 16h","fonte_url":"https://www.cataguases.mg.gov.br/portal/contato","latitude":-21.3892103,"longitude":-42.6966452,"descricao":"Atendimento da administração municipal. Contatos e endereço publicados no portal oficial."},
    {"nome":"Casa de Cultura Dona Catarina","categoria":"lazer_cultura","endereco":"Praça Chácara Dona Catarina, 176","bairro":"Centro","telefone":"(32) 3429-2585","email_contato":"cultura@cataguases.mg.gov.br","horario_funcionamento":"Secretaria de Cultura: 08h às 16h; confirme o horário de visitação","fonte_url":"https://www.cataguases.mg.gov.br/portal/secretarias/21/secretaria-de-cultura-e-turismo","place_id":"ChIJozGT65PQogARb54R8SY_JHk","descricao":"Casa de Cultura que sedia a Secretaria de Cultura e Turismo. O contato é institucional; confirme a programação e o acesso antes da visita."},
    {"nome":"Hotel Cataguases","categoria":"hospedagem","endereco":"Rua Major Vieira, 56","bairro":"Centro","telefone":"(32) 3422-2515","whatsapp":"(32) 3422-2515","website":"https://www.hotelcataguases.com.br/","fonte_url":"https://www.hotelcataguases.com.br/","place_id":"ChIJM3V4F43QogARaV3qwAbaAuY","latitude":-21.3907597,"longitude":-42.6932261,"descricao":"Hotel no centro de Cataguases. Reservas e dúvidas podem ser encaminhadas pelo telefone e WhatsApp divulgados pelo hotel."},
    {"nome":"Restaurante do Hotel Cataguases","categoria":"alimentacao","endereco":"Rua Major Vieira, 56 B","bairro":"Centro","telefone":"(32) 3422-2515","website":"https://www.hotelcataguases.com.br/","fonte_url":"https://www.tripadvisor.com.br/Restaurant_Review-g1102709-d7158257-Reviews-Restaurante_Do_Hotel_Cataguases-Cataguases_State_of_Minas_Gerais.html","latitude":-21.3907597,"longitude":-42.6932261,"descricao":"Restaurante nas dependências do Hotel Cataguases. Confirme com o hotel o funcionamento do restaurante e o atendimento a visitantes."},
    {"nome":"Supermercado Morais — Centro","categoria":"comercio_loja","endereco":"Avenida Astolfo Dutra, 300","bairro":"Centro","telefone":"(32) 3422-8455","website":"https://www.supermercadomorais.com.br/","fonte_url":"https://www.guiacataguases.com.br/index.php/home-2/alimentos-e-bebidas/supermercados/95-supermercado-morais-centro","latitude":-21.3879574,"longitude":-42.6982182,"descricao":"Supermercado com endereço e telefone publicados no guia comercial de Cataguases. Confirme horários e condições de acesso com a loja."},
    {"nome":"IF Sudeste MG — Campus Cataguases","categoria":"educacao","endereco":"Rua Romualdo Menezes, 701","bairro":"Menezes","telefone":"(32) 99851-9177","email_contato":"secretaria.cataguases@ifsudestemg.edu.br","horario_funcionamento":"Registro Acadêmico: segunda a sexta, 13h às 17h e 18h às 22h","website":"https://www.ifsudestemg.edu.br/cataguases","fonte_url":"https://www.ifsudestemg.edu.br/cataguases/fale-conosco/fale-conosco/","place_id":"ChIJj9QL9onRogARuA4dcmpy-ts","descricao":"Campus do Instituto Federal no endereço atual publicado pelo próprio IF. A secretaria acadêmica informa serviços e orientações para atendimento."},
    {"nome":"Pilates e Fisioterapia — Thamyres Lobo","categoria":"saude","endereco":"Rua Nogueira Neves, 22, loja 07","bairro":"Centro","telefone":"(32) 99953-1990","whatsapp":"(32) 99953-1990","website":"https://thamyreslobopilates.com/","fonte_url":"https://thamyreslobopilates.com/","place_id":"ChIJ-UnsUirRogARtjw0SvS6p_k","latitude":-21.388169,"longitude":-42.6904584,"horario_funcionamento":"Segunda a sexta, 07h às 12h e 14h às 19h; com agendamento","descricao":"Studio que divulga atendimento em fisioterapia e Pilates. O contato público é o WhatsApp de agendamento."},
    {"nome":"APAE Cataguases","categoria":"saude","endereco":"Avenida Guido Marliere, s/n","bairro":"Haidée Fajardo","telefone":"(32) 3421-2999","email_contato":"apaecataguases@yahoo.com.br","website":"https://apaecataguases.webnode.com.br/","fonte_url":"https://apaecataguases.webnode.com.br/contato/","latitude":-21.3784355,"longitude":-42.6974357,"horario_funcionamento":"07h às 11h25 e 13h às 17h25; confirme dias de atendimento","descricao":"Associação com endereço e canais institucionais publicados em sua página de contato. Confirme os serviços atualmente disponíveis e os critérios de atendimento."},
    {"nome":"Rodoviária de Cataguases","categoria":"transporte_mobilidade","endereco":"Rua Francisco Rossi, 10","bairro":"Centro","fonte_url":"https://www.viacaocatedral.queropassagem.com.br/rodoviaria-de-cataguases","latitude":-21.3917757,"longitude":-42.6902098,"descricao":"Terminal rodoviário com endereço publicado pelo serviço de passagens. Os telefones encontrados para a rodoviária divergem entre as fontes; consulte a viação para confirmar o canal de atendimento."}
  ],
  "professionals":[
    {"nome":"Thamyres Lobo","especialidade":"Fisioterapia e Pilates","endereco":"Rua Nogueira Neves, 22, loja 07 — Centro","telefone":"(32) 99953-1990","whatsapp":"(32) 99953-1990","atende_por_tipo":[],"fonte_url":"https://thamyreslobopilates.com/","descricao":"Fisioterapeuta e instrutora de Pilates apresentada no site do studio. Agendamento pelo contato público do studio. Necessidades específicas e registro no conselho devem ser confirmados diretamente."},
    {"nome":"Micaelly Saraiva","especialidade":"Fisioterapia e Pilates","endereco":"Rua Nogueira Neves, 22, loja 07 — Centro","telefone":"(32) 99953-1990","whatsapp":"(32) 99953-1990","atende_por_tipo":[],"fonte_url":"https://thamyreslobopilates.com/","descricao":"Fisioterapeuta e instrutora de Pilates apresentada na equipe do studio Thamyres Lobo. Este é o contato institucional do studio, não um telefone pessoal. Confirme agenda, registro profissional e adaptações disponíveis."},
    {"nome":"Fernanda Resende","especialidade":"Psicologia — TCC e DBT","registro_profissional":"CRP 04/45681","endereco":"Praça Rui Barbosa, 170, sala 104 — Centro","telefone":"(32) 99843-1600","whatsapp":"(32) 99843-1600","atende_por_tipo":[],"fonte_url":"https://psifernandaresende.com.br/","descricao":"Psicóloga com atendimento presencial em Cataguases e online, conforme seu site profissional. Contato e registro são os divulgados pela profissional. Confirme disponibilidade e atendimento à sua necessidade específica."}
  ],
  "routes":[
    {"titulo":"Prefeitura → Hotel Cataguases","ponto_origem":"Prefeitura Municipal, Praça Santa Rita, 462","ponto_destino":"Hotel Cataguases, Rua Major Vieira, 56","fonte_url":"https://www.hotelcataguases.com.br/"},
    {"titulo":"Prefeitura → Casa de Cultura Dona Catarina","ponto_origem":"Prefeitura Municipal, Praça Santa Rita, 462","ponto_destino":"Casa de Cultura Dona Catarina, Praça Chácara Dona Catarina, 176","fonte_url":"https://www.cataguases.mg.gov.br/portal/secretarias/21/secretaria-de-cultura-e-turismo"},
    {"titulo":"Rodoviária → Hotel Cataguases","ponto_origem":"Rodoviária de Cataguases, Rua Francisco Rossi, 10","ponto_destino":"Hotel Cataguases, Rua Major Vieira, 56","fonte_url":"https://www.viacaocatedral.queropassagem.com.br/rodoviaria-de-cataguases"},
    {"titulo":"Casa de Cultura → Supermercado Morais","ponto_origem":"Casa de Cultura Dona Catarina, Praça Chácara Dona Catarina, 176","ponto_destino":"Supermercado Morais, Avenida Astolfo Dutra, 300","fonte_url":"https://www.guiacataguases.com.br/index.php/home-2/alimentos-e-bebidas/supermercados/95-supermercado-morais-centro"},
    {"titulo":"Rodoviária → IF Sudeste MG","ponto_origem":"Rodoviária de Cataguases, Rua Francisco Rossi, 10","ponto_destino":"IF Sudeste MG, Rua Romualdo Menezes, 701, bairro Menezes","fonte_url":"https://www.ifsudestemg.edu.br/cataguases/fale-conosco/fale-conosco/"}
  ]
}
$catalog$::jsonb; item jsonb; item_id uuid;
begin
 if not private.is_owner() then raise exception 'Titular autorizado não configurado'; end if;
 for item in select * from jsonb_array_elements(catalog->'places') loop
  if not exists(select 1 from public.establishments where nome=item->>'nome' and cidade='Cataguases') then
   insert into public.establishments(nome,categoria,endereco,bairro,cidade,estado,latitude,longitude,coordenadas_confirmadas,descricao,fotos,status,telefone,whatsapp,email_contato,website,horario_funcionamento,fonte_url,consultado_em,informado_responsavel,place_id)
   values(item->>'nome',(item->>'categoria')::public.establishment_category,item->>'endereco',item->>'bairro','Cataguases','MG',coalesce((item->>'latitude')::double precision,-21.3924),coalesce((item->>'longitude')::double precision,-42.6896),false,item->>'descricao','{}','verificado',item->>'telefone',item->>'whatsapp',item->>'email_contato',item->>'website',item->>'horario_funcionamento',item->>'fonte_url',(catalog->>'consultado_em')::date,false,item->>'place_id');
  end if;
 end loop;
 for item in select * from jsonb_array_elements(catalog->'professionals') loop
  if not exists(select 1 from public.professionals where nome=item->>'nome' and cidade='Cataguases') then
   insert into public.professionals(nome,especialidade,cidade,estado,endereco,telefone,whatsapp,registro_profissional,descricao,atende_por_tipo,fonte_url,consultado_em)
   values(item->>'nome',item->>'especialidade','Cataguases','MG',item->>'endereco',item->>'telefone',item->>'whatsapp',item->>'registro_profissional',item->>'descricao','{}',item->>'fonte_url',(catalog->>'consultado_em')::date) returning id into item_id;
   update public.professionals set status='verificado' where id=item_id;
  end if;
 end loop;
 for item in select * from jsonb_array_elements(catalog->'routes') loop
  if not exists(select 1 from public.routes where titulo=item->>'titulo' and cidade='Cataguases') then
   insert into public.routes(titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,tem_rampa,tem_piso_tatil,tem_semaforo_sonoro,distancia_metros,coordenadas,fonte_url,consultado_em)
   values(item->>'titulo','Cataguases',item->>'ponto_origem',item->>'ponto_destino','Ligação entre endereços públicos reais. Abra as direções para calcular o trajeto. Condições de calçadas, rampas, piso tátil, travessias e obstáculos não foram verificadas presencialmente.',false,false,false,0,'[]',item->>'fonte_url',(catalog->>'consultado_em')::date) returning id into item_id;
   update public.routes set status='verificado',auditada=false where id=item_id;
  end if;
 end loop;
end;
$seed$;
commit;
