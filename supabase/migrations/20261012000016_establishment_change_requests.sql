-- Apply after authenticated_registration.sql and administrator_access.sql.
-- Owners propose a complete replacement of editable fields; only an administrator
-- can apply it to the published establishment.
create table if not exists public.establishment_change_requests (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  expected_updated_at timestamptz,
  status public.establishment_status not null default 'pendente',
  motivo_rejeicao text,
  criado_em timestamptz not null default now(),
  decidido_em timestamptz,
  decidido_por uuid references auth.users(id)
);

create unique index if not exists establishment_change_requests_one_pending
  on public.establishment_change_requests(establishment_id) where status = 'pendente';
create index if not exists establishment_change_requests_owner_created
  on public.establishment_change_requests(owner_id, criado_em desc);

alter table public.establishment_change_requests enable row level security;
drop policy if exists "owners and admins can read establishment changes" on public.establishment_change_requests;
create policy "owners and admins can read establishment changes" on public.establishment_change_requests for select
  using (owner_id = auth.uid() or private.is_admin());
revoke all on table public.establishment_change_requests from anon, authenticated;
grant select on table public.establishment_change_requests to authenticated;

-- The original owner-update policy allowed a caller to bypass the review queue
-- for pending or rejected records. Owners now submit requests exclusively through
-- the controlled function below; administrators retain their existing policy.
drop policy if exists "Comerciante edita o próprio local pendente" on public.establishments;
drop policy if exists criteria_owner_insert on public.accessibility_criteria;

create or replace function public.request_establishment_change(
  requested_establishment_id uuid,
  requested_details jsonb,
  requested_updated_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  current_place public.establishments%rowtype;
  canonical jsonb;
  category public.establishment_category;
  latitude_value double precision;
  longitude_value double precision;
begin
  if actor is null then raise exception 'Entre para solicitar uma alteração'; end if;
  if jsonb_typeof(requested_details) <> 'object' then raise exception 'Dados da alteração inválidos'; end if;
  select * into current_place from public.establishments where id = requested_establishment_id and dono_id = actor;
  if not found then raise exception 'Você só pode alterar locais cadastrados pela sua conta'; end if;
  if current_place.atualizado_em is distinct from requested_updated_at then raise exception 'Este local foi atualizado. Reabra-o antes de enviar a alteração'; end if;

  if coalesce(length(trim(requested_details->>'nome')), 0) < 3
     or coalesce(length(trim(requested_details->>'endereco')), 0) < 3
     or coalesce(length(trim(requested_details->>'cidade')), 0) < 2
     or coalesce(length(trim(requested_details->>'descricao')), 0) < 10
     or coalesce(trim(requested_details->>'estado'), '') !~ '^[A-Z]{2}$'
     or jsonb_typeof(coalesce(requested_details->'fotos', 'null'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(requested_details->'fotos', '[]'::jsonb)) > 10
  then raise exception 'Dados da alteração inválidos'; end if;
  begin
    category := (requested_details->>'categoria')::public.establishment_category;
    latitude_value := (requested_details->>'latitude')::double precision;
    longitude_value := (requested_details->>'longitude')::double precision;
  exception when others then raise exception 'Dados da alteração inválidos'; end;
  if latitude_value not between -90 and 90 or longitude_value not between -180 and 180 then raise exception 'Coordenadas inválidas'; end if;
  if exists (select 1 from jsonb_array_elements(requested_details->'fotos') photo where jsonb_typeof(photo) <> 'string' or length(photo #>> '{}') > 2000) then
    raise exception 'Fotos inválidas';
  end if;

  canonical := jsonb_build_object(
    'nome', trim(requested_details->>'nome'), 'categoria', category::text,
    'descricao', trim(requested_details->>'descricao'), 'endereco', trim(requested_details->>'endereco'),
    'bairro', trim(coalesce(requested_details->>'bairro', '')), 'cidade', trim(requested_details->>'cidade'),
    'estado', upper(trim(requested_details->>'estado')), 'cep', trim(coalesce(requested_details->>'cep', '')),
    'latitude', latitude_value, 'longitude', longitude_value,
    'telefone', trim(coalesce(requested_details->>'telefone', '')),
    'whatsapp', trim(coalesce(requested_details->>'whatsapp', '')),
    'horario_funcionamento', trim(coalesce(requested_details->>'horario_funcionamento', '')),
    'fotos', requested_details->'fotos'
  );
  insert into public.establishment_change_requests(establishment_id, owner_id, details, expected_updated_at)
  values(requested_establishment_id, actor, canonical, requested_updated_at)
  returning jsonb_build_object('id', id, 'status', status, 'criado_em', criado_em) into canonical;
  return canonical;
exception when unique_violation then
  raise exception 'Já existe uma alteração aguardando análise para este local';
end;
$$;

create or replace function public.my_establishments_with_changes() returns jsonb
language sql security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'nome', e.nome, 'categoria', e.categoria, 'descricao', e.descricao,
    'endereco', e.endereco, 'bairro', e.bairro, 'cidade', e.cidade, 'estado', e.estado, 'cep', e.cep,
    'latitude', e.latitude, 'longitude', e.longitude, 'telefone', e.telefone, 'whatsapp', e.whatsapp,
    'horario_funcionamento', e.horario_funcionamento, 'fotos', e.fotos, 'status', e.status,
    'atualizado_em', e.atualizado_em,
    'change_request', cr.request
  ) order by e.nome), '[]'::jsonb)
  from public.establishments e
  left join lateral (
    select jsonb_build_object('id', r.id, 'status', r.status, 'motivo_rejeicao', r.motivo_rejeicao, 'criado_em', r.criado_em, 'decidido_em', r.decidido_em) as request
    from public.establishment_change_requests r where r.establishment_id = e.id and r.owner_id = auth.uid()
    order by r.criado_em desc limit 1
  ) cr on true
  where e.dono_id = auth.uid();
$$;

create or replace function public.admin_establishment_change_requests() returns jsonb
language sql security definer set search_path = '' as $$
  select case when private.is_admin() then coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'status', r.status, 'motivo_rejeicao', r.motivo_rejeicao, 'criado_em', r.criado_em,
    'establishment_id', r.establishment_id, 'owner_id', r.owner_id, 'details', r.details,
    'place', jsonb_build_object('nome', e.nome, 'endereco', e.endereco, 'cidade', e.cidade, 'estado', e.estado, 'atualizado_em', e.atualizado_em)
  ) order by r.criado_em asc), '[]'::jsonb) else '[]'::jsonb end
  from public.establishment_change_requests r join public.establishments e on e.id = r.establishment_id
  where r.status = 'pendente';
