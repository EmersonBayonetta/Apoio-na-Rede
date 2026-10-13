import { useEffect, useState } from 'react';
import { Building2, Clock3, FilePenLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MyPlacesService, type OwnedPlace } from '../services/myPlacesService';
import { PlaceEditForm } from '../components/establishments/PlaceEditForm';

const publication = {pendente:'Cadastro em análise',verificado:'Publicado',rejeitado:'Cadastro recusado'};
const review = {pendente:'Alteração aguardando administradores',verificado:'Última alteração aprovada',rejeitado:'Última alteração recusada'};

export function MyPlacesView() {
  const { user, ready, openAuthentication } = useAuth();
  const [places,setPlaces] = useState<OwnedPlace[]>([]);
  const [selected,setSelected] = useState<OwnedPlace | null>(null);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState('');
  const load = async () => {
    setLoading(true); setMessage('');
    try { setPlaces(await MyPlacesService.list()); }
    catch (error) { setMessage((error as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (ready && user) void load(); else if (ready) setLoading(false); }, [ready, user]);
  if (!ready) return <section className="mx-auto max-w-4xl p-6"><p role="status">Carregando sua conta…</p></section>;
  if (!user) return <section className="mx-auto my-12 max-w-lg rounded-3xl border bg-white p-6 text-center shadow-sm"><h1 className="text-2xl font-bold">Entre para ver seus locais</h1><p className="mt-3 text-slate-600">Aqui você acompanha os cadastros vinculados à sua conta e solicita correções para análise.</p><button type="button" onClick={() => openAuthentication('login')} className="mt-6 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Fazer login ou criar conta</button></section>;
  if (selected) return <section className="mx-auto max-w-5xl p-4 sm:p-8"><PlaceEditForm place={selected} onCancel={() => {setSelected(null);setMessage('');}} onSessionExpired={() => {setSelected(null);setMessage('Sua sessão expirou. Entre novamente.');}} onSubmit={(place,details) => MyPlacesService.requestChange(place as OwnedPlace,details)} onSaved={() => {setSelected(null);setMessage('Alteração enviada para análise. O local atual continuará igual até a aprovação.');void load();}} submitLabel="Enviar para aprovação" intro="Confira as informações. Sua alteração será analisada por um administrador antes de aparecer no site." /></section>;
  return <section className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Conta do responsável</p><h1 className="mt-1 text-3xl font-bold">Meus locais</h1><p className="mt-2 max-w-2xl text-slate-600">Acompanhe seus cadastros e envie correções. Nenhuma mudança é publicada sem aprovação administrativa.</p></div>
    {message && <p role="status" className="rounded-xl border p-4 text-sm">{message}</p>}
    {loading && <p role="status">Carregando seus locais…</p>}
    {!loading && !places.length && <div className="rounded-2xl border bg-white p-6 text-center"><Building2 className="mx-auto text-slate-500" aria-hidden="true" /><h2 className="mt-3 text-lg font-bold">Nenhum local vinculado à sua conta</h2><p className="mt-2 text-sm text-slate-600">Quando você cadastrar um local, ele aparecerá aqui.</p></div>}
    <ul className="grid gap-4 md:grid-cols-2">{places.map(place => <li key={place.id} className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-lg font-bold">{place.nome}</h2><p className="mt-1 text-sm text-slate-600">{place.endereco} · {place.cidade}/{place.estado}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{publication[place.status]}</span></div>
      {place.change_request && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><div className="flex gap-2"><Clock3 size={18} aria-hidden="true" /><span>{review[place.change_request.status]}</span></div>{place.change_request.status === 'rejeitado' && place.change_request.motivo_rejeicao && <p className="mt-2">Motivo: {place.change_request.motivo_rejeicao}</p>}</div>}
      <button type="button" disabled={place.change_request?.status === 'pendente'} onClick={() => setSelected(place)} className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"><FilePenLine size={18} aria-hidden="true" />{place.change_request?.status === 'pendente' ? 'Alteração em análise' : 'Solicitar alteração'}</button>
    </li>)}</ul>
  </section>;
}
