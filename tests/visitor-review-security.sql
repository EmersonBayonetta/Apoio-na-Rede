begin;
do $$
declare test_place_uuid uuid; other_id uuid; result jsonb; original_count int;
begin
 select id into test_place_uuid from public.establishments where status='verificado' limit 1;
 select id into other_id from public.establishments where status='verificado' and id<>test_place_uuid limit 1;
 select count(*) into original_count from public.reviews where establishment_id=test_place_uuid;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 result:=public.submit_visitor_review(jsonb_build_object('establishment_id',test_place_uuid,'nota',4,'comentario','Teste temporário, transação revertida','tipo_deficiencia_avaliada','mobilidade','user_nome','Admin','denunciada',true),repeat('a',64));
 if result->>'user_nome'<>'Visitante da comunidade' or (result->>'denunciada')::bool or result ? 'visitor_hash' then raise exception 'Campos privilegiados expostos'; end if;
 if not public.has_visitor_review(test_place_uuid,repeat('a',64)) then raise exception 'Identificador não registrado'; end if;
 if (select count(*) from public.reviews where establishment_id=test_place_uuid)<>original_count+1 then raise exception 'Avaliação não criada'; end if;
 begin
  perform public.submit_visitor_review(jsonb_build_object('establishment_id',test_place_uuid,'nota',2,'comentario','Segundo envio','tipo_deficiencia_avaliada','mobilidade'),repeat('a',64));
  raise exception 'Duplicata aceita';
 exception when unique_violation then null;
 end;
 perform public.submit_visitor_review(jsonb_build_object('establishment_id',other_id,'nota',5,'comentario','Outro local','tipo_deficiencia_avaliada','visual'),repeat('a',64));
 perform public.submit_visitor_review(jsonb_build_object('establishment_id',test_place_uuid,'nota',5,'comentario','Outro identificador','tipo_deficiencia_avaliada','visual'),repeat('b',64));
 delete from public.reviews where id=(result->>'id')::uuid;
 if not public.has_visitor_review(test_place_uuid,repeat('a',64)) then raise exception 'Remoção liberou repetição'; end if;
 perform set_config('request.jwt.claims','{"role":"anon"}',true);
 begin
  perform public.has_visitor_review(test_place_uuid,repeat('a',64));raise exception 'Consulta anônima privada aceita';
 exception when insufficient_privilege then null;
 end;
 if has_function_privilege('anon','public.submit_visitor_review(jsonb,text)','execute') or has_function_privilege('authenticated','public.submit_visitor_review(jsonb,text)','execute') or has_table_privilege('anon','private.visitor_reviews','select') or has_column_privilege('authenticated','public.reviews','comentario','insert') then raise exception 'Permissão pública excessiva'; end if;
end;
$$;
rollback;
