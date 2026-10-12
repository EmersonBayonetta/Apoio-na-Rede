-- Uses the existing administrator permissions; rolls back every test record.
begin;
select set_config('test.management_admin',(select user_id::text from private.administrator_access where enabled and is_owner),true);
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.management_admin'))::text,true);
do $$begin
 if not public.is_site_admin() then raise exception 'Administrator identity unavailable'; end if;
end;$$;
with inserted as (
 insert into public.establishments(nome,categoria,endereco,cidade,estado,latitude,longitude,descricao,fotos,status,nota_media,total_avaliacoes,atualizado_em)
 values('Management rollback test','educacao','Rua Teste, 10','Cataguases','MG',-21.4,-42.7,'Temporary test','{}','verificado',4,3,'2026-01-01T00:00:00Z') returning id
) select set_config('test.management_place',(select id::text from inserted),true);
with inserted as (
 insert into public.establishments(nome,categoria,endereco,cidade,estado,latitude,longitude,descricao,fotos,status)
 values('Pending management rollback test','educacao','Rua Teste, 10','Cataguases','MG',-21.4,-42.7,'Temporary test','{}','pendente') returning id
) select set_config('test.management_pending',(select id::text from inserted),true);
set local role authenticated;
update public.establishments set nome='Edited management rollback test',fotos=array['https://example.invalid/photo.jpg'],telefone='32999991111',atualizado_em=now()
where id=current_setting('test.management_place')::uuid and atualizado_em='2026-01-01T00:00:00Z';
do $$declare changed integer;begin
 if not exists(select 1 from public.establishments where id=current_setting('test.management_place')::uuid and nome='Edited management rollback test' and cardinality(fotos)=1 and status='verificado' and nota_media=4 and total_avaliacoes=3) then raise exception 'Administrator edit failed or changed protected values'; end if;
 update public.establishments set nome='Stale update' where id=current_setting('test.management_place')::uuid and atualizado_em='2026-01-01T00:00:00Z';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Stale version overwrote newer edit'; end if;
 update public.establishments set fotos=array['https://example.invalid/pending.jpg'] where id=current_setting('test.management_pending')::uuid;
 if not exists(select 1 from public.establishments where id=current_setting('test.management_pending')::uuid and status='pendente' and cardinality(fotos)=1) then raise exception 'Pending edit changed publication status'; end if;
end;$$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000099"}',true);
set local role authenticated;
do $$declare changed integer;begin
 if public.is_site_admin() then raise exception 'Ordinary identity has administrator access'; end if;
 if exists(select 1 from public.establishments where id=current_setting('test.management_pending')::uuid) then raise exception 'Unauthorized user read pending place'; end if;
 update public.establishments set fotos=array['https://example.invalid/unauthorized.jpg'] where id=current_setting('test.management_place')::uuid;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Unauthorized user edited public place'; end if;
end;$$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$declare changed integer;begin
 if exists(select 1 from public.establishments where id=current_setting('test.management_pending')::uuid) then raise exception 'Anonymous read pending place'; end if;
 begin
  update public.establishments set nome='Anonymous update' where id=current_setting('test.management_place')::uuid;
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Anonymous update allowed'; end if;
 exception when insufficient_privilege then null;end;
end;$$;
reset role;
select jsonb_build_object('admin_edit',true,'photo_added',true,'status_preserved',true,'ratings_preserved',true,'stale_edit_denied',true,'non_admin_edit_denied',true,'anonymous_denied',true) as checks;
rollback;
