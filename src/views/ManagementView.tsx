import { useEffect, useState } from 'react';
import { SignInGate } from '../components/contributions/SignInGate';
import { DirectoryModerationQueue } from '../components/contributions/DirectoryModerationQueue';
import { AdminAccessQueue } from '../components/contributions/AdminAccessQueue';
import { getSupabase } from '../lib/supabase';
import { ContributionService, type PlaceReport } from '../services/contributionService';
import { ACCESSIBILITY_RESOURCES } from '../data/accessibilityResources';
import type { Establishment } from '../types';

function Queue() {
  const [queue, setQueue] = useState<{ reports: PlaceReport[]; places: Establishment[] }>({ reports: [], places: [] });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reasons, setReasons] = useState<Record<string,string>>({});
  const [photos, setPhotos] = useState<Record<string,string>>({});
  const load = async () => { try { setQueue(await ContributionService.pending()); } catch(error) { setMessage((error as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const actions = (kind: 'report' | 'place', id: string) => <div className="space-y-3 mt-4"><label className="block">Motivo da recusa<input value={reasons[id] ?? ''} onChange={e => setReasons({ ...reasons, [id]: e.target.value })} className="block w-full border rounded-lg p-3" /></label>{[true,false].map(approve => <button type="button" key={String(approve)} disabled={busy} className="min-h-11 rounded-lg border px-4 mr-3" onClick={async () => {
    setBusy(true); setMessage('');
    try { await ContributionService.moderate(kind,id,approve,reasons[id] ?? ''); await load(); setMessage(approve ? 'Aprovado.' : 'Recusado.'); }
    catch(error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }}>{approve ? 'Aprovar' : 'Recusar'}</button>)}</div>;
  return <><p role="status" aria-live="polite">{message || (loading ? 'Carregando…' : '')}</p><h2 className="text-xl font-bold mt-6">Cadastros pendentes ({queue.places.length})</h2>{queue.places.map(e => <article key={e.id} className="border rounded-xl p-4 my-4"><h3 className="font-bold">{e.nome}</h3><p>{e.endereco}, {e.cidade}</p><p>{e.descricao}</p><a className="underline min-h-11 inline-flex items-center" href={`/?local=${e.id}`}>Revisar cadastro completo</a>{actions('place',e.id)}</article>)}<h2 className="text-xl font-bold mt-6">Relatos pendentes ({queue.reports.length})</h2>{queue.reports.map(r => <article key={r.id} className="border rounded-xl p-4 my-4"><h3 className="font-bold">Local: {r.place_id || r.establishment_id}</h3><p>{r.comentario}</p><ul>{ACCESSIBILITY_RESOURCES.map(a => <li key={a.id}>{a.label}: {r.respostas[a.id] === 'sim' ? 'Sim' : r.respostas[a.id] === 'nao' ? 'Não' : 'Não sei'}</li>)}</ul>{r.fotos.map(path => <div key={path}>{photos[path] ? <img src={photos[path]} alt="Foto enviada no relato" className="max-h-60" /> : <button type="button" className="min-h-11 underline" onClick={async () => { try { setPhotos({ ...photos, [path]: await ContributionService.photoUrl(path) }); } catch { setMessage('Não foi possível abrir a foto.'); } }}>Ver foto enviada</button>}</div>)}{actions('report',r.id)}</article>)}</>;
}

function ManagementPanels() {
  const [section,setSection] = useState<'places'|'directory'|'access'>('places');
  const [owner,setOwner] = useState(false);
  useEffect(()=>{let active=true;void getSupabase()!.rpc('is_site_owner').then(({data,error})=>{if(active && !error && data===true){setOwner(true);if(new URLSearchParams(window.location.search).has('solicitacao'))setSection('access');}});return ()=>{active=false;};},[]);
  const tabs=owner ? ['places','directory','access'] as const : ['places','directory'] as const;
  return <><nav aria-label="Revisão de contribuições" className="flex flex-wrap gap-3 mb-6">{tabs.map(tab=><button type="button" key={tab} aria-pressed={section===tab} className={`min-h-11 rounded-lg border px-4 ${section===tab ? 'bg-blue-900 text-white' : ''}`} onClick={()=>setSection(tab)}>{tab==='places' ? 'Locais e relatos' : tab==='directory' ? 'Rotas e profissionais' : 'Acessos da equipe'}</button>)}</nav>{section==='places' ? <Queue /> : section==='directory' ? <DirectoryModerationQueue /> : owner ? <AdminAccessQueue /> : null}</>;
}

export function ManagementView() {
  useEffect(() => { const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex, nofollow'; document.head.appendChild(meta); return () => meta.remove(); }, []);
  return <main id="main-content" className="max-w-4xl mx-auto p-6"><h1 className="text-3xl font-bold mb-6">Administração</h1><SignInGate admin><ManagementPanels /></SignInGate><a className="inline-flex min-h-11 items-center underline mt-6" href="/">Voltar ao site</a></main>;
}
