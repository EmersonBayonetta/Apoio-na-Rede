begin;
create or replace function private.admin_registration_list(requested_kind text default '',requested_status text default '',search_text text default '',page_number integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_registration_reviewer() then raise exception 'Acesso não autorizado'; end if;
 if requested_kind not in ('','places','professionals','routes') or requested_status not in ('','pendente','verificado','rejeitado') or page_number<0 or page_number>100000 or length(search_text)>100 then raise exception 'Filtros inválidos'; end if;
 with records as (
  select e.id,'places'::text kind,e.nome,e.endereco,e.cidade,e.status,e.criado_em from public.establishments e
  union all select p.id,'professionals',p.nome,p.endereco,p.cidade,p.status,p.criado_em from public.professionals p
  union all select r.id,'routes',r.titulo,r.ponto_origem||' → '||r.ponto_destino,r.cidade,r.status,r.criado_em from public.routes r
 ), filtered as (
  select * from records where (requested_kind='' or kind=requested_kind) and (requested_status='' or status::text=requested_status)
   and (trim(search_text)='' or position(lower(trim(search_text)) in lower(nome||' '||coalesce(endereco,'')||' '||cidade))>0)
 ), paged as (select * from filtered order by criado_em desc nulls last,id limit 20 offset page_number*20)
 select jsonb_build_object('total',(select count(*) from filtered),'entries',coalesce((select jsonb_agg(to_jsonb(paged) order by criado_em desc nulls last,id) from paged),'[]'::jsonb),
  'pending',(select count(*) from records where status='pendente')) into result;
 return result;
end;$$;
create or replace function private.admin_registration_detail(requested_kind text,record_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_registration_reviewer() then raise exception 'Acesso não autorizado'; end if;
 if requested_kind='places' then
  select to_jsonb(e)||jsonb_build_object('kind','places','criteria',coalesce((select jsonb_agg(to_jsonb(c)) from public.accessibility_criteria c where c.establishment_id=e.id),'[]'::jsonb)) into result from public.establishments e where e.id=record_id;
 elsif requested_kind='professionals' then
  select to_jsonb(p)||jsonb_build_object('kind','professionals','fotos',case when p.foto_url is null then '[]'::jsonb else jsonb_build_array(p.foto_url) end,'criteria','[]'::jsonb) into result from public.professionals p where p.id=record_id;
 elsif requested_kind='routes' then
  select to_jsonb(r)||jsonb_build_object('kind','routes','nome',r.titulo,'endereco',r.ponto_origem||' → '||r.ponto_destino,'descricao',r.trecho_descricao,'fotos','[]'::jsonb,'criteria',jsonb_build_array(
   jsonb_build_object('criterio','Rampas relatadas','presente',case when r.tem_rampa then true else null end),
   jsonb_build_object('criterio','Piso tátil relatado','presente',case when r.tem_piso_tatil then true else null end),
   jsonb_build_object('criterio','Semáforo sonoro relatado','presente',case when r.tem_semaforo_sonoro then true else null end))) into result from public.routes r where r.id=record_id;
 else raise exception 'Tipo inválido';end if;
 if result is null then raise exception 'Cadastro não encontrado';end if;
 return result;
end;$$;
create or replace function private.admin_decide_registration(requested_kind text,record_id uuid,approve boolean,reason text default '') returns void
language plpgsql security definer set search_path='' as $$
declare current_status public.establishment_status; target_table text;
begin
 if not private.is_registration_reviewer() then raise exception 'Acesso não autorizado';end if;
 target_table:=case requested_kind when 'places' then 'establishments' when 'professionals' then 'professionals' when 'routes' then 'routes' else null end;
 if target_table is null then raise exception 'Tipo inválido';end if;
 if approve is null or (not approve and nullif(trim(reason),'') is null) then raise exception 'Informe o motivo da recusa';end if;
 execute format('select status from public.%I where id=$1 for update',target_table) into current_status using record_id;
 if current_status is null or current_status<>'pendente' then raise exception 'Cadastro indisponível ou já revisado';end if;
 execute format('update public.%I set status=$1,motivo_rejeicao=$2 where id=$3',target_table)
 using case when approve then 'verificado'::public.establishment_status else 'rejeitado'::public.establishment_status end,case when approve then null else left(trim(reason),1000) end,record_id;
end;$$;
create or replace function public.admin_registration_list(requested_kind text default '',requested_status text default '',search_text text default '',page_number integer default 0) returns jsonb
language sql stable security invoker set search_path='' as $$select private.admin_registration_list(requested_kind,requested_status,search_text,page_number);$$;
create or replace function public.admin_registration_detail(requested_kind text,record_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$select private.admin_registration_detail(requested_kind,record_id);$$;
create or replace function public.admin_decide_registration(requested_kind text,record_id uuid,approve boolean,reason text default '') returns void
language sql security invoker set search_path='' as $$select private.admin_decide_registration(requested_kind,record_id,approve,reason);$$;
revoke all on function private.admin_registration_list(text,text,text,integer),private.admin_registration_detail(text,uuid),private.admin_decide_registration(text,uuid,boolean,text),public.admin_registration_list(text,text,text,integer),public.admin_registration_detail(text,uuid),public.admin_decide_registration(text,uuid,boolean,text) from public,anon,authenticated;
grant execute on function private.admin_registration_list(text,text,text,integer),private.admin_registration_detail(text,uuid),private.admin_decide_registration(text,uuid,boolean,text),public.admin_registration_list(text,text,text,integer),public.admin_registration_detail(text,uuid),public.admin_decide_registration(text,uuid,boolean,text) to authenticated;
commit;
