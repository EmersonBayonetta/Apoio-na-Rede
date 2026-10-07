begin;
alter table public.establishments add column if not exists informado_responsavel boolean not null default true;
grant select(informado_responsavel) on public.establishments to anon;

-- Public wrappers run as invoker; private definers expose only approved, sanitized data.
create or replace function private.approved_reports(requested_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'respostas',respostas,'comentario',comentario,'fotos',fotos,'criado_em',criado_em,'status',status)), '[]'::jsonb)
 from public.place_reports where local_key=requested_key and status='aprovado';
$$;
revoke all on function private.approved_reports(text) from public;
grant usage on schema private to anon,authenticated;
grant execute on function private.approved_reports(text) to anon,authenticated;
create or replace function public.get_approved_reports(requested_key text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.approved_reports(requested_key); $$;

create or replace function private.public_report_photo(photo_path text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.place_reports where status='aprovado' and photo_path=any(fotos));
$$;
revoke all on function private.public_report_photo(text) from public;
grant execute on function private.public_report_photo(text) to anon,authenticated;
drop policy if exists report_photo_read on storage.objects;
create policy report_photo_read on storage.objects for select to anon,authenticated using(bucket_id='report-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select auth.jwt()->'app_metadata'->>'role')='admin' or private.public_report_photo(name)));

create table if not exists public.review_flags (
 id uuid primary key default gen_random_uuid(),
 review_id uuid not null references public.reviews(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 motivo text not null check(length(trim(motivo)) between 1 and 2000),
 criado_em timestamptz not null default now(),
 unique(review_id,user_id)
);
alter table public.review_flags enable row level security;
revoke all on public.review_flags from anon,authenticated;
grant insert(review_id,motivo),select on public.review_flags to authenticated;
drop policy if exists review_flags_read on public.review_flags;
create policy review_flags_read on public.review_flags for select to authenticated using(user_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists review_flags_insert on public.review_flags;
create policy review_flags_insert on public.review_flags for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.reviews r where r.id=review_id and not r.denunciada));

create or replace function private.flag_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 update public.reviews set denunciada=true,motivo_denuncia=new.motivo where id=new.review_id;
 return new;
end;
$$;
revoke all on function private.flag_review() from public;
drop trigger if exists flag_review on public.review_flags;
create trigger flag_review after insert on public.review_flags for each row execute function private.flag_review();

create or replace function private.guard_establishment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 -- Nested updates originate only from the trusted aggregate trigger below.
 if pg_trigger_depth()>1 then return new; end if;
 if private.is_admin() then
  if new.status='verificado' then new.verificado_em:=now(); new.motivo_rejeicao:=null; end if;
  if new.status='rejeitado' and nullif(trim(new.motivo_rejeicao),'') is null then raise exception 'Informe o motivo da recusa'; end if;
  return new;
 end if;
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.establishments where dono_id=auth.uid() and criado_em>now()-interval '24 hours')>=3 then raise exception 'Limite de 3 cadastros em 24 horas atingido'; end if;
  new.nota_media:=0; new.total_avaliacoes:=0; new.motivo_rejeicao:=null; new.verificado_em:=null; new.criado_em:=now(); new.informado_responsavel:=true;
 else
  new.nota_media:=old.nota_media; new.total_avaliacoes:=old.total_avaliacoes;
  new.verificado_em:=old.verificado_em; new.motivo_rejeicao:=old.motivo_rejeicao; new.criado_em:=old.criado_em; new.informado_responsavel:=old.informado_responsavel;
 end if;
 new.dono_id:=auth.uid(); new.status:='pendente'; new.atualizado_em:=now();
 return new;
end;
$$;
revoke all on function private.guard_establishment() from public;

create or replace function private.review_totals() returns trigger
language plpgsql security definer set search_path = '' as $$
declare local_id uuid;
begin
 local_id:=case when TG_OP='DELETE' then old.establishment_id else new.establishment_id end;
 update public.establishments set total_avaliacoes=(select count(*) from public.reviews where establishment_id=local_id and not denunciada),nota_media=coalesce((select avg(nota) from public.reviews where establishment_id=local_id and not denunciada),0) where id=local_id;
 return null;
end;
$$;
revoke all on function private.review_totals() from public;
drop trigger if exists review_totals on public.reviews;
create trigger review_totals after insert or update or delete on public.reviews for each row execute function private.review_totals();
commit;
