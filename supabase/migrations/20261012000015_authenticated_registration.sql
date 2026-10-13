-- Apply after registration_shared_limits.sql and administrator_access.sql.
-- A public location can only be submitted by the authenticated account that owns it.
create or replace function private.submit_authenticated_registration(details jsonb, criteria jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare local_id uuid; recipient text; actor uuid:=auth.uid(); source_hash text;
begin
 if actor is null then raise exception 'Entre para cadastrar um local'; end if;
 if jsonb_typeof(details)<>'object' or jsonb_typeof(criteria)<>'array' or jsonb_array_length(criteria)>50 then raise exception 'Cadastro inválido'; end if;
 select u.email into recipient from private.administrator_access a join auth.users u on u.id=a.user_id where a.enabled and a.is_owner and u.email_confirmed_at is not null;
 if recipient is null then raise exception 'Responsável pela revisão indisponível'; end if;
 -- The owner quota is also enforced by guard_establishment; this makes the API contract explicit.
 if (select count(*) from public.establishments where dono_id=actor and criado_em>now()-interval '24 hours')>=3 then raise exception 'Limite de 3 cadastros em 24 horas atingido'; end if;
 source_hash:=lpad(md5(actor::text),64,'0');
 insert into public.establishments(nome,place_id,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,dono_id,telefone,whatsapp,horario_funcionamento)
 values(details->>'nome',nullif(details->>'place_id',''),(details->>'categoria')::public.establishment_category,details->>'endereco',details->>'bairro',details->>'cidade',details->>'estado',details->>'cep',(details->>'latitude')::double precision,(details->>'longitude')::double precision,details->>'descricao',array(select jsonb_array_elements_text(coalesce(details->'fotos','[]'))),actor,details->>'telefone',details->>'whatsapp',details->>'horario_funcionamento') returning id into local_id;
 insert into public.accessibility_criteria(establishment_id,tipo_deficiencia,criterio,presente,recurso,observacao_livre)
 select local_id,(r->>'tipo_deficiencia')::public.disability_type,r->>'criterio',(r->>'presente')::boolean,r->>'recurso',r->>'observacao_livre' from jsonb_array_elements(criteria) r;
 insert into private.registration_submissions(establishment_id,source_hash) values(local_id,source_hash);
 return jsonb_build_object('id',local_id,'owner_email',recipient);
end;
$$;

revoke all on function private.submit_authenticated_registration(jsonb,jsonb) from public,anon;
grant execute on function private.submit_authenticated_registration(jsonb,jsonb) to authenticated;
