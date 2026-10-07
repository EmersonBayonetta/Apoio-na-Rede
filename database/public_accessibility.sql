begin;
alter table public.reviews alter column user_nome set default 'Participante';
CREATE OR REPLACE FUNCTION public.get_place_accessibility(requested_place_id text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select coalesce((select jsonb_build_object('encontrado',true,'verificado',e.status='verificado','local',
 jsonb_build_object('id',e.id,'place_id',e.place_id,'nome',e.nome,'categoria',e.categoria,'endereco',e.endereco,'bairro',e.bairro,'cidade',e.cidade,'estado',e.estado,'cep',e.cep,'latitude',e.latitude,'longitude',e.longitude,'descricao',e.descricao,'fotos',e.fotos,'status',e.status,'telefone',e.telefone,'whatsapp',e.whatsapp,'email_contato',e.email_contato,'horario_funcionamento',e.horario_funcionamento,'website',e.website,'nota_media',e.nota_media,'total_avaliacoes',e.total_avaliacoes,'verificado_em',e.verificado_em,'criado_em',e.criado_em,'informado_responsavel',e.informado_responsavel,
 'criteria',coalesce((select jsonb_agg(to_jsonb(c)) from public.accessibility_criteria c where c.establishment_id=e.id),'[]'::jsonb)))
 from public.establishments e where e.place_id=requested_place_id and e.status='verificado' limit 1),jsonb_build_object('encontrado',false,'verificado',false,'local',null));
$function$;

commit;
