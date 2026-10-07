begin;
select set_config('test.owner',(select user_id::text from private.administrator_access where enabled and is_owner),true);
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select set_config('test.first',(public.submit_public_registration('{"nome":"Teste reversível","descricao":"Teste sem envio de e-mail","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"fotos":[],"status":"verificado","nota_media":5}'::jsonb,'[]'::jsonb,repeat('a',64))->>'id'),true);
select set_config('test.second',(public.submit_public_registration('{"nome":"Teste reversível 2","descricao":"Teste sem envio de e-mail","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"fotos":[]}'::jsonb,'[]'::jsonb,repeat('a',64))->>'id'),true);
select public.submit_public_registration('{"nome":"Teste reversível 3","descricao":"Teste sem envio de e-mail","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"fotos":[]}'::jsonb,'[]'::jsonb,repeat('a',64))->>'id';
do $$begin
 if not exists(select 1 from public.establishments where id=current_setting('test.first')::uuid and status='pendente' and dono_id is null and nota_media=0 and verificado_em is null) then raise exception 'Cadastro público promoveu campos protegidos'; end if;
 begin
  perform public.submit_public_registration('{"nome":"Quarto teste","descricao":"Não deve ser gravado","categoria":"educacao","endereco":"Rua Teste","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"fotos":[]}'::jsonb,'[]'::jsonb,repeat('a',64));
  raise exception 'Limite não aplicado';
 exception when others then if sqlerrm not like 'Limite de cadastros%' then raise; end if; end;
end;$$;
reset role;
set local role anon;
do $$begin
 begin perform public.submit_public_registration('{}','[]',repeat('b',64));raise exception 'Anônimo chamou RPC de servidor';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.establishments where id=current_setting('test.first')::uuid) then raise exception 'Anônimo leu cadastro pendente'; end if;
end;$$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000999"}',true);
set local role authenticated;
do $$begin
 begin perform public.registration_for_review(current_setting('test.first')::uuid);raise exception 'Não titular leu revisão';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
 begin perform public.decide_registration(current_setting('test.first')::uuid,true,'');raise exception 'Não titular aprovou';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
end;$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.owner'))::text,true);
set local role authenticated;
select public.registration_for_review(current_setting('test.first')::uuid)->>'nome';
select public.decide_registration(current_setting('test.first')::uuid,true,'');
select public.decide_registration(current_setting('test.second')::uuid,false,'Dados incompletos');
do $$begin
 if not exists(select 1 from public.establishments where id=current_setting('test.first')::uuid and status='verificado' and verificado_em is not null) then raise exception 'Aprovação não publicada'; end if;
 if not exists(select 1 from public.establishments where id=current_setting('test.second')::uuid and status='rejeitado' and motivo_rejeicao='Dados incompletos') then raise exception 'Recusa não registrada'; end if;
 begin perform public.decide_registration(current_setting('test.first')::uuid,false,'Nova decisão');raise exception 'Decisão repetida permitida';exception when others then if sqlerrm<>'Cadastro indisponível ou já revisado' then raise;end if;end;
end;$$;
reset role;
select jsonb_build_object('pending_only',true,'rate_limit',true,'server_only_submission',true,'anonymous_pending_read_denied',true,'non_owner_denied',true,'owner_approval',true,'owner_refusal',true,'repeat_denied',true) as checks;
rollback;
