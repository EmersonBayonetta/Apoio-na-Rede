-- Public reviews without email. Browser identity hashes stay private.
create table if not exists private.visitor_reviews (
 establishment_id uuid not null references public.establishments(id) on delete cascade,
 visitor_hash text not null check(visitor_hash ~ '^[a-f0-9]{64}$'),
 review_id uuid references public.reviews(id) on delete set null,
 primary key(establishment_id,visitor_hash)
);
alter table private.visitor_reviews enable row level security;
revoke all on private.visitor_reviews from public,anon,authenticated;
create policy visitor_reviews_private on private.visitor_reviews for all to anon,authenticated using(false) with check(false);
create index visitor_reviews_review_idx on private.visitor_reviews(review_id);

create or replace function private.guard_review() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.establishments where id=new.establishment_id and status='verificado') then raise exception 'Local não verificado'; end if;
 new.user_id:=auth.uid();
 if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role'='service_role' then
  new.user_id:=null; new.user_nome:='Visitante da comunidade';
 else
  select nome into new.user_nome from public.users where id=auth.uid();
 end if;
 new.data:=now(); new.denunciada:=false; new.motivo_denuncia:=null;
 return new;
end;
$$;
revoke all on function private.guard_review() from public,anon,authenticated;

create or replace function private.submit_visitor_review(details jsonb,visitor_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare place_id uuid; saved public.reviews;
begin
 if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then raise insufficient_privilege; end if;
 if visitor_hash is null or visitor_hash !~ '^[a-f0-9]{64}$' then raise exception 'Identificador inválido'; end if;
 place_id:=(details->>'establishment_id')::uuid;
 if nullif(btrim(details->>'comentario'),'') is null or length(details->>'comentario')>5000 or (details->>'nota')::int not between 1 and 5 then raise exception 'Avaliação inválida'; end if;
 -- Unique constraint is atomic, including simultaneous requests. Keep identity after moderation/deletion.
 insert into private.visitor_reviews(establishment_id,visitor_hash) values(place_id,visitor_hash);
 insert into public.reviews(establishment_id,tipo_deficiencia_avaliada,nota,comentario)
 values(place_id,(details->>'tipo_deficiencia_avaliada')::public.disability_type,(details->>'nota')::int,btrim(details->>'comentario')) returning * into saved;
 update private.visitor_reviews v set review_id=saved.id where v.establishment_id=place_id and v.visitor_hash=submit_visitor_review.visitor_hash;
 return jsonb_build_object('id',saved.id,'establishment_id',saved.establishment_id,'user_nome',saved.user_nome,'tipo_deficiencia_avaliada',saved.tipo_deficiencia_avaliada,'nota',saved.nota,'comentario',saved.comentario,'data',saved.data,'denunciada',saved.denunciada);
end;
$$;
create or replace function private.has_visitor_review(place_id uuid,visitor_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then raise insufficient_privilege; end if;
 return exists(select 1 from private.visitor_reviews v where v.establishment_id=place_id and v.visitor_hash=has_visitor_review.visitor_hash);
end;
$$;
create or replace function public.submit_visitor_review(details jsonb,visitor_hash text) returns jsonb language sql security invoker set search_path='' as $$select private.submit_visitor_review(details,visitor_hash)$$;
create or replace function public.has_visitor_review(place_id uuid,visitor_hash text) returns boolean language sql security invoker set search_path='' as $$select private.has_visitor_review(place_id,visitor_hash)$$;
revoke all on function private.submit_visitor_review(jsonb,text),private.has_visitor_review(uuid,text),public.submit_visitor_review(jsonb,text),public.has_visitor_review(uuid,text) from public,anon,authenticated;
grant execute on function private.submit_visitor_review(jsonb,text),private.has_visitor_review(uuid,text),public.submit_visitor_review(jsonb,text),public.has_visitor_review(uuid,text) to service_role;
-- Prevent authenticated legacy direct inserts from bypassing the visitor limit.
revoke insert on public.reviews from anon,authenticated;
revoke insert(establishment_id,tipo_deficiencia_avaliada,nota,comentario) on public.reviews from anon,authenticated;
