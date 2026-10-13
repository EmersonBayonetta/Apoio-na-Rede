-- Aplicar depois de registration_email_review.sql.
-- A revisão passa a mostrar bairro, CEP e o ponto no mapa, que aparecem no card e na rota do local.
create or replace function private.registration_for_review(registration_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 return (select jsonb_build_object('id',e.id,'nome',e.nome,'categoria',e.categoria,'endereco',e.endereco,'bairro',e.bairro,'cep',e.cep,'latitude',e.latitude,'longitude',e.longitude,'cidade',e.cidade,'estado',e.estado,'descricao',e.descricao,'telefone',e.telefone,'whatsapp',e.whatsapp,'horario_funcionamento',e.horario_funcionamento,'fotos',e.fotos,'status',e.status,'motivo_rejeicao',e.motivo_rejeicao,'criteria',(select coalesce(jsonb_agg(jsonb_build_object('criterio',c.criterio,'presente',c.presente,'observacao_livre',c.observacao_livre)),'[]'::jsonb) from public.accessibility_criteria c where c.establishment_id=e.id))
 from public.establishments e join private.registration_submissions s on s.establishment_id=e.id where e.id=registration_id);
end;
$$;
