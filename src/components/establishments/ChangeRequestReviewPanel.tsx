import { useEffect, useState } from 'react';
import { ChangeRequestManagementService, type AdminChangeRequest } from '../../services/changeRequestManagementService';

export function ChangeRequestReviewPanel() {
  const [requests,setRequests] = useState<AdminChangeRequest[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState<string | null>(null);
  const [reason,setReason] = useState<Record<string,string>>({});
  const [message,setMessage] = useState('');
  const load = async () => { setLoading(true); try {setRequests(await ChangeRequestManagementService.list());} catch (error) {setMessage((error as Error).message);} finally {setLoading(false);} };
  useEffect(() => { void load(); }, []);
  const decide = async (request: AdminChangeRequest, approve: boolean) => {
    setBusy(request.id);setMessage('');
    try { const result = await ChangeRequestManagementService.decide(request.id,approve,reason[request.id] || '');setMessage(result.message);setRequests(current => current.filter(item => item.id !== request.id)); }
    catch (error) {setMessage((error as Error).message);}
    finally {setBusy(null);}
  };
  return <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5" aria-labelledby="change-requests-title">
    <div><h2 id="change-requests-title" className="text-lg font-bold">Alterações aguardando análise</h2><p className="mt-1 text-sm text-slate-600">Aprovar publica os dados solicitados. Recusar mantém o local exatamente como está.</p></div>
    {message && <p role="status" className="rounded-xl border bg-white p-3 text-sm">{message}</p>}
    {loading && <p role="status" className="text-sm">Carregando solicitações…</p>}
    {!loading && !requests.length && <p className="text-sm text-slate-600">Não há alterações aguardando análise.</p>}
    <ul className="space-y-4">{requests.map(request => <li key={request.id} className="rounded-xl border bg-white p-4">
      <h3 className="font-bold">{request.place.nome} <span className="font-normal text-slate-500">→ {request.details.nome}</span></h3>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><p className="font-semibold">Dados atuais</p><p>{request.place.endereco}</p><p>{request.place.cidade}/{request.place.estado}</p></div><div><p className="font-semibold">Dados solicitados</p><p>{request.details.endereco}</p><p>{request.details.cidade}/{request.details.estado}</p></div></div>
      <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Ver descrição solicitada</summary><p className="mt-2 whitespace-pre-wrap text-slate-700">{request.details.descricao}</p></details>
      <label className="mt-4 grid gap-2 text-sm font-semibold">Motivo da recusa (opcional)<textarea rows={2} maxLength={1000} value={reason[request.id] || ''} onChange={event => setReason(current => ({...current,[request.id]:event.target.value}))} className="rounded-xl border p-3 font-normal" /></label>
      <div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busy === request.id} onClick={() => void decide(request,true)} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50">Aprovar e publicar</button><button type="button" disabled={busy === request.id} onClick={() => void decide(request,false)} className="rounded-xl border border-rose-300 px-4 py-3 font-semibold text-rose-800 disabled:opacity-50">Recusar alteração</button></div>
    </li>)}</ul>
  </section>;
}
