-- Reviews can target a map place without creating an establishment or certifying it.
alter table public.reviews alter column establishment_id drop not null;
alter table public.reviews add column external_place_id text;
alter table public.reviews add constraint reviews_one_target check (
 (establishment_id is not null and external_place_id is null) or
 (establishment_id is null and external_place_id is not null and external_place_id ~ '^[A-Za-z0-9_-]{3,255}$')
);
create index reviews_external_place_idx on public.reviews(external_place_id, data desc) where external_place_id is not null;

create table private.external_visitor_reviews (
 external_place_id text not null,
 visitor_hash text not null check(visitor_hash ~ '^[a-f0-9]{64}$'),
 review_id uuid references public.reviews(id) on delete set null,
 primary key(external_place_id,visitor_hash)
);
alter table private.external_visitor_reviews enable row level security;
create policy external_visitor_reviews_private on private.external_visitor_reviews for all to anon,authenticated using(false) with check(false);
revoke all on private.external_visitor_reviews from public,anon,authenticated;
grant select,insert,update on private.external_visitor_reviews to service_role;
create index external_visitor_reviews_review_idx on private.external_visitor_reviews(review_id);

create or replace function private.guard_review() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.external_place_id is not null then
  if new.establishment_id is not null or coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then raise insufficient_privilege; end if;
 elsif not exists(select 1 from public.establishments where id=new.establishment_id and status='verificado') then raise exception 'Local não verificado'; end if;
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

create function public.submit_external_visitor_review(details jsonb,visitor_hash text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare map_id text; saved public.reviews;
begin
 if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then raise insufficient_privilege; end if;
 map_id:=details->>'external_place_id';
 if map_id is null or map_id !~ '^[A-Za-z0-9_-]{3,255}$' or visitor_hash is null or visitor_hash !~ '^[a-f0-9]{64}$' then raise exception 'Identificador inválido'; end if;
 if nullif(btrim(details->>'comentario'),'') is null or length(details->>'comentario')>5000 or (details->>'nota')::int not between 1 and 5 then raise exception 'Avaliação inválida'; end if;
 insert into private.external_visitor_reviews(external_place_id,visitor_hash) values(map_id,visitor_hash);
 insert into public.reviews(external_place_id,tipo_deficiencia_avaliada,nota,comentario)
 values(map_id,(details->>'tipo_deficiencia_avaliada')::public.disability_type,(details->>'nota')::int,btrim(details->>'comentario')) returning * into saved;
 update private.external_visitor_reviews v set review_id=saved.id where v.external_place_id=map_id and v.visitor_hash=submit_external_visitor_review.visitor_hash;
 return jsonb_build_object('id',saved.id,'establishment_id',null,'external_place_id',saved.external_place_id,'user_nome',saved.user_nome,'tipo_deficiencia_avaliada',saved.tipo_deficiencia_avaliada,'nota',saved.nota,'comentario',saved.comentario,'data',saved.data,'denunciada',saved.denunciada);
end;
$$;
create function public.has_external_visitor_review(place_id text,visitor_hash text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then raise insufficient_privilege; end if;
 return exists(select 1 from private.external_visitor_reviews v where v.external_place_id=place_id and v.visitor_hash=has_external_visitor_review.visitor_hash);
end;
$$;
revoke all on function public.submit_external_visitor_review(jsonb,text),public.has_external_visitor_review(text,text) from public,anon,authenticated;
grant execute on function public.submit_external_visitor_review(jsonb,text),public.has_external_visitor_review(text,text) to service_role;
