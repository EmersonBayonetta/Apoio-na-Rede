import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { DirectoryService, type DirectoryKind } from '../../services/directoryService';
import type { AccessibleRoute, Professional } from '../../types';

export function DirectoryModerationQueue() {
  const [queue,setQueue] = useState<{routes:AccessibleRoute[];professionals:Professional[]}>({routes:[],professionals:[]});
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [reasons,setReasons] = useState<Record<string,string>>({});
  const [audited,setAudited] = useState<Record<string,boolean>>({});
  const load = async () => { try { setQueue(await DirectoryService.pending()); } catch(error) { setMessage((error as Error).message); } };
  useEffect(()=>{if (getSupabase()) void load();},[]);
  if (!getSupabase()) return null;
  const actions = (kind:DirectoryKind,id:string) => <div className="space-y-3 mt-3"><label className="block">Motivo da recusa<input className="block border rounded-lg p-3 w-full" value={reasons[id] || ''} onChange={e=>setReasons({...reasons,[id]:e.target.value})}/></label>{[true,false].map(approve=><button type="button" key={String(approve)} disabled={busy} className="min-h-11 border rounded-lg px-4 mr-3" onClick={async()=>{setBusy(true);setMessage('');try{await DirectoryService.moderate(kind,id,approve,reasons[id] || '',audited[id] || false);await load();setMessage(approve ? 'Publicado no catálogo.' : 'Cadastro recusado.');}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}}>{approve ? 'Aprovar publicação' : 'Recusar'}</button>)}</div>;
  return <section className="mt-8"><h2 className="text-xl font-bold">Rotas pendentes ({queue.routes.length})</h2><p role="status">{message}</p><button type="button" disabled={busy} className="min-h-11 underline" onClick={()=>void load()}>Atualizar catálogo pendente</button>{queue.routes.map(r=><article key={r.id} className="border rounded-xl p-4 my-4"><h3 className="font-bold">{r.titulo} — {r.cidade}</h3><p>{r.ponto_origem} → {r.ponto_destino}</p><p>{r.trecho_descricao}</p><p>Rampa: {r.tem_rampa ? 'Sim' : 'Não'}; piso tátil: {r.tem_piso_tatil ? 'Sim' : 'Não'}; semáforo sonoro: {r.tem_semaforo_sonoro ? 'Sim' : 'Não'}.</p><label className="block mt-3"><input type="checkbox" checked={audited[r.id] || false} onChange={e=>setAudited({...audited,[r.id]:e.target.checked})}/> Confirmo que o trecho foi auditado presencialmente. A aprovação do relato, sozinha, não certifica a acessibilidade.</label>{actions('routes',r.id)}</article>)}<h2 className="text-xl font-bold mt-6">Profissionais pendentes ({queue.professionals.length})</h2>{queue.professionals.map(p=><article key={p.id} className="border rounded-xl p-4 my-4"><h3 className="font-bold">{p.nome} — {p.especialidade}</h3><p>{p.endereco}, {p.cidade}/{p.estado}</p><p>Registro: {p.registro_profissional || 'Não informado'}</p><p>{p.descricao}</p><p>Telefone: {p.telefone}; WhatsApp: {p.whatsapp}; email: {p.email}</p><p>Atende: {p.atende_por_tipo.join(', ')}</p>{actions('professionals',p.id)}</article>)}</section>;
}
