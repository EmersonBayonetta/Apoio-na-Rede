import { getSupabase } from '../lib/supabase';
import { StorageService } from './storageService';
import type { AccessibilityCriteria, Establishment, AccessibleRoute, Professional } from '../types';

export async function submitPublicDirectory(kind:'routes'|'professionals',details:Omit<AccessibleRoute,'id'>|Omit<Professional,'id'>) {
  if(!getSupabase()) {
    const saved=kind==='routes'?await StorageService.saveRoute(details as Omit<AccessibleRoute,'id'>):await StorageService.saveProfessional(details as Omit<Professional,'id'>);
    return {id:saved.id,message:'Cadastro salvo neste navegador. Nenhum e-mail foi enviado.',saved};
  }
  const response=await fetch('/api/register-place',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,details})});
  if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Envie pelo site publicado. O Vite local não executa as funções de cadastro.');
  const result=await response.json();if(!response.ok)throw Error(result.error||'Não foi possível enviar o cadastro.');
  return {id:result.id as string,message:result.message as string,saved:undefined};
}

export async function submitPublicRegistration(details: Omit<Establishment,'id'|'nota_media'|'total_avaliacoes'|'status'|'criado_em'>,criteria: Omit<AccessibilityCriteria,'id'|'establishment_id'>[]) {
  if (!getSupabase()) {
    const saved=await StorageService.createEstablishment(details,criteria);
    return {id:saved.id,message:'Cadastro salvo neste navegador em modo de demonstração. Nenhum e-mail foi enviado.'};
  }
  const response=await fetch('/api/register-place',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({details,criteria})});
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Envie o cadastro pelo site publicado. O servidor local do Vite não executa as funções de cadastro.');
  const result=await response.json();
  if (!response.ok) throw new Error(result.error||'Não foi possível enviar o cadastro.');
  return result as {id:string;message:string;notified:boolean};
}
