create or replace function private.guard_directory() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recent integer;
begin
 if TG_OP='UPDATE' then
  if not private.is_admin() and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'Acesso não autorizado'; end if;
  if new.status='rejeitado' and nullif(trim(new.motivo_rejeicao),'') is null then raise exception 'Informe o motivo da recusa'; end if;
  if new.status='verificado' then new.verificado_em:=now(); new.motivo_rejeicao:=null; end if;
  if TG_TABLE_NAME='routes' and new.status<>'verificado' then new.auditada:=false; end if;
  return new;
 end if;
 if auth.uid() is null and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'Entre para contribuir'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || TG_TABLE_NAME,0));
 if TG_TABLE_NAME='routes' then
  select count(*) into recent from public.routes where author_id=auth.uid() and criado_em>now()-interval '24 hours';
  if nullif(trim(new.titulo),'') is null or nullif(trim(new.cidade),'') is null or nullif(trim(new.ponto_origem),'') is null or nullif(trim(new.ponto_destino),'') is null or nullif(trim(new.trecho_descricao),'') is null then raise exception 'Preencha os dados do trecho'; end if;
  if length(new.titulo)>500 or length(new.cidade)>200 or length(new.ponto_origem)>500 or length(new.ponto_destino)>500 or length(new.trecho_descricao)>5000 then raise exception 'Dados do trecho excedem o limite'; end if;
  if new.distancia_metros<0 or new.duracao_segundos<0 or jsonb_typeof(new.coordenadas)<>'array' or jsonb_array_length(new.coordenadas)>1000 then raise exception 'Geometria ou distância inválida'; end if;
  new.auditada:=false; new.nivel_seguranca:='Relato da comunidade — trecho não auditado';
 else
  select count(*) into recent from public.professionals where author_id=auth.uid() and criado_em>now()-interval '24 hours';
  if nullif(trim(new.nome),'') is null or nullif(trim(new.especialidade),'') is null or nullif(trim(new.cidade),'') is null then raise exception 'Preencha nome, especialidade e cidade'; end if;
  new.estado:=upper(new.estado);
  if new.estado not in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') then raise exception 'Informe uma UF válida'; end if;
  if length(new.nome)>200 or length(new.especialidade)>200 or length(new.cidade)>200 or length(new.descricao)>5000 or length(new.endereco)>500 or length(new.registro_profissional)>200 then raise exception 'Dados do profissional excedem o limite'; end if;
  if coalesce(new.telefone,'')<>'' and length(regexp_replace(new.telefone,'\D','','g')) not in (10,11) then raise exception 'Informe um telefone com DDD'; end if;
  if coalesce(new.whatsapp,'')<>'' and regexp_replace(new.whatsapp,'\D','','g') !~ '^(55)?[1-9][0-9]{9,10}$' then raise exception 'Informe um WhatsApp com DDD'; end if;
 end if;
 if recent>=10 then raise exception 'Limite de 10 cadastros por catálogo em 24 horas atingido'; end if;
 new.author_id:=auth.uid(); new.status:='pendente'; new.motivo_rejeicao:=null; new.verificado_em:=null; new.criado_em:=now();
 return new;
end;
$$;

-- Public directory submissions use the existing owner authorization and Supabase email.
alter table public.routes add column if not exists fonte_url text;
alter table public.routes add column if not exists consultado_em date;
alter table public.professionals add column if not exists fonte_url text;
alter table public.professionals add column if not exists consultado_em date;
alter table public.establishments add column if not exists fonte_url text;
alter table public.establishments add column if not exists consultado_em date;
alter table public.establishments add column if not exists coordenadas_confirmadas boolean not null default true;
grant select(fonte_url,consultado_em) on public.routes,public.professionals to anon,authenticated;
grant select(fonte_url,consultado_em,coordenadas_confirmadas) on public.establishments to anon,authenticated;