$$;

create or replace function public.decide_establishment_change(request_id uuid, approve boolean, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare request_row public.establishment_change_requests%rowtype; current_updated timestamptz;
begin
  if not private.is_admin() then raise exception 'Acesso restrito aos administradores'; end if;
  select * into request_row from public.establishment_change_requests where id = request_id for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  if request_row.status <> 'pendente' then raise exception 'Esta solicitação já foi analisada'; end if;
  if approve then
    select atualizado_em into current_updated from public.establishments where id = request_row.establishment_id for update;
    if current_updated is distinct from request_row.expected_updated_at then raise exception 'O local mudou após esta solicitação. Recuse-a e peça um novo envio'; end if;
    update public.establishments set
      nome = request_row.details->>'nome', categoria = (request_row.details->>'categoria')::public.establishment_category,
      descricao = request_row.details->>'descricao', endereco = request_row.details->>'endereco', bairro = request_row.details->>'bairro',
      cidade = request_row.details->>'cidade', estado = request_row.details->>'estado', cep = request_row.details->>'cep',
      latitude = (request_row.details->>'latitude')::double precision, longitude = (request_row.details->>'longitude')::double precision,
      telefone = request_row.details->>'telefone', whatsapp = request_row.details->>'whatsapp',
      horario_funcionamento = request_row.details->>'horario_funcionamento',
      fotos = array(select jsonb_array_elements_text(request_row.details->'fotos')), atualizado_em = now()
    where id = request_row.establishment_id;
  end if;
  update public.establishment_change_requests set status = case when approve then 'verificado'::public.establishment_status else 'rejeitado'::public.establishment_status end,
    motivo_rejeicao = case when approve then null else nullif(left(trim(coalesce(reason, '')), 1000), '') end,
    decidido_em = now(), decidido_por = auth.uid() where id = request_id;
end;
$$;

revoke all on function public.request_establishment_change(uuid, jsonb, timestamptz) from public, anon;
revoke all on function public.my_establishments_with_changes() from public, anon;
revoke all on function public.admin_establishment_change_requests() from public, anon;
revoke all on function public.decide_establishment_change(uuid, boolean, text) from public, anon;
grant execute on function public.request_establishment_change(uuid, jsonb, timestamptz), public.my_establishments_with_changes(), public.admin_establishment_change_requests(), public.decide_establishment_change(uuid, boolean, text) to authenticated;
