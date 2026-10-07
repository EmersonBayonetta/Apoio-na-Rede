-- Transactional integration test: no test users or data survive ROLLBACK.
begin;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
values('00000000-0000-4000-8000-000000000001','apoio-test-a@example.invalid','{}','{}'),
      ('00000000-0000-4000-8000-000000000002','apoio-test-b@example.invalid','{}','{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{}}',true);
select public.register_establishment('{"nome":"Teste transacional","categoria":"educacao","endereco":"Rua Teste, 1","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"descricao":"Local temporário de teste","place_id":"transactional-security-test"}', '[]');
do $$
declare e public.establishments;
begin
 select * into e from public.establishments where place_id='transactional-security-test';
 if e.status<>'pendente' or e.dono_id<>auth.uid() then raise exception 'Cadastro ou dono incorreto'; end if;
 update public.establishments set nota_media=5,total_avaliacoes=999,verificado_em=now(),motivo_rejeicao='forjado',status='verificado' where id=e.id;
 select * into e from public.establishments where id=e.id;
 if e.nota_media<>0 or e.total_avaliacoes<>0 or e.verificado_em is not null or e.motivo_rejeicao is not null or e.status<>'pendente' then raise exception 'Campos protegidos foram alterados'; end if;
 perform public.register_establishment('{"nome":"Quota 2","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"descricao":"Teste"}', '[]');
 perform public.register_establishment('{"nome":"Quota 3","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"descricao":"Teste"}', '[]');
 begin
  perform public.register_establishment('{"nome":"Quota 4","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"descricao":"Teste"}', '[]');
  raise exception 'Quota de cadastros não aplicada';
 exception when raise_exception then
  if SQLERRM not like 'Limite de 3 cadastros%' then raise; end if;
 end;
 begin
  insert into public.reviews(establishment_id,tipo_deficiencia_avaliada,nota,comentario) values(e.id,'mobilidade',5,'Teste');
  raise exception 'Avaliação de local pendente foi permitida';
 exception when raise_exception then
  if SQLERRM='Avaliação de local pendente foi permitida' then raise; end if;
 end;
end;
$$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}',true);
update public.establishments set status='verificado' where place_id='transactional-security-test';
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{}}',true);
insert into public.place_reports(establishment_id,place_id,respostas)
 select id,'fake-place-id', '{"libras":"nao_sei","entrada_acessivel":"sim","rampa":"sim","elevador":"nao_sei","corrimao":"nao_sei","banheiro_pcd":"nao_sei","vaga_pcd":"nao_sei","piso_tatil":"nao_sei","cadeira_rodas":"nao_sei","area_descanso":"nao_sei","iluminacao_ajustavel":"nao_sei","horario_tranquilo":"nao_sei"}' from public.establishments where place_id='transactional-security-test';
do $$
declare changed integer;
begin
 if (select local_key from public.place_reports limit 1)<>'transactional-security-test' then raise exception 'Identidade do local não normalizada'; end if;
 begin
  insert into public.place_reports(place_id,respostas) select 'transactional-security-test',respostas from public.place_reports limit 1;
  raise exception 'Duplicata permitida';
 exception when unique_violation then null;
 end;
 update public.place_reports set status='aprovado'; get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Autor conseguiu aprovar relato'; end if;
 if public.get_approved_reports('transactional-security-test')<>'[]'::jsonb then raise exception 'Relato pendente exposto'; end if;
 begin
  insert into public.place_reports(place_id,respostas) select 'invalid-answer-test',jsonb_set(respostas,'{rampa}','null') from public.place_reports limit 1;
  raise exception 'Resposta nula aceita';
 exception when raise_exception then
  if SQLERRM<>'Respostas inválidas' then raise; end if;
 end;
 for i in 1..9 loop
  insert into public.place_reports(place_id,respostas) select 'quota-report-'||i,respostas from public.place_reports where local_key='transactional-security-test';
 end loop;
 begin
  insert into public.place_reports(place_id,respostas) select 'quota-report-excess',respostas from public.place_reports where local_key='transactional-security-test';
  raise exception 'Quota de relatos não aplicada';
 exception when raise_exception then
  if SQLERRM not like 'Limite de 10 relatos%' then raise; end if;
 end;
end;
$$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{}}',true);
do $$ begin
 if exists(select 1 from public.place_reports) then raise exception 'Relato de outro usuário exposto'; end if;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}',true);
update public.place_reports set status='aprovado' where local_key='transactional-security-test';
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$
declare result jsonb;
begin
 result:=public.get_approved_reports('transactional-security-test');
 if jsonb_array_length(result)<>1 or result->0 ? 'user_id' or result->0 ? 'motivo_recusa' then raise exception 'Resposta pública inválida'; end if;
 result:=public.get_place_accessibility('transactional-security-test');
 if not (result->>'encontrado')::boolean or result->'local' ? 'dono_id' or result->'local' ? 'motivo_rejeicao' then raise exception 'RPC expõe dados privados'; end if;
 begin
  perform dono_id from public.establishments;
  raise exception 'Identidade do dono exposta';
 exception when insufficient_privilege then null;
 end;
 begin
  perform id from public.place_reports;
  raise exception 'Relatos brutos expostos';
 exception when insufficient_privilege then null;
 end;
end;
$$;
reset role;
select 'PASS: registration, protected columns, canonical identity, uniqueness, moderation RLS, author privacy, public RPCs, invalid answers, report and registration quotas' as checks;
rollback;
