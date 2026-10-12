-- Apply after administrator_access.sql, administrator_requests.sql and public registration scripts.
-- Personal invitation addresses are configured privately in the database, never in this file.
begin;
create table if not exists private.administrator_invitations (
 email text primary key check(email=lower(trim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 enabled boolean not null default true,
 can_review boolean not null default true,
 created_at timestamptz not null default now()
);
alter table private.administrator_invitations enable row level security;
revoke all on private.administrator_invitations from public,anon,authenticated;
drop policy if exists deny_client_access on private.administrator_invitations;
create policy deny_client_access on private.administrator_invitations for all to anon,authenticated using(false) with check(false);

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
  and (exists(select 1 from private.administrator_access a where a.user_id=u.id and a.enabled)
   or exists(select 1 from private.administrator_invitations i where i.email=lower(u.email) and i.enabled))
 );
$$;
create or replace function private.is_registration_reviewer() returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_admin() and (
  exists(select 1 from private.administrator_access a where a.user_id=auth.uid() and a.enabled and a.is_owner)
  or exists(select 1 from private.administrator_invitations i join auth.users u on lower(u.email)=i.email where u.id=auth.uid() and i.enabled and i.can_review)
 );
$$;

create or replace function private.review_notification_recipients() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('email',email,'create_user',create_user) order by email),'[]'::jsonb)
 from (
  select lower(u.email) as email,false as create_user from private.administrator_access a join auth.users u on u.id=a.user_id
  where a.enabled and a.is_owner and u.email_confirmed_at is not null
  union all
  select i.email,true from private.administrator_invitations i where i.enabled and i.can_review
   and not exists(select 1 from private.administrator_access a join auth.users u on u.id=a.user_id where a.enabled and a.is_owner and lower(u.email)=i.email)
 ) recipients;
$$;
create or replace function private.administrator_login_allowed(requested_email text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'allowed',exists(select 1 from private.administrator_invitations where email=lower(trim(requested_email)) and enabled)
   or exists(select 1 from private.administrator_access a join auth.users u on u.id=a.user_id where a.enabled and lower(u.email)=lower(trim(requested_email))),
  'create_user',exists(select 1 from private.administrator_invitations where email=lower(trim(requested_email)) and enabled)
 );
$$;
create or replace function public.administrator_login_allowed(requested_email text) returns jsonb
language sql stable security invoker set search_path='' as $$select private.administrator_login_allowed(requested_email);$$;

-- Preserve current validation, rate limits and address fields in the deployed definitions.
do $$declare signature text; definition text;begin
 foreach signature in array array['private.registration_for_review(uuid)','private.decide_registration(uuid,boolean,text)','private.directory_for_review(uuid)','private.decide_directory(uuid,boolean,text)'] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if position('if not private.is_owner()' in definition)>0 then
   execute replace(definition,'if not private.is_owner()','if not private.is_registration_reviewer()');
  elsif position('if not private.is_registration_reviewer()' in definition)=0 then raise exception 'Review authorization missing: %',signature;end if;
 end loop;
 foreach signature in array array['private.submit_public_registration(jsonb,jsonb,text)','private.submit_public_directory(text,jsonb,text)'] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if position('review_recipients' in definition)=0 then
   if position('''owner_email'',recipient)' in definition)=0 then raise exception 'Notification return missing: %',signature;end if;
   execute replace(definition,'''owner_email'',recipient)','''owner_email'',recipient,''review_recipients'',private.review_notification_recipients())');
  end if;
 end loop;
end;$$;
revoke all on function private.is_registration_reviewer(),private.review_notification_recipients(),private.administrator_login_allowed(text),public.administrator_login_allowed(text) from public,anon,authenticated;
grant execute on function private.is_registration_reviewer() to authenticated;
grant execute on function private.review_notification_recipients(),private.administrator_login_allowed(text),public.administrator_login_allowed(text) to service_role;
commit;
