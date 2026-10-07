import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
type Request = {id:string;status:'pendente'|'aprovado'|'recusado';notified:boolean;message?:string};
export function AdminAccessRequest() {
  const [request,setRequest]=useState<Request|null>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;void getSupabase()!.rpc('my_admin_access_request').then(({data})=>{if(active && data)setRequest(data as unknown as Request);});return ()=>{active=false;};},[]);
  const send=async()=>{
    setBusy(true);setMessage('');
    try {
      const client=getSupabase()!;
      const {data:{session}}=await client.auth.getSession();
      if(!session)throw Error('Entre novamente para solicitar acesso.');
      const response=await fetch('/api/admin-access-request',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}});
      if(!response.headers.get('Content-Type')?.includes('application/json'))throw Error('Não foi possível enviar. Use o site publicado e tente novamente.');
      const result=await response.json();
      if(!response.ok)throw Error(result.error || 'Não foi possível solicitar acesso.');
      setRequest(result);setMessage(result.message || (result.status==='pendente' ? 'Solicitação enviada ao responsável. Aguarde a aprovação.' : result.status==='aprovado' ? 'Acesso aprovado. Atualize a página para entrar.' : 'Solicitação recusada.'));
    }catch(error){setMessage(error instanceof Error ? error.message : 'Não foi possível solicitar acesso.');}
    finally{setBusy(false);}
  };
  return <section className="rounded-xl border p-5"><h2 className="text-xl font-bold">Solicitar acesso administrativo</h2><p className="mt-3">O responsável pelo site precisa aprovar sua conta antes de você acessar a gestão.</p>
    {request && <p className="mt-3" role="status">{request.status==='pendente' ? 'Sua solicitação aguarda análise.' : request.status==='recusado' ? 'Sua solicitação foi recusada.' : 'Sua solicitação foi aprovada. Atualize a página para entrar.'}</p>}
    {(!request || (request.status==='pendente' && !request.notified)) && <button type="button" disabled={busy} className="min-h-11 mt-4 rounded-lg bg-blue-700 text-white px-4" onClick={()=>void send()}>{busy ? 'Enviando…' : request ? 'Reenviar aviso ao responsável' : 'Solicitar acesso'}</button>}
    <p role="status" aria-live="polite" className="mt-3">{message}</p>
  </section>;
}
