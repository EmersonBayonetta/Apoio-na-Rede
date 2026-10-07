-- Apply after administrator_bootstrap.sql. Only database administrators can change membership.
begin;
create table if not exists private.administrator_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
alter table private.administrator_access enable row level security;
revoke all on private.administrator_access from public,anon,authenticated;
create policy deny_client_access on private.administrator_access for all to anon,authenticated using(false) with check(false);
-- Preserve only explicitly authorized, already confirmed and claimed identities.
insert into private.administrator_access(user_id)
select u.id from auth.users u join private.administrator_bootstrap b on b.claimed_user=u.id
where u.email_confirmed_at is not null and u.raw_app_meta_data->>'role'='admin'
on conflict(user_id) do nothing;
drop trigger if exists bootstrap_administrator on auth.users;
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from private.administrator_access a join auth.users u on u.id=a.user_id
  where a.user_id=auth.uid() and a.enabled and u.email_confirmed_at is not null
 );
$$;
revoke all on function private.is_admin() from public,anon;
grant execute on function private.is_admin() to authenticated;
-- Existing public-read policies also invoke this function for anonymous visitors.
grant execute on function private.is_admin() to anon;
create or replace function public.is_site_admin() returns boolean
language sql stable security invoker set search_path='' as $$ select private.is_admin(); $$;
revoke all on function public.is_site_admin() from public,anon;
grant execute on function public.is_site_admin() to authenticated;

alter policy "Leitura pública de estabelecimentos aprovados" on public.establishments using(status='verificado' or dono_id=(select auth.uid()) or (select private.is_admin()));
alter policy "Admin modera estabelecimentos" on public.establishments using((select private.is_admin())) with check((select private.is_admin()));
alter policy "Leitura pública de avaliações" on public.reviews using(not denunciada or user_id=(select auth.uid()) or (select private.is_admin()));
alter policy "Admin modera avaliações" on public.reviews using((select private.is_admin())) with check((select private.is_admin()));
alter policy reports_read on public.place_reports using(user_id=(select auth.uid()) or (select private.is_admin()));
alter policy reports_moderate on public.place_reports using((select private.is_admin())) with check((select private.is_admin()));
alter policy review_flags_read on public.review_flags using(user_id=(select auth.uid()) or (select private.is_admin()));
alter policy report_photo_read on storage.objects using(bucket_id='report-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin()) or private.public_report_photo(name)));
alter policy directory_read on public.routes using(status='verificado' or author_id=(select auth.uid()) or (select private.is_admin()));
alter policy directory_moderate on public.routes using((select private.is_admin())) with check((select private.is_admin()));
alter policy directory_read on public.professionals using(status='verificado' or author_id=(select auth.uid()) or (select private.is_admin()));
alter policy directory_moderate on public.professionals using((select private.is_admin())) with check((select private.is_admin()));
commit;
