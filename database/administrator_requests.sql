-- Apply after administrator_access.sql. Notification credentials belong only on the server.
begin;
alter table private.administrator_access add column if not exists is_owner boolean not null default false;
create unique index if not exists administrator_single_owner on private.administrator_access(is_owner) where is_owner;
-- Preserve the explicitly claimed initial administrator as the sole approver.
update private.administrator_access a set is_owner=true
where a.enabled and exists(select 1 from private.administrator_bootstrap b where b.claimed_user=a.user_id)
and not exists(select 1 from private.administrator_access where is_owner);
create table if not exists private.administrator_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 status text not null default 'pendente' check(status in ('pendente','aprovado','recusado')),
 requested_at timestamptz not null default now(),
 decided_at timestamptz,
 decided_by uuid references auth.users(id) on delete set null,
 notified_at timestamptz
);
alter table private.administrator_requests enable row level security;
revoke all on private.administrator_requests from public,anon,authenticated;
create policy deny_client_access on private.administrator_requests for all to anon,authenticated using(false) with check(false);
create index administrator_requests_status_idx on private.administrator_requests(status,requested_at);
create index administrator_requests_decider_idx on private.administrator_requests(decided_by);
create or replace function private.is_owner() returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_admin() and exists(select 1 from private.administrator_access where user_id=auth.uid() and enabled and is_owner);
$$;
create or replace function private.request_admin_access() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result private.administrator_requests;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail antes de solicitar acesso'; end if;
 if private.is_admin() then raise exception 'Esta conta já está autorizada'; end if;
 insert into private.administrator_requests(user_id) values(auth.uid()) on conflict(user_id) do nothing;
 select * into result from private.administrator_requests where user_id=auth.uid();
 return jsonb_build_object('id',result.id,'status',result.status,'notified',result.notified_at is not null);
end;
$$;
create or replace function private.my_admin_access_request() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',id,'status',status,'notified',notified_at is not null) from private.administrator_requests where user_id=auth.uid();
$$;
create or replace function private.list_admin_access_requests() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'email',u.email,'status',r.status,'requested_at',r.requested_at,'notified',r.notified_at is not null) order by r.requested_at) from private.administrator_requests r join auth.users u on u.id=r.user_id where r.status='pendente'),'[]'::jsonb);
end;
$$;
create or replace function private.decide_admin_access_request(request_id uuid,approve boolean) returns void
language plpgsql security definer set search_path='' as $$
declare target private.administrator_requests;
begin
 if not private.is_owner() then raise exception 'Acesso não autorizado'; end if;
 select * into target from private.administrator_requests where id=request_id for update;
 if not found or target.status<>'pendente' then raise exception 'Solicitação já analisada ou inexistente'; end if;
 if approve is null then raise exception 'Informe a decisão'; end if;
 if approve then
  if not exists(select 1 from auth.users where id=target.user_id and email_confirmed_at is not null) then raise exception 'E-mail não confirmado'; end if;
  insert into private.administrator_access(user_id) values(target.user_id) on conflict(user_id) do update set enabled=true;
 end if;
 update private.administrator_requests set status=case when approve then 'aprovado' else 'recusado' end,decided_at=now(),decided_by=auth.uid() where id=request_id;
end;
$$;
-- Only the server may obtain the owner's address and mark notification delivery.
create or replace function private.admin_access_notification(request_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',r.id,'status',r.status,'notified',r.notified_at is not null,'requester_email',u.email,'owner_email',(select o.email from private.administrator_access a join auth.users o on o.id=a.user_id where a.is_owner and a.enabled))
 from private.administrator_requests r join auth.users u on u.id=r.user_id where r.id=request_id;
$$;
create or replace function private.mark_admin_access_notified(request_id uuid) returns void
language sql security definer set search_path='' as $$
 update private.administrator_requests set notified_at=coalesce(notified_at,now()) where id=request_id;
$$;
create or replace function public.is_site_owner() returns boolean language sql stable security invoker set search_path='' as $$ select private.is_owner(); $$;
create or replace function public.request_admin_access() returns jsonb language sql security invoker set search_path='' as $$ select private.request_admin_access(); $$;
create or replace function public.my_admin_access_request() returns jsonb language sql stable security invoker set search_path='' as $$ select private.my_admin_access_request(); $$;
create or replace function public.list_admin_access_requests() returns jsonb language sql stable security invoker set search_path='' as $$ select private.list_admin_access_requests(); $$;
create or replace function public.decide_admin_access_request(request_id uuid,approve boolean) returns void language sql security invoker set search_path='' as $$ select private.decide_admin_access_request(request_id,approve); $$;
create or replace function public.admin_access_notification(request_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.admin_access_notification(request_id); $$;
create or replace function public.mark_admin_access_notified(request_id uuid) returns void language sql security invoker set search_path='' as $$ select private.mark_admin_access_notified(request_id); $$;
revoke all on function private.is_owner(),private.request_admin_access(),private.my_admin_access_request(),private.list_admin_access_requests(),private.decide_admin_access_request(uuid,boolean),private.admin_access_notification(uuid),private.mark_admin_access_notified(uuid),public.is_site_owner(),public.request_admin_access(),public.my_admin_access_request(),public.list_admin_access_requests(),public.decide_admin_access_request(uuid,boolean),public.admin_access_notification(uuid),public.mark_admin_access_notified(uuid) from public,anon,authenticated;
grant execute on function private.is_owner(),private.request_admin_access(),private.my_admin_access_request(),private.list_admin_access_requests(),private.decide_admin_access_request(uuid,boolean),public.is_site_owner(),public.request_admin_access(),public.my_admin_access_request(),public.list_admin_access_requests(),public.decide_admin_access_request(uuid,boolean) to authenticated;
grant usage on schema private to service_role;
grant execute on function private.admin_access_notification(uuid),private.mark_admin_access_notified(uuid),public.admin_access_notification(uuid),public.mark_admin_access_notified(uuid) to service_role;
commit;
