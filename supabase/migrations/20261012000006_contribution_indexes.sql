begin;
create index if not exists place_reports_establishment_idx on public.place_reports(establishment_id);
create index if not exists professionals_establishment_idx on public.professionals(establishment_id);
create index if not exists review_flags_user_idx on public.review_flags(user_id);
create index if not exists reviews_user_idx on public.reviews(user_id);
create or replace function private.guard_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare canonical text; p text;
begin
 if TG_OP='UPDATE' then
  if not private.is_admin() then raise exception 'Acesso não autorizado'; end if;
  if new.status='recusado' and nullif(trim(new.motivo_recusa),'') is null then raise exception 'Informe o motivo da recusa'; end if;
  return new;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.place_reports where user_id=auth.uid() and criado_em>now()-interval '24 hours')>=10 then raise exception 'Limite de 10 relatos em 24 horas atingido'; end if;
 new.user_id:=auth.uid(); new.status:='pendente'; new.motivo_recusa:=null; new.criado_em:=now();
 if new.establishment_id is not null then
  select place_id into canonical from public.establishments where id=new.establishment_id and status='verificado';
  if not found then raise exception 'Local não disponível para relatos'; end if;
  new.place_id:=canonical;
 end if;
 if jsonb_typeof(new.respostas)<>'object' or (select count(*) from jsonb_each(new.respostas))<>12 or exists(
  select 1 from jsonb_each_text(new.respostas) r where r.key not in ('libras','entrada_acessivel','rampa','elevador','corrimao','banheiro_pcd','vaga_pcd','piso_tatil','cadeira_rodas','area_descanso','iluminacao_ajustavel','horario_tranquilo') or r.value is null or r.value not in ('sim','nao','nao_sei')
 ) then raise exception 'Respostas inválidas'; end if;
 foreach p in array new.fotos loop
  if split_part(p,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='report-photos' and name=p) then raise exception 'Foto inválida'; end if;
 end loop;
 return new;
end;
$$;

revoke all on function private.guard_report() from public;
drop policy if exists report_photo_insert on storage.objects;
create policy report_photo_insert on storage.objects for insert to authenticated with check(bucket_id='report-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and (select count(*) from storage.objects s where s.bucket_id='report-photos' and s.owner_id=(select auth.uid())::text and s.created_at>now()-interval '24 hours')<30);

commit;
