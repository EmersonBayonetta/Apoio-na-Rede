import { getSupabase } from '../lib/supabase';
import { requireUser, requireAdministrator } from './contributionService';
import type { AccessibleRoute, Professional } from '../types';

export const ROUTE_COLUMNS = 'id,titulo,cidade,ponto_origem,ponto_destino,trecho_descricao,tem_rampa,tem_piso_tatil,tem_semaforo_sonoro,nivel_seguranca,coordenadas,distancia_metros,duracao_segundos,auditada,status,motivo_rejeicao,verificado_em,fonte_url,consultado_em';
export const PROFESSIONAL_COLUMNS = 'id,nome,especialidade,registro_profissional,endereco,cidade,estado,telefone,email,whatsapp,atende_por_tipo,descricao,foto_url,status,motivo_rejeicao,verificado_em,fonte_url,consultado_em';
export type DirectoryKind = 'routes' | 'professionals';

function failure(error: { code?: string; message: string }) {
  if (error.code === '23505') return new Error('Este cadastro local já foi enviado para revisão.');
  return new Error(error.code === 'P0001' ? error.message : 'Não foi possível salvar no catálogo. Tente novamente.');
}

export const DirectoryService = {
  async routes(): Promise<AccessibleRoute[]> {
    const client = getSupabase();
    if (!client) throw new Error('Banco não configurado.');
    const { data,error } = await client.from('routes').select(ROUTE_COLUMNS).order('criado_em',{ascending:false});
    if (error) throw new Error('Não foi possível carregar as rotas. Tente novamente.');
    return data as unknown as AccessibleRoute[];
  },
  async professionals(): Promise<Professional[]> {
    const client = getSupabase();
    if (!client) throw new Error('Banco não configurado.');
    const { data,error } = await client.from('professionals').select(PROFESSIONAL_COLUMNS).order('criado_em',{ascending:false});
    if (error) throw new Error('Não foi possível carregar os profissionais. Tente novamente.');
    return data as unknown as Professional[];
  },
  async saveRoute(route: Omit<AccessibleRoute,'id'>, sourceKey?: string): Promise<AccessibleRoute> {
    const client = getSupabase();
    if (!client) throw new Error('Banco não configurado.');
    await requireUser();
    const { data,error } = await client.from('routes').insert({
      titulo:route.titulo,cidade:route.cidade,ponto_origem:route.ponto_origem,ponto_destino:route.ponto_destino,
      trecho_descricao:route.trecho_descricao,tem_rampa:route.tem_rampa,tem_piso_tatil:route.tem_piso_tatil,
      tem_semaforo_sonoro:route.tem_semaforo_sonoro,coordenadas:route.coordenadas,distancia_metros:route.distancia_metros,
      duracao_segundos:route.duracao_segundos,source_key:sourceKey,
    }).select(ROUTE_COLUMNS).single();
    if (error) throw failure(error);
    return data as unknown as AccessibleRoute;
  },
  async saveProfessional(person: Omit<Professional,'id'>, sourceKey?: string): Promise<Professional> {
    const client = getSupabase();
    if (!client) throw new Error('Banco não configurado.');
    await requireUser();
    const { data,error } = await client.from('professionals').insert({
      nome:person.nome,especialidade:person.especialidade,registro_profissional:person.registro_profissional,
      endereco:person.endereco,cidade:person.cidade,estado:person.estado,telefone:person.telefone,whatsapp:person.whatsapp,
      atende_por_tipo:person.atende_por_tipo,descricao:person.descricao,source_key:sourceKey,
    }).select(PROFESSIONAL_COLUMNS).single();
    if (error) throw failure(error);
    return data as unknown as Professional;
  },
  async pending() {
    await requireAdministrator();
    const client = getSupabase()!;
    const [routes,professionals] = await Promise.all([
      client.from('routes').select(ROUTE_COLUMNS).eq('status','pendente').order('criado_em'),
      client.from('professionals').select(PROFESSIONAL_COLUMNS).eq('status','pendente').order('criado_em'),
    ]);
    if (routes.error || professionals.error) throw new Error('Não foi possível carregar os catálogos pendentes.');
    return { routes:routes.data as unknown as AccessibleRoute[],professionals:professionals.data as unknown as Professional[] };
  },
  async moderate(kind: DirectoryKind, id: string, approve: boolean, reason: string, audited = false) {
    if (!approve && !reason.trim()) throw new Error('Informe o motivo da recusa.');
    await requireAdministrator();
    const client = getSupabase()!;
    const change = { status:approve ? 'verificado' as const : 'rejeitado' as const,motivo_rejeicao:approve ? null : reason.trim() };
    const { data,error } = kind === 'routes'
      ? await client.from('routes').update({ ...change,auditada:approve && audited }).eq('id',id).eq('status','pendente').select('id')
      : await client.from('professionals').update(change).eq('id',id).eq('status','pendente').select('id');
    if (error) throw new Error('Não foi possível moderar o cadastro.');
    if (!data.length) throw new Error('Este cadastro já foi revisado. Atualize a lista.');
  },
};
