-- Execute after supabase_schema.sql and database/place_accessibility.sql.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_admin() returns boolean
language sql stable set search_path = '' as $$
 select coalesce(auth.jwt()->'app_metadata'->>'role' = 'admin', false);
$$;

create or replace function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.users(id, nome, email) values(new.id, coalesce(nullif(new.raw_user_meta_data->>'nome',''), 'Participante'), new.email);
 return new;
end;
$$;
revoke all on function private.create_profile() from public;
drop trigger if exists create_profile on auth.users;
create trigger create_profile after insert on auth.users for each row execute function private.create_profile();
insert into public.users(id,nome,email)
 select id, coalesce(nullif(raw_user_meta_data->>'nome',''), 'Participante'), email from auth.users where email is not null
 on conflict (id) do nothing;

drop index if exists public.establishments_place_id_unique;
create unique index if not exists establishments_verified_place_unique on public.establishments(place_id) where status='verificado' and place_id is not null;
alter table public.establishments alter column nota_media set default 0;
alter table public.establishments alter column estado set default 'MG';

create table if not exists public.place_reports (
 id uuid primary key default gen_random_uuid(),
 establishment_id uuid references public.establishments(id) on delete cascade,
 place_id text,
 local_key text generated always as (coalesce(place_id, establishment_id::text)) stored,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 respostas jsonb not null,
 comentario text not null default '' check(length(comentario)<=2000),
 fotos text[] not null default '{}' check(cardinality(fotos)<=3),
 status text not null default 'pendente' check(status in ('pendente','aprovado','recusado')),
 motivo_recusa text,
 criado_em timestamptz not null default now(),
 check(establishment_id is not null or nullif(trim(place_id),'') is not null),
 unique(local_key,user_id)
);
create index if not exists place_reports_user_created on public.place_reports(user_id,criado_em);
create index if not exists place_reports_pending on public.place_reports(status);
create index if not exists establishments_owner_created on public.establishments(dono_id,criado_em);
alter table public.place_reports enable row level security;
revoke all on public.place_reports from anon,authenticated;
grant select on public.place_reports to authenticated;
grant insert(establishment_id,place_id,respostas,comentario,fotos) on public.place_reports to authenticated;
grant update(status,motivo_recusa) on public.place_reports to authenticated;
drop policy if exists reports_read on public.place_reports;
create policy reports_read on public.place_reports for select to authenticated using(user_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists reports_insert on public.place_reports;
create policy reports_insert on public.place_reports for insert to authenticated with check(user_id=(select auth.uid()) and status='pendente');
drop policy if exists reports_moderate on public.place_reports;
create policy reports_moderate on public.place_reports for update to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');

create or replace function private.guard_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare canonical text; p text;
begin
 if TG_OP='UPDATE' then
  if not private.is_admin() then raise exception 'Acesso não autorizado'; end if;
  if new.status='recusado' and nullif(trim(new.motivo_recusa),'') is null then raise exception 'Informe o motivo da recusa'; end if;
  return new;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.place_reports where user_id=auth.uid() and criado_em>now()-interval '24 hours')>=10 then raise exception 'Limite de 10 relatos em 24 horas atingido'; end if;
 new.user_id:=auth.uid(); new.status:='pendente'; new.motivo_recusa:=null; new.criado_em:=now();
 if new.establishment_id is not null then
  select place_id into canonical from public.establishments where id=new.establishment_id and status='verificado';
  if not found then raise exception 'Local não disponível para relatos'; end if;
  new.place_id:=canonical;
 end if;
 if jsonb_typeof(new.respostas)<>'object' or (select count(*) from jsonb_each(new.respostas))<>12 or exists(
  select 1 from jsonb_each_text(new.respostas) r where r.key not in ('libras','entrada_acessivel','rampa','elevador','corrimao','banheiro_pcd','vaga_pcd','piso_tatil','cadeira_rodas','area_descanso','iluminacao_ajustavel','horario_tranquilo') or r.value is null or r.value not in ('sim','nao','nao_sei')
 ) then raise exception 'Respostas inválidas'; end if;
 foreach p in array new.fotos loop
  if split_part(p,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='report-photos' and name=p) then raise exception 'Foto inválida'; end if;
 end loop;
 return new;
end;
$$;
revoke all on function private.guard_report() from public;
drop trigger if exists guard_report on public.place_reports;
create trigger guard_report before insert or update on public.place_reports for each row execute function private.guard_report();

create or replace function private.guard_establishment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if private.is_admin() then
  if new.status='verificado' then new.verificado_em:=now(); new.motivo_rejeicao:=null; end if;
  if new.status='rejeitado' and nullif(trim(new.motivo_rejeicao),'') is null then raise exception 'Informe o motivo da recusa'; end if;
  return new;
 end if;
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.establishments where dono_id=auth.uid() and criado_em>now()-interval '24 hours')>=3 then raise exception 'Limite de 3 cadastros em 24 horas atingido'; end if;
  new.nota_media:=0; new.total_avaliacoes:=0; new.motivo_rejeicao:=null; new.verificado_em:=null; new.criado_em:=now();
 else
  new.nota_media:=old.nota_media; new.total_avaliacoes:=old.total_avaliacoes;
  new.verificado_em:=old.verificado_em; new.motivo_rejeicao:=old.motivo_rejeicao; new.criado_em:=old.criado_em;
 end if;
 new.dono_id:=auth.uid(); new.status:='pendente'; new.atualizado_em:=now();
 return new;
