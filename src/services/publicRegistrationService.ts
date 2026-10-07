import { getSupabase } from '../lib/supabase';
import { StorageService } from './storageService';
import type { AccessibilityCriteria, Establishment } from '../types';

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
