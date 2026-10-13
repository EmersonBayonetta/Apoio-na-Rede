import { getSupabase } from '../lib/supabase';
import { browserStorage, readStoredArray } from '../lib/browserStorage';
import type { EstablishmentStatus } from '../types';

export type RegistrationKind = 'places' | 'professionals' | 'routes';
export interface RegistrationEntry {id:string;kind:RegistrationKind;nome:string;endereco:string;cidade:string;status:EstablishmentStatus;criado_em?:string}
export interface RegistrationDetails extends RegistrationEntry {
  descricao:string;estado?:string;telefone?:string;whatsapp?:string;email?:string;horario_funcionamento?:string;
  especialidade?:string;registro_profissional?:string;motivo_rejeicao?:string;fotos:string[];
  criteria:{criterio:string;presente:boolean|null;observacao_livre?:string}[];
}
const localKeys={places:'acessacidade_establishments',professionals:'acessacidade_professionals',routes:'acessacidade_routes'};
const localRecords=(kind:RegistrationKind)=>readStoredArray<RegistrationDetails & {titulo?:string;ponto_origem?:string;ponto_destino?:string;trecho_descricao?:string}>(localKeys[kind]).map(item=>({...item,kind,nome:item.nome ?? item.titulo ?? '',endereco:item.endereco ?? `${item.ponto_origem ?? ''} → ${item.ponto_destino ?? ''}`,descricao:item.descricao ?? item.trecho_descricao ?? '',status:item.status ?? 'pendente',fotos:item.fotos ?? [],criteria:item.criteria ?? []}));
export const AdminRegistrationService={
 async list(kind:RegistrationKind|'',status:EstablishmentStatus|'',search:string,page:number){
  const client=getSupabase();
  if(!client){const all=Object.keys(localKeys).flatMap(key=>localRecords(key as RegistrationKind));const filtered=all.filter(item=>(!kind || item.kind===kind)&&(!status || item.status===status)&&`${item.nome} ${item.endereco} ${item.cidade}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));return {entries:filtered.slice(page*20,page*20+20),total:filtered.length,pending:all.filter(item=>item.status==='pendente').length};}
  const {data,error}=await client.rpc('admin_registration_list',{requested_kind:kind,requested_status:status,search_text:search,page_number:page});
  if(error)throw Error('Não foi possível carregar os cadastros. Confira seu acesso e tente novamente.');
  return data as unknown as {entries:RegistrationEntry[];total:number;pending:number};
 },
 async get(entry:RegistrationEntry){
  const client=getSupabase();
  if(!client){const record=localRecords(entry.kind).find(item=>item.id===entry.id);if(!record)throw Error('Cadastro não encontrado.');return record;}
  const {data,error}=await client.rpc('admin_registration_detail',{requested_kind:entry.kind,record_id:entry.id});
  if(error || !data)throw Error('Não foi possível abrir o cadastro.');return data as unknown as RegistrationDetails;
 },
 async decide(entry:RegistrationEntry,approve:boolean,reason:string){
  if(!approve && !reason.trim())throw Error('Informe o motivo da recusa.');
  const client=getSupabase();
  if(client){const {error}=await client.rpc('admin_decide_registration',{requested_kind:entry.kind,record_id:entry.id,approve,reason});if(error)throw Error('Não foi possível concluir a revisão. Atualize a lista; o cadastro pode ter sido revisado por outra pessoa.');return;}
  const records=readStoredArray<RegistrationDetails>(localKeys[entry.kind]);const current=records.find(item=>item.id===entry.id);
  if(!current || (current.status ?? 'pendente')!=='pendente')throw Error('Cadastro indisponível ou já revisado.');
  browserStorage.setItem(localKeys[entry.kind],JSON.stringify(records.map(item=>item.id===entry.id?{...item,status:approve?'verificado':'rejeitado',motivo_rejeicao:approve?null:reason.trim()}:item)));
 },
};
