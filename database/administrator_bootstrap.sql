begin;
create table if not exists private.administrator_bootstrap (
 email text primary key,
 claimed_user uuid,
 claimed_at timestamptz
);
alter table private.administrator_bootstrap enable row level security;
revoke all on private.administrator_bootstrap from public,anon,authenticated;
drop policy if exists deny_client_access on private.administrator_bootstrap;
create policy deny_client_access on private.administrator_bootstrap for all to anon,authenticated using(false) with check(false);
-- Targets are configured separately by an administrator, never committed with personal emails.
create or replace function private.bootstrap_administrator() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target private.administrator_bootstrap;
begin
 if new.email_confirmed_at is null or new.email is null then return new; end if;
 -- GoTrue may write app_metadata again after confirmation using an older in-memory value.
 -- Keep the grant bound to the originally confirmed user; deleted/recreated accounts cannot claim it.
 select * into target from private.administrator_bootstrap where email=lower(new.email) and (claimed_user is null or claimed_user=new.id) for update;
 if not found then return new; end if;
 new.raw_app_meta_data:=coalesce(new.raw_app_meta_data,'{}'::jsonb)||'{"role":"admin"}'::jsonb;
 update private.administrator_bootstrap set claimed_user=new.id,claimed_at=now() where email=target.email and claimed_user is null;
 return new;
end;
$$;
revoke all on function private.bootstrap_administrator() from public,anon,authenticated;
drop trigger if exists bootstrap_administrator on auth.users;
create trigger bootstrap_administrator before insert or update of email,email_confirmed_at,raw_app_meta_data on auth.users for each row execute function private.bootstrap_administrator();
-- Safely handle a previously confirmed account, if it already exists.
update auth.users u set email_confirmed_at=u.email_confirmed_at where u.email_confirmed_at is not null and exists(select 1 from private.administrator_bootstrap t where t.email=lower(u.email) and (t.claimed_user is null or t.claimed_user=u.id));
commit;