end;
$$;
revoke all on function private.guard_establishment() from public;
drop trigger if exists guard_establishment on public.establishments;
create trigger guard_establishment before insert or update on public.establishments for each row execute function private.guard_establishment();

drop policy if exists criteria_owner_insert on public.accessibility_criteria;
create policy criteria_owner_insert on public.accessibility_criteria for insert to authenticated with check(exists(select 1 from public.establishments e where e.id=establishment_id and e.dono_id=(select auth.uid()) and e.status='pendente'));
grant insert on public.accessibility_criteria to authenticated;
grant select,insert,update on public.establishments to authenticated;
grant select on public.users,public.reviews,public.professionals,public.routes to authenticated;
grant select on public.reviews,public.professionals,public.routes to anon;
revoke select on public.establishments from anon;
grant select(id,place_id,nome,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,status,telefone,whatsapp,email_contato,horario_funcionamento,website,nota_media,total_avaliacoes,verificado_em,criado_em) on public.establishments to anon;

create or replace function public.register_establishment(details jsonb, criteria jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare local_id uuid;
begin
 if auth.uid() is null then raise exception 'Entre para cadastrar um local'; end if;
 insert into public.establishments(nome,place_id,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,dono_id,telefone,whatsapp,horario_funcionamento)
 values(details->>'nome',nullif(details->>'place_id',''),(details->>'categoria')::public.establishment_category,details->>'endereco',details->>'bairro',details->>'cidade',details->>'estado',details->>'cep',(details->>'latitude')::double precision,(details->>'longitude')::double precision,details->>'descricao',array(select jsonb_array_elements_text(coalesce(details->'fotos','[]'))),auth.uid(),details->>'telefone',details->>'whatsapp',details->>'horario_funcionamento') returning id into local_id;
 insert into public.accessibility_criteria(establishment_id,tipo_deficiencia,criterio,presente,recurso,observacao_livre)
 select local_id,(r->>'tipo_deficiencia')::public.disability_type,r->>'criterio',(r->>'presente')::boolean,r->>'recurso',r->>'observacao_livre' from jsonb_array_elements(criteria) r;
 return local_id;
end;
$$;
revoke all on function public.register_establishment(jsonb,jsonb) from public;
grant execute on function public.register_establishment(jsonb,jsonb) to authenticated;

create or replace function private.guard_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.establishments where id=new.establishment_id and status='verificado') then raise exception 'Local não verificado'; end if;
 new.user_id:=auth.uid();
 select nome into new.user_nome from public.users where id=auth.uid();
 new.data:=now(); new.denunciada:=false; new.motivo_denuncia:=null;
 return new;
end;
$$;
revoke all on function private.guard_review() from public;
drop trigger if exists guard_review on public.reviews;
create trigger guard_review before insert on public.reviews for each row execute function private.guard_review();
grant insert(establishment_id,tipo_deficiencia_avaliada,nota,comentario) on public.reviews to authenticated;

-- Deliberately returns only public report fields; author IDs and refusal reasons remain private.
create or replace function public.get_approved_reports(requested_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'respostas',respostas,'comentario',comentario,'fotos',fotos,'criado_em',criado_em,'status',status)), '[]'::jsonb)
 from public.place_reports where local_key=requested_key and status='aprovado';
$$;
revoke all on function public.get_approved_reports(text) from public;
grant execute on function public.get_approved_reports(text) to anon,authenticated;

create or replace function public.get_place_accessibility(requested_place_id text) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select coalesce((select jsonb_build_object('encontrado',true,'verificado',e.status='verificado','local',
 jsonb_build_object('id',e.id,'place_id',e.place_id,'nome',e.nome,'categoria',e.categoria,'endereco',e.endereco,'bairro',e.bairro,'cidade',e.cidade,'estado',e.estado,'cep',e.cep,'latitude',e.latitude,'longitude',e.longitude,'descricao',e.descricao,'fotos',e.fotos,'status',e.status,'telefone',e.telefone,'whatsapp',e.whatsapp,'email_contato',e.email_contato,'horario_funcionamento',e.horario_funcionamento,'website',e.website,'nota_media',e.nota_media,'total_avaliacoes',e.total_avaliacoes,'verificado_em',e.verificado_em,'criado_em',e.criado_em,
 'criteria',coalesce((select jsonb_agg(to_jsonb(c)) from public.accessibility_criteria c where c.establishment_id=e.id),'[]'::jsonb)))
 from public.establishments e where e.place_id=requested_place_id and e.status='verificado' limit 1),jsonb_build_object('encontrado',false,'verificado',false,'local',null));
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('report-photos','report-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists report_photo_insert on storage.objects;
create policy report_photo_insert on storage.objects for insert to authenticated with check(bucket_id='report-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and (select count(*) from storage.objects s where s.bucket_id='report-photos' and s.owner_id=(select auth.uid())::text and s.created_at>now()-interval '24 hours')<30);
drop policy if exists report_photo_read on storage.objects;
create policy report_photo_read on storage.objects for select to anon,authenticated using(bucket_id='report-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select auth.jwt()->'app_metadata'->>'role')='admin' or exists(select 1 from jsonb_array_elements(public.get_approved_reports(split_part(name,'/',2))) r where r->'fotos' ? name)));
drop policy if exists report_photo_delete on storage.objects;
create policy report_photo_delete on storage.objects for delete to authenticated using(bucket_id='report-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and not exists(select 1 from public.place_reports r where name=any(r.fotos)));
commit;
