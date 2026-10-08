create or replace function private.submit_public_registration(details jsonb,criteria jsonb,source_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare local_id uuid; recipient text;
begin
 if source_hash is null or source_hash !~ '^[0-9a-f]{64}$' then raise exception 'Solicitação inválida'; end if;
 if jsonb_typeof(details)<>'object' or jsonb_typeof(criteria)<>'array' or jsonb_array_length(criteria)>50 then raise exception 'Cadastro inválido'; end if;
 select u.email into recipient from private.administrator_access a join auth.users u on u.id=a.user_id where a.enabled and a.is_owner and u.email_confirmed_at is not null;
 if recipient is null then raise exception 'Responsável pela revisão indisponível'; end if;
 perform pg_advisory_xact_lock(hashtextextended('public-registration',0));
 if ((select count(*) from private.registration_submissions s where s.source_hash=submit_public_registration.source_hash and s.criado_em>now()-interval '24 hours')+(select count(*) from private.directory_submissions s where s.source_hash=submit_public_registration.source_hash and s.criado_em>now()-interval '24 hours'))>=3
 or ((select count(*) from private.registration_submissions where criado_em>now()-interval '24 hours')+(select count(*) from private.directory_submissions where criado_em>now()-interval '24 hours'))>=100 then raise exception 'Limite de cadastros atingido. Tente novamente mais tarde'; end if;
 insert into public.establishments(nome,place_id,categoria,endereco,bairro,cidade,estado,cep,latitude,longitude,descricao,fotos,telefone,whatsapp,horario_funcionamento)
 values(details->>'nome',nullif(details->>'place_id',''),(details->>'categoria')::public.establishment_category,details->>'endereco',details->>'bairro',details->>'cidade',details->>'estado',details->>'cep',(details->>'latitude')::double precision,(details->>'longitude')::double precision,details->>'descricao',array(select jsonb_array_elements_text(coalesce(details->'fotos','[]'))),details->>'telefone',details->>'whatsapp',details->>'horario_funcionamento') returning id into local_id;
 insert into public.accessibility_criteria(establishment_id,tipo_deficiencia,criterio,presente,recurso,observacao_livre)
 select local_id,(r->>'tipo_deficiencia')::public.disability_type,r->>'criterio',(r->>'presente')::boolean,r->>'recurso',r->>'observacao_livre' from jsonb_array_elements(criteria) r;
 insert into private.registration_submissions(establishment_id,source_hash) values(local_id,source_hash);
 return jsonb_build_object('id',local_id,'owner_email',recipient);
end;
$$;

revoke all on function private.submit_public_registration(jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function private.submit_public_registration(jsonb,jsonb,text) to service_role;
