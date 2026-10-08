begin;
select set_config('test.owner',(select user_id::text from private.administrator_access where enabled and is_owner),true);
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select set_config('test.route',(public.submit_public_directory('routes','{"titulo":"Teste reversível","cidade":"Cataguases","ponto_origem":"Rua A","ponto_destino":"Rua B","trecho_descricao":"Sem envio de e-mail","status":"verificado","auditada":true}',repeat('d',64))->>'id'),true);
select set_config('test.person',(public.submit_public_directory('professionals','{"nome":"Teste reversível","especialidade":"Teste","cidade":"Cataguases","estado":"MG","atende_por_tipo":[],"status":"verificado"}',repeat('d',64))->>'id'),true);
select public.submit_public_registration('{"nome":"Teste de limite compartilhado","categoria":"educacao","descricao":"Sem envio","endereco":"Rua A","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"fotos":[]}','[]',repeat('d',64));
do $$begin
 begin perform public.submit_public_directory('routes','{"titulo":"Quarto","cidade":"Cataguases","ponto_origem":"A","ponto_destino":"B","trecho_descricao":"Teste"}',repeat('d',64));raise exception 'Diretório ignorou cota compartilhada';exception when others then if sqlerrm not like 'Limite de cadastros%' then raise;end if;end;
 begin perform public.submit_public_registration('{"nome":"Quarto","categoria":"educacao","descricao":"Teste","endereco":"Rua A","cidade":"Cataguases","estado":"MG","latitude":-21.39,"longitude":-42.69,"fotos":[]}','[]',repeat('d',64));raise exception 'Local ignorou cota compartilhada';exception when others then if sqlerrm not like 'Limite de cadastros%' then raise;end if;end;
end;$$;
reset role;
do $$begin
 if not exists(select 1 from public.routes r join private.directory_submissions s on s.route_id=r.id where s.id=current_setting('test.route')::uuid and r.status='pendente' and not r.auditada and r.author_id is null and not r.tem_rampa and not r.tem_piso_tatil and r.distancia_metros=0) then raise exception 'Campos protegidos promovidos';end if;
end;$$;
set local role anon;
do $$begin
 begin perform public.submit_public_directory('routes','{}',repeat('e',64));raise exception 'Anônimo chamou criação';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.routes where titulo='Teste reversível') then raise exception 'Anônimo leu pendente';end if;
 begin perform public.directory_for_review(current_setting('test.route')::uuid);raise exception 'Anônimo leu revisão';exception when insufficient_privilege then null;end;
end;$$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000999"}',true);
set local role authenticated;
do $$begin
 begin perform public.directory_for_review(current_setting('test.route')::uuid);raise exception 'Não titular leu';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
 begin perform public.decide_directory(current_setting('test.route')::uuid,true,'');raise exception 'Não titular aprovou';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
end;$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.owner'))::text,true);
set local role authenticated;
do $$begin
 if public.directory_for_review(current_setting('test.route')::uuid)->>'kind'<>'routes' then raise exception 'Revisão incorreta';end if;
 begin perform public.decide_directory(current_setting('test.person')::uuid,false,'');raise exception 'Recusa sem motivo';exception when others then if sqlerrm<>'Informe o motivo da recusa' then raise;end if;end;
end;$$;
select public.decide_directory(current_setting('test.route')::uuid,true,'');
select public.decide_directory(current_setting('test.person')::uuid,false,'Contato incompleto');
do $$begin
 begin perform public.decide_directory(current_setting('test.route')::uuid,true,'');raise exception 'Decisão repetida';exception when others then if sqlerrm<>'Cadastro já revisado' then raise;end if;end;
end;$$;
reset role;
do $$begin
 if not exists(select 1 from public.routes r join private.directory_submissions s on s.route_id=r.id where s.id=current_setting('test.route')::uuid and r.status='verificado' and not r.auditada) then raise exception 'Aprovação inventou auditoria';end if;
 if not exists(select 1 from public.professionals p join private.directory_submissions s on s.professional_id=p.id where s.id=current_setting('test.person')::uuid and p.status='rejeitado' and p.motivo_rejeicao='Contato incompleto') then raise exception 'Recusa não salva';end if;
end;$$;
select 'directory security checks passed' as checks;
rollback;
