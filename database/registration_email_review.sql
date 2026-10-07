-- Cadastros públicos pendentes; somente o servidor registra e avisa o titular.
create table if not exists private.registration_submissions (
 establishment_id uuid primary key references public.establishments(id) on delete cascade,
 source_hash text not null check(source_hash ~ '^[0-9a-f]{64}$'),
 criado_em timestamptz not null default now(), notified_at timestamptz
);
alter table private.registration_submissions enable row level security;
drop policy if exists registration_submissions_deny_clients on private.registration_submissions;
create policy registration_submissions_deny_clients on private.registration_submissions for all to anon,authenticated using(false) with check(false);
revoke all on private.registration_submissions from public,anon,authenticated;
create index if not exists registration_submission_source_time on private.registration_submissions(source_hash,criado_em);

create or replace function private.submit_public_registration(details jsonb,criteria jsonb,source_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare local_id uuid; recipient text;
begin
 if source_hash !~ '^[0-9a-f]{64}$' then raise exception 'Solicitação inválida'; end if;
 if jsonb_typeof(details)<>'object' or jsonb_typeof(criteria)<>'array' or jsonb_array_length(criteria)>50 then raise exception 'Cadastro inválido'; end if;
 select u.email into recipient from private.administrator_access a join auth.users u on u.id=a.user_id where a.enabled and a.is_owner and u.email_confirmed_at is not null;
 if recipient is null then raise exception 'Responsável pela revisão indisponível'; end if;
 perform pg_advisory_xact_lock(hashtextextended('public-registration',0));
 if (select count(*) from private.registration_submissions s where s.source_hash=submit_public_registration.source_hash and s.criado_em>now()-interval '24 hours')>=3
 or (select count(*) from private.registration_submissions where criado_em>now()-interval '24 hours')>=100 then raise exception 'Limite de cadastros atingido. Tente novamente mais tarde'; end if;
 insert into public.establishments(nome,place_id,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,telefone,whatsapp,horario_funcionamento)
 values(details->>'nome',nullif(details->>'place_id',''),(details->>'categoria')::public.establishment_category,details->>'endereco',details->>'bairro',details->>'cidade',details->>'estado',details->>'cep',(details->>'latitude')::double precision,(details->>'longitude')::double precision,details->>'descricao',array(select jsonb_array_elements_text(coalesce(details->'fotos','[]'))),details->>'telefone',details->>'whatsapp',details->>'horario_funcionamento') returning id into local_id;
 insert into public.accessibility_criteria(establishment_id,tipo_deficiencia,criterio,presente,recurso,observacao_livre)
 select local_id,(r->>'tipo_deficiencia')::public.disability_type,r->>'criterio',(r->>'presente')::boolean,r->>'recurso',r->>'observacao_livre' from jsonb_array_elements(criteria) r;
 insert into private.registration_submissions(establishment_id,source_hash) values(local_id,source_hash);
 return jsonb_build_object('id',local_id,'owner_email',recipient);
end;
$$;
create or replace function public.submit_public_registration(details jsonb,criteria jsonb,source_hash text) returns jsonb
language sql security invoker set search_path='' as $$select private.submit_public_registration(details,criteria,source_hash);$$;

create or replace function private.mark_registration_notified(registration_id uuid) returns void
language sql security definer set search_path='' as $$update private.registration_submissions set notified_at=now() where establishment_id=registration_id;$$;
create or replace function public.mark_registration_notified(registration_id uuid) returns void
language sql security invoker set search_path='' as $$select private.mark_registration_notified(registration_id);$$;

create or replace function private.registration_for_review(registration_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 return (select jsonb_build_object('id',e.id,'nome',e.nome,'categoria',e.categoria,'endereco',e.endereco,'cidade',e.cidade,'estado',e.estado,'descricao',e.descricao,'telefone',e.telefone,'whatsapp',e.whatsapp,'horario_funcionamento',e.horario_funcionamento,'fotos',e.fotos,'status',e.status,'motivo_rejeicao',e.motivo_rejeicao,'criteria',(select coalesce(jsonb_agg(jsonb_build_object('criterio',c.criterio,'presente',c.presente,'observacao_livre',c.observacao_livre)),'[]'::jsonb) from public.accessibility_criteria c where c.establishment_id=e.id))
 from public.establishments e join private.registration_submissions s on s.establishment_id=e.id where e.id=registration_id);
end;
$$;
create or replace function public.registration_for_review(registration_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select private.registration_for_review(registration_id);$$;

create or replace function private.decide_registration(registration_id uuid,approve boolean,reason text default '') returns void
language plpgsql security definer set search_path='' as $$
declare current_status public.establishment_status;
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 select e.status into current_status from public.establishments e join private.registration_submissions s on s.establishment_id=e.id where e.id=registration_id for update of e;
 if not found or current_status<>'pendente' then raise exception 'Cadastro indisponível ou já revisado'; end if;
 if approve is null or (not approve and nullif(trim(reason),'') is null) then raise exception 'Informe o motivo da recusa'; end if;
 update public.establishments set status=case when approve then 'verificado'::public.establishment_status else 'rejeitado'::public.establishment_status end,motivo_rejeicao=case when approve then null else left(trim(reason),1000) end where id=registration_id;
end;
$$;
create or replace function public.decide_registration(registration_id uuid,approve boolean,reason text default '') returns void
language sql security invoker set search_path='' as $$select private.decide_registration(registration_id,approve,reason);$$;

revoke all on function private.submit_public_registration(jsonb,jsonb,text),public.submit_public_registration(jsonb,jsonb,text),private.mark_registration_notified(uuid),public.mark_registration_notified(uuid),private.registration_for_review(uuid),public.registration_for_review(uuid),private.decide_registration(uuid,boolean,text),public.decide_registration(uuid,boolean,text) from public,anon,authenticated;
grant execute on function private.submit_public_registration(jsonb,jsonb,text),public.submit_public_registration(jsonb,jsonb,text),private.mark_registration_notified(uuid),public.mark_registration_notified(uuid) to service_role;
grant execute on function private.registration_for_review(uuid),public.registration_for_review(uuid),private.decide_registration(uuid,boolean,text),public.decide_registration(uuid,boolean,text) to authenticated;
