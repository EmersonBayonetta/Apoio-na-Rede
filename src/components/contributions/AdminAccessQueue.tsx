import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
type Request={id:string;email:string;requested_at:string;notified:boolean};
export function AdminAccessQueue() {
  const [requests,setRequests]=useState<Request[]>([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const load=async()=>{const {data,error}=await getSupabase()!.rpc('list_admin_access_requests');if(error)throw Error('Não foi possível carregar as solicitações.');setRequests(data as unknown as Request[]);};
  useEffect(()=>{void load().catch(error=>setMessage(error.message));},[]);
  return <section><h2 className="text-xl font-bold">Solicitações de acesso ({requests.length})</h2><p role="status" className="my-3">{message}</p><button type="button" disabled={busy} className="min-h-11 underline" onClick={()=>void load().catch(error=>setMessage(error.message))}>Atualizar solicitações</button>{requests.map(r=><article key={r.id} className="border rounded-xl p-4 my-4"><h3 className="font-bold break-words">{r.email}</h3><p>Solicitado em {new Date(r.requested_at).toLocaleString('pt-BR')}</p>{!r.notified && <p>Aviso por e-mail pendente.</p>}<div className="flex gap-3 mt-3">{[true,false].map(approve=><button type="button" key={String(approve)} disabled={busy} className="min-h-11 border rounded-lg px-4" onClick={async()=>{setBusy(true);setMessage('');try{const {error}=await getSupabase()!.rpc('decide_admin_access_request',{request_id:r.id,approve});if(error)throw Error('Não foi possível concluir a decisão. Atualize a lista.');await load();setMessage(approve ? 'Acesso administrativo autorizado.' : 'Solicitação recusada.');}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}}>{approve ? 'Autorizar acesso' : 'Recusar acesso'}</button>)}</div></article>)}</section>;
}
