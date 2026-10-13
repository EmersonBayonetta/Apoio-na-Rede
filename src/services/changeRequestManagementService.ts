import { getSupabase } from '../lib/supabase';
import { ManagementError } from './placeManagementService';

export type AdminChangeRequest = {
  id: string; establishment_id: string; owner_id: string; status: 'pendente'; criado_em: string;
  details: { nome: string; endereco: string; cidade: string; estado: string; descricao: string };
  place: { nome: string; endereco: string; cidade: string; estado: string; atualizado_em: string | null };
};
async function request<T>(method: 'GET' | 'PATCH', body?: unknown): Promise<T> {
  const client = getSupabase();
  const {data,error} = await client!.auth.getSession();
  if (error || !data.session) throw new ManagementError('Entre com o e-mail do administrador.',401);
  const response = await fetch('/api/manage-change-requests',{method,headers:{Authorization:`Bearer ${data.session.access_token}`,...(body ? {'Content-Type':'application/json'} : {})},...(body ? {body:JSON.stringify(body)} : {})});
  if (!response.headers.get('content-type')?.includes('application/json')) throw Error('Use o site publicado para gerenciar as alterações online.');
  const result = await response.json();
  if (!response.ok) throw new ManagementError(result.error || 'Não foi possível concluir a operação.',response.status);
  return result as T;
}
export const ChangeRequestManagementService = {
  async list() { return (await request<{requests:AdminChangeRequest[]}>('GET')).requests; },
  async decide(id: string, approve: boolean, reason = '') { return request<{message:string}>('PATCH',{id,approve,reason}); },
};
