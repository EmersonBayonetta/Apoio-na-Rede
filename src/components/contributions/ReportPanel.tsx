import { useEffect, useState } from 'react';
import type { Establishment } from '../../types';
import { ACCESSIBILITY_RESOURCES } from '../../data/accessibilityResources';
import { ContributionService, emptyAnswers, type PlaceReport } from '../../services/contributionService';
import { SignInGate } from './SignInGate';
import { getSupabase } from '../../lib/supabase';

function ReportForm({ place, onRefresh }: { place: Establishment; onRefresh: () => void }) {
  const [own, setOwn] = useState<PlaceReport | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(emptyAnswers);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { id, place_id } = place;
  useEffect(() => {
    let active = true;
    void ContributionService.own({ id, place_id }).then(r => { if (active) { setOwn(r); setReady(true); } }).catch(() => { if (active) setMessage('Não foi possível consultar seu relato. Recarregue para tentar novamente.'); });
    return () => { active = false; };
  }, [id, place_id]);
  if (own) return <div role="status"><p className="font-semibold">Você já relatou este local em {new Date(own.criado_em).toLocaleDateString('pt-BR')}.</p><p>Status: {own.status === 'pendente' ? 'Em verificação' : own.status === 'aprovado' ? 'Aprovado' : 'Recusado'}</p>{own.motivo_recusa && <p>Motivo: {own.motivo_recusa}</p>}<ul className="mt-3">{ACCESSIBILITY_RESOURCES.map(r => <li key={r.id}>{r.label}: {own.respostas[r.id] === 'sim' ? 'Sim' : own.respostas[r.id] === 'nao' ? 'Não' : 'Não sei'}</li>)}</ul>{own.comentario && <p className="mt-3">{own.comentario}</p>}</div>;
  return <>
    <p role="status" aria-live="polite">{message}</p>
    {!open ? <button disabled={!ready} type="button" className="min-h-11 rounded-xl bg-blue-700 px-4 text-white" onClick={() => setOpen(true)}>Estive aqui, quero contribuir</button> : <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true); setMessage('');
      try { await ContributionService.send(place, answers, comment, files); setOwn(await ContributionService.own(place)); onRefresh(); }
      catch (error) { setMessage((error as Error).message); const saved = await ContributionService.own(place).catch(() => null); if (saved) setOwn(saved); }
      finally { setBusy(false); }
    }}>
      <p>Informe apenas o que você observou. Seu relato será revisado antes de aparecer para outras pessoas.</p>
      {ACCESSIBILITY_RESOURCES.map(r => <label key={r.id} className="flex flex-wrap justify-between items-center gap-3 rounded-lg border p-3">{r.label}<select className="min-h-11 rounded-lg border bg-white px-3" value={answers[r.id]} onChange={e => setAnswers({ ...answers, [r.id]: e.target.value as 'sim' | 'nao' | 'nao_sei' })}><option value="nao_sei">Não sei</option><option value="sim">Sim</option><option value="nao">Não</option></select></label>)}
      <label className="block">Comentário opcional<textarea className="block w-full rounded-lg border p-3" maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} /></label>
      <label className="block">Fotos opcionais (até 3 imagens JPG, PNG ou WebP, 5 MB cada)<input className="block w-full min-h-11 mt-2" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))} /></label>
      <p>Evite enviar fotos com pessoas identificáveis ou documentos.</p>
      <button disabled={busy} className="min-h-11 rounded-xl bg-blue-700 px-4 text-white">{busy ? 'Enviando…' : 'Enviar relato'}</button>
      <button disabled={busy} type="button" className="min-h-11 ml-4 underline" onClick={() => setOpen(false)}>Cancelar</button>
    </form>}
  </>;
}

export function ReportPanel({ place, onRefresh }: { place: Establishment; onRefresh: () => void }) {
  const available = !getSupabase() || place.external || place.status === 'verificado';
  return <section aria-labelledby="contribution-title" className="rounded-2xl border bg-white p-5 my-6"><h2 id="contribution-title" className="text-xl font-bold mb-4">Contribuir com este local</h2>{available ? <SignInGate><ReportForm key={place.id} place={place} onRefresh={onRefresh} /></SignInGate> : <p>Os relatos estarão disponíveis após a aprovação deste cadastro.</p>}<a className="inline-flex min-h-11 items-center underline mt-4" href="/?aba=cadastro">Sou responsável por este local</a></section>;
}