create table if not exists private.directory_submissions (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('routes','professionals')),
 route_id uuid unique references public.routes(id) on delete cascade,
 professional_id uuid unique references public.professionals(id) on delete cascade,
 source_hash text not null check(source_hash ~ '^[0-9a-f]{64}$'),
 criado_em timestamptz not null default now(),notified_at timestamptz,
 check((kind='routes' and route_id is not null and professional_id is null) or (kind='professionals' and professional_id is not null and route_id is null))
);
alter table private.directory_submissions enable row level security;
revoke all on private.directory_submissions from public,anon,authenticated;
create policy directory_submissions_deny_clients on private.directory_submissions for all to anon,authenticated using(false) with check(false);
create index directory_submission_source_time on private.directory_submissions(source_hash,criado_em);

create or replace function private.submit_public_directory(kind text,details jsonb,source_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item_id uuid; submission_id uuid; recipient text;
begin
 if kind not in ('routes','professionals') or kind is null or source_hash is null or source_hash !~ '^[0-9a-f]{64}$' or jsonb_typeof(details)<>'object' then raise exception 'Cadastro inválido'; end if;
 select u.email into recipient from private.administrator_access a join auth.users u on u.id=a.user_id where a.enabled and a.is_owner and u.email_confirmed_at is not null;
 if recipient is null then raise exception 'Responsável indisponível'; end if;
 perform pg_advisory_xact_lock(hashtextextended('public-registration',0));
 if (select count(*) from private.directory_submissions s where s.source_hash=submit_public_directory.source_hash and s.criado_em>now()-interval '24 hours')+
    (select count(*) from private.registration_submissions s where s.source_hash=submit_public_directory.source_hash and s.criado_em>now()-interval '24 hours')>=3
 or (select count(*) from private.directory_submissions where criado_em>now()-interval '24 hours')+(select count(*) from private.registration_submissions where criado_em>now()-interval '24 hours')>=100 then raise exception 'Limite de cadastros atingido'; end if;
 if kind='routes' then
  insert into public.routes(titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,tem_rampa,tem_piso_tatil,tem_semaforo_sonoro,coordenadas,distancia_metros)
  values(details->>'titulo',details->>'cidade',details->>'ponto_origem',details->>'ponto_destino',details->>'trecho_descricao',coalesce((details->>'tem_rampa')::boolean,false),coalesce((details->>'tem_piso_tatil')::boolean,false),coalesce((details->>'tem_semaforo_sonoro')::boolean,false),'[]',0) returning id into item_id;
  insert into private.directory_submissions(kind,route_id,source_hash) values(kind,item_id,source_hash) returning id into submission_id;
 else
  insert into public.professionals(nome,especialidade,cidade,estado,endereco,telefone,whatsapp,email,registro_profissional,descricao,atende_por_tipo)
  values(details->>'nome',details->>'especialidade',details->>'cidade',details->>'estado',details->>'endereco',details->>'telefone',details->>'whatsapp',details->>'email',details->>'registro_profissional',details->>'descricao',array(select jsonb_array_elements_text(coalesce(details->'atende_por_tipo','[]'))::public.disability_type)) returning id into item_id;
  insert into private.directory_submissions(kind,professional_id,source_hash) values(kind,item_id,source_hash) returning id into submission_id;
 end if;
 return jsonb_build_object('id',submission_id,'owner_email',recipient);
end;
$$;
create or replace function public.submit_public_directory(kind text,details jsonb,source_hash text) returns jsonb
language sql security invoker set search_path='' as $$select private.submit_public_directory(kind,details,source_hash);$$;
create or replace function private.mark_directory_notified(registration_id uuid) returns void
language sql security definer set search_path='' as $$update private.directory_submissions set notified_at=now() where id=registration_id;$$;
create or replace function public.mark_directory_notified(registration_id uuid) returns void
language sql security invoker set search_path='' as $$select private.mark_directory_notified(registration_id);$$;

create or replace function private.directory_for_review(registration_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare submission private.directory_submissions; result jsonb;
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 select * into submission from private.directory_submissions where id=registration_id;
 if not found then return null; end if;
 if submission.kind='routes' then
  select jsonb_build_object('id',registration_id,'kind','routes','nome',r.titulo,'endereco',r.ponto_origem||' → '||r.ponto_destino,'cidade',r.cidade,'estado','','descricao',r.trecho_descricao,'fotos','[]'::jsonb,'status',r.status,'criteria',jsonb_build_array(jsonb_build_object('criterio','Rampas observadas','presente',case when r.tem_rampa then true else null end),jsonb_build_object('criterio','Piso tátil observado','presente',case when r.tem_piso_tatil then true else null end),jsonb_build_object('criterio','Semáforo sonoro observado','presente',case when r.tem_semaforo_sonoro then true else null end))) into result from public.routes r where r.id=submission.route_id;
 else
  select jsonb_build_object('id',registration_id,'kind','professionals','nome',p.nome,'especialidade',p.especialidade,'registro_profissional',p.registro_profissional,'atende_por_tipo',p.atende_por_tipo,'endereco',p.endereco,'cidade',p.cidade,'estado',p.estado,'descricao',p.descricao,'telefone',p.telefone,'whatsapp',p.whatsapp,'email',p.email,'fotos','[]'::jsonb,'status',p.status,'criteria','[]'::jsonb) into result from public.professionals p where p.id=submission.professional_id;
 end if;
 return result;
end;
$$;
create or replace function public.directory_for_review(registration_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select private.directory_for_review(registration_id);$$;
create or replace function private.decide_directory(registration_id uuid,approve boolean,reason text default '') returns void
language plpgsql security definer set search_path='' as $$
declare submission private.directory_submissions; item_status public.establishment_status;
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 select * into submission from private.directory_submissions where id=registration_id for update;
 if not found then raise exception 'Cadastro indisponível'; end if;
 if approve is null or (not approve and nullif(trim(reason),'') is null) then raise exception 'Informe o motivo da recusa'; end if;
 if submission.kind='routes' then
  select status into item_status from public.routes where id=submission.route_id for update;
  if item_status<>'pendente' then raise exception 'Cadastro já revisado'; end if;
  update public.routes set status=case when approve then 'verificado'::public.establishment_status else 'rejeitado'::public.establishment_status end,motivo_rejeicao=case when approve then null else left(trim(reason),1000) end,auditada=false where id=submission.route_id;
 else
  select status into item_status from public.professionals where id=submission.professional_id for update;
  if item_status<>'pendente' then raise exception 'Cadastro já revisado'; end if;
  update public.professionals set status=case when approve then 'verificado'::public.establishment_status else 'rejeitado'::public.establishment_status end,motivo_rejeicao=case when approve then null else left(trim(reason),1000) end where id=submission.professional_id;
 end if;
end;
$$;
create or replace function public.decide_directory(registration_id uuid,approve boolean,reason text default '') returns void
language sql security invoker set search_path='' as $$select private.decide_directory(registration_id,approve,reason);$$;
revoke all on function private.submit_public_directory(text,jsonb,text),public.submit_public_directory(text,jsonb,text),private.mark_directory_notified(uuid),public.mark_directory_notified(uuid),private.directory_for_review(uuid),public.directory_for_review(uuid),private.decide_directory(uuid,boolean,text),public.decide_directory(uuid,boolean,text) from public,anon,authenticated;
grant execute on function private.submit_public_directory(text,jsonb,text),public.submit_public_directory(text,jsonb,text),private.mark_directory_notified(uuid),public.mark_directory_notified(uuid) to service_role;
grant execute on function private.directory_for_review(uuid),public.directory_for_review(uuid),private.decide_directory(uuid,boolean,text),public.decide_directory(uuid,boolean,text) to authenticated;
