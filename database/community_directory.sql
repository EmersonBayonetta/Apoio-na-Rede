-- Execute after database/contribution_indexes.sql. No demonstration data is inserted.
begin;
alter table public.routes add column if not exists status public.establishment_status not null default 'pendente';
alter table public.routes add column if not exists author_id uuid default auth.uid() references auth.users(id) on delete set null;
alter table public.routes add column if not exists motivo_rejeicao text;
alter table public.routes add column if not exists verificado_em timestamptz;
alter table public.routes add column if not exists auditada boolean not null default false;
alter table public.routes add column if not exists duracao_segundos integer;
alter table public.routes add column if not exists source_key text check(length(source_key)<=250);
alter table public.professionals add column if not exists status public.establishment_status not null default 'pendente';
alter table public.professionals add column if not exists author_id uuid default auth.uid() references auth.users(id) on delete set null;
alter table public.professionals add column if not exists motivo_rejeicao text;
alter table public.professionals add column if not exists verificado_em timestamptz;
alter table public.professionals add column if not exists source_key text check(length(source_key)<=250);
create index if not exists routes_author_created_idx on public.routes(author_id,criado_em);
create index if not exists professionals_author_created_idx on public.professionals(author_id,criado_em);
create index if not exists routes_status_idx on public.routes(status);
create index if not exists professionals_status_idx on public.professionals(status);
create unique index if not exists routes_import_unique on public.routes(author_id,source_key) where source_key is not null;
create unique index if not exists professionals_import_unique on public.professionals(author_id,source_key) where source_key is not null;
alter table public.routes enable row level security;
alter table public.professionals enable row level security;
revoke all on public.routes,public.professionals from public,anon,authenticated;
grant select(id,titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,tem_rampa,tem_piso_tatil,tem_semaforo_sonoro,nivel_seguranca,coordenadas,distancia_metros,duracao_segundos,auditada,status,criado_em,verificado_em,motivo_rejeicao) on public.routes to anon,authenticated;
grant select(id,nome,especialidade,registro_profissional,establishment_id,endereco,cidade,estado,telefone,email,whatsapp,atende_por_tipo,descricao,foto_url,status,criado_em,verificado_em,motivo_rejeicao) on public.professionals to anon,authenticated;
grant insert(titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,tem_rampa,tem_piso_tatil,tem_semaforo_sonoro,coordenadas,distancia_metros,duracao_segundos,source_key) on public.routes to authenticated;
grant insert(nome,especialidade,registro_profissional,endereco,cidade,estado,telefone,whatsapp,atende_por_tipo,descricao,source_key) on public.professionals to authenticated;
grant update(status,motivo_rejeicao,auditada) on public.routes to authenticated;
grant update(status,motivo_rejeicao) on public.professionals to authenticated;
drop policy if exists "Leitura pública de rotas" on public.routes;
drop policy if exists "Leitura pública de profissionais" on public.professionals;
drop policy if exists directory_read on public.routes;
drop policy if exists directory_insert on public.routes;
drop policy if exists directory_moderate on public.routes;
create policy directory_read on public.routes for select to anon,authenticated using(status='verificado' or author_id=(select auth.uid()) or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
create policy directory_insert on public.routes for insert to authenticated with check(author_id=(select auth.uid()) and status='pendente' and not auditada);
create policy directory_moderate on public.routes for update to authenticated using((select (auth.jwt()->'app_metadata'->>'role')='admin')) with check((select (auth.jwt()->'app_metadata'->>'role')='admin'));
drop policy if exists directory_read on public.professionals;
drop policy if exists directory_insert on public.professionals;
drop policy if exists directory_moderate on public.professionals;
create policy directory_read on public.professionals for select to anon,authenticated using(status='verificado' or author_id=(select auth.uid()) or (select (auth.jwt()->'app_metadata'->>'role')='admin'));
create policy directory_insert on public.professionals for insert to authenticated with check(author_id=(select auth.uid()) and status='pendente');
create policy directory_moderate on public.professionals for update to authenticated using((select (auth.jwt()->'app_metadata'->>'role')='admin')) with check((select (auth.jwt()->'app_metadata'->>'role')='admin'));

create or replace function private.guard_directory() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recent integer;
begin
 if TG_OP='UPDATE' then
  if not private.is_admin() then raise exception 'Acesso não autorizado'; end if;
  if new.status='rejeitado' and nullif(trim(new.motivo_rejeicao),'') is null then raise exception 'Informe o motivo da recusa'; end if;
  if new.status='verificado' then new.verificado_em:=now(); new.motivo_rejeicao:=null; end if;
  if TG_TABLE_NAME='routes' and new.status<>'verificado' then new.auditada:=false; end if;
  return new;
 end if;
 if auth.uid() is null then raise exception 'Entre para contribuir'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || TG_TABLE_NAME,0));
 if TG_TABLE_NAME='routes' then
  select count(*) into recent from public.routes where author_id=auth.uid() and criado_em>now()-interval '24 hours';
  if nullif(trim(new.titulo),'') is null or nullif(trim(new.cidade),'') is null or nullif(trim(new.ponto_origem),'') is null or nullif(trim(new.ponto_destino),'') is null or nullif(trim(new.trecho_descricao),'') is null then raise exception 'Preencha os dados do trecho'; end if;
  if length(new.titulo)>500 or length(new.cidade)>200 or length(new.ponto_origem)>500 or length(new.ponto_destino)>500 or length(new.trecho_descricao)>5000 then raise exception 'Dados do trecho excedem o limite'; end if;
  if new.distancia_metros<0 or new.duracao_segundos<0 or jsonb_typeof(new.coordenadas)<>'array' or jsonb_array_length(new.coordenadas)>1000 then raise exception 'Geometria ou distância inválida'; end if;
  new.auditada:=false; new.nivel_seguranca:='Relato da comunidade — trecho não auditado';
 else
  select count(*) into recent from public.professionals where author_id=auth.uid() and criado_em>now()-interval '24 hours';
  if nullif(trim(new.nome),'') is null or nullif(trim(new.especialidade),'') is null or nullif(trim(new.cidade),'') is null then raise exception 'Preencha nome, especialidade e cidade'; end if;
  new.estado:=upper(new.estado);
  if new.estado not in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') then raise exception 'Informe uma UF válida'; end if;
  if length(new.nome)>200 or length(new.especialidade)>200 or length(new.cidade)>200 or length(new.descricao)>5000 or length(new.endereco)>500 or length(new.registro_profissional)>200 then raise exception 'Dados do profissional excedem o limite'; end if;
  if coalesce(new.telefone,'')<>'' and length(regexp_replace(new.telefone,'\D','','g')) not in (10,11) then raise exception 'Informe um telefone com DDD'; end if;
  if coalesce(new.whatsapp,'')<>'' and regexp_replace(new.whatsapp,'\D','','g') !~ '^(55)?[1-9][0-9]{9,10}$' then raise exception 'Informe um WhatsApp com DDD'; end if;
 end if;
 if recent>=10 then raise exception 'Limite de 10 cadastros por catálogo em 24 horas atingido'; end if;
 new.author_id:=auth.uid(); new.status:='pendente'; new.motivo_rejeicao:=null; new.verificado_em:=null; new.criado_em:=now();
 return new;
end;
$$;
revoke all on function private.guard_directory() from public,anon,authenticated;
drop trigger if exists guard_directory on public.routes;
create trigger guard_directory before insert or update on public.routes for each row execute function private.guard_directory();
drop trigger if exists guard_directory on public.professionals;
create trigger guard_directory before insert or update on public.professionals for each row execute function private.guard_directory();
commit;
