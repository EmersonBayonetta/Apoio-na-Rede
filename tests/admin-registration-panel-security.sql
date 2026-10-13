begin;
select set_config('test.admin',(select user_id::text from private.administrator_access where enabled and is_owner),true);
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.admin'))::text,true);
with inserted as (insert into public.establishments(nome,categoria,endereco,cidade,estado,latitude,longitude,descricao,status)
 values('Panel rollback local','educacao','Rua Teste','Cataguases','MG',-21.4,-42.7,'Temporary panel validation','pendente') returning id)
select set_config('test.place',(select id::text from inserted),true);
with inserted as (insert into public.professionals(nome,especialidade,cidade,estado,descricao,status)
 values('Panel rollback professional','Teste','Cataguases','MG','Temporary panel validation','pendente') returning id)
select set_config('test.professional',(select id::text from inserted),true);
with inserted as (insert into public.routes(titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,status)
 values('Panel rollback route','Cataguases','Rua Teste A','Rua Teste B','Temporary panel validation','pendente') returning id)
select set_config('test.route',(select id::text from inserted),true);
set local role authenticated;
do $$declare data jsonb;begin
 data:=public.admin_registration_list('','pendente','Panel rollback',0);
 if (data->>'total')::integer<>3 or jsonb_array_length(data->'entries')<>3 then raise exception 'Panel list missed registration types';end if;
 if public.admin_registration_detail('places',current_setting('test.place')::uuid)->>'nome'<>'Panel rollback local' then raise exception 'Panel detail failed';end if;
 perform public.admin_decide_registration('places',current_setting('test.place')::uuid,true,'');
 perform public.admin_decide_registration('professionals',current_setting('test.professional')::uuid,false,'Incomplete registration');
 perform public.admin_decide_registration('routes',current_setting('test.route')::uuid,true,'');
 if not exists(select 1 from public.establishments where id=current_setting('test.place')::uuid and status='verificado') then raise exception 'Place approval failed';end if;
 if not exists(select 1 from public.professionals where id=current_setting('test.professional')::uuid and status='rejeitado') then raise exception 'Professional refusal failed';end if;
 if not exists(select 1 from public.routes where id=current_setting('test.route')::uuid and status='verificado' and not auditada) then raise exception 'Route approval invented audit';end if;
 begin perform public.admin_decide_registration('places',current_setting('test.place')::uuid,false,'Again');raise exception 'Repeated decision allowed';exception when others then if sqlerrm<>'Cadastro indisponível ou já revisado' then raise;end if;end;
end;$$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000099"}',true);
set local role authenticated;
do $$begin
 begin perform public.admin_registration_list();raise exception 'Unauthorized list allowed';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
 begin perform public.admin_registration_detail('places',current_setting('test.place')::uuid);raise exception 'Unauthorized detail allowed';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
 begin perform public.admin_decide_registration('places',current_setting('test.place')::uuid,true,'');raise exception 'Unauthorized approval allowed';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
end;$$;
reset role;
set local role anon;
do $$begin begin perform public.admin_registration_list();raise exception 'Anonymous list allowed';exception when insufficient_privilege then null;end;end;$$;
reset role;
select jsonb_build_object('all_types_listed',true,'admin_details',true,'approval',true,'refusal',true,'repeat_denied',true,'route_not_audited',true,'unauthorized_denied',true,'anonymous_denied',true) as checks;
rollback;
