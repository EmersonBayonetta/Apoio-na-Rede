begin;
select set_config('test.owner',(select user_id::text from private.administrator_access where enabled and is_owner),true);
select set_config('test.reviewer',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values(current_setting('test.reviewer')::uuid,'authenticated','authenticated','reviewer-rollback@example.invalid',null,'{}','{}',now(),now());
insert into private.administrator_invitations(email,can_review) values('reviewer-rollback@example.invalid',true);
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.reviewer'))::text,true);
set local role authenticated;
do $$begin
 if public.is_site_admin() or private.is_registration_reviewer() then raise exception 'Unconfirmed email gained access'; end if;
 begin perform public.administrator_login_allowed('reviewer-rollback@example.invalid');raise exception 'Client read private login whitelist';exception when insufficient_privilege then null;end;
end;$$;
reset role;
update auth.users set email_confirmed_at=now() where id=current_setting('test.reviewer')::uuid;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.owner'))::text,true);
with inserted as (
 insert into public.establishments(nome,categoria,endereco,cidade,estado,latitude,longitude,descricao,status)
 values('Reviewer team rollback','educacao','Rua Teste','Cataguases','MG',-21.4,-42.7,'Reversible test','pendente') returning id
) select set_config('test.registration',(select id::text from inserted),true);
insert into private.registration_submissions(establishment_id,source_hash) values(current_setting('test.registration')::uuid,repeat('d',64));
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.reviewer'))::text,true);
set local role authenticated;
do $$begin
 if not public.is_site_admin() or not private.is_registration_reviewer() then raise exception 'Verified invited reviewer lacks access'; end if;
 if public.is_site_owner() then raise exception 'Reviewer gained owner powers'; end if;
 if public.registration_for_review(current_setting('test.registration')::uuid)->>'nome'<>'Reviewer team rollback' then raise exception 'Reviewer cannot load submission'; end if;
 perform public.decide_registration(current_setting('test.registration')::uuid,true,'');
 if not exists(select 1 from public.establishments where id=current_setting('test.registration')::uuid and status='verificado') then raise exception 'Reviewer cannot approve'; end if;
 update public.establishments set telefone='32999991111' where id=current_setting('test.registration')::uuid;
 if not exists(select 1 from public.establishments where id=current_setting('test.registration')::uuid and telefone='32999991111') then raise exception 'Reviewer cannot manage'; end if;
 begin perform public.list_admin_access_requests();raise exception 'Reviewer gained team-owner powers';exception when others then if sqlerrm<>'Acesso não autorizado' then raise;end if;end;
end;$$;
reset role;
update private.administrator_invitations set enabled=false where email='reviewer-rollback@example.invalid';
set local role authenticated;
do $$begin
 if public.is_site_admin() or private.is_registration_reviewer() then raise exception 'Disabled invitation retains access'; end if;
end;$$;
reset role;
select jsonb_build_object('verified_invitation_required',true,'reviewer_approval',true,'reviewer_management',true,'owner_not_transferred',true,'private_whitelist_protected',true,'revocation',true) as checks;
rollback;
