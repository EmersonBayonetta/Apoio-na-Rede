import { getSupabase } from '../lib/supabase';
import type { AccessibilityCriteria, Establishment, AccessibleRoute, Professional } from '../types';

async function authenticatedHeaders() {
  const client = getSupabase();
  if (!client) throw Error('O cadastro exige uma conta. Configure o acesso ao Supabase para continuar.');
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw Error('Entre ou crie uma conta para cadastrar.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` };
}

export async function submitPublicDirectory(kind:'routes'|'professionals',details:Omit<AccessibleRoute,'id'>|Omit<Professional,'id'>) {
  const response=await fetch('/api/register-place',{method:'POST',headers:await authenticatedHeaders(),body:JSON.stringify({kind,details})});
  if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Envie pelo site publicado. O Vite local não executa as funções de cadastro.');
  const result=await response.json();if(!response.ok)throw Error(result.error||'Não foi possível enviar o cadastro.');
  return {id:result.id as string,message:result.message as string,saved:undefined};
}

export async function submitPublicRegistration(details: Omit<Establishment,'id'|'nota_media'|'total_avaliacoes'|'status'|'criado_em'>,criteria: Omit<AccessibilityCriteria,'id'|'establishment_id'>[]) {
  const response=await fetch('/api/register-place',{method:'POST',headers:await authenticatedHeaders(),body:JSON.stringify({details,criteria})});
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Envie o cadastro pelo site publicado. O servidor local do Vite não executa as funções de cadastro.');
  const result=await response.json();
  if (!response.ok) throw new Error(result.error||'Não foi possível enviar o cadastro.');
  return result as {id:string;message:string;notified:boolean};
}
