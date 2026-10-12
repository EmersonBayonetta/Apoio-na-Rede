import { useEffect, useRef, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { browserStorage } from '../lib/browserStorage';
import { PlaceManagementService, ManagementError, type ManagedPlace } from '../services/placeManagementService';
import { PlaceEditForm } from '../components/establishments/PlaceEditForm';
import { AccessibilityToolbar } from '../components/accessibility/AccessibilityToolbar';
import type { EstablishmentStatus } from '../types';

const statusLabels = {pendente:'Pendente',verificado:'Publicado',rejeitado:'Recusado'};
export function PlaceManagementView() {
  const [revision,setRevision] = useState(0);
  const [mode,setMode] = useState<'login'|'ready'|'denied'|'error'>('login');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [email,setEmail] = useState('');
  const [signedEmail,setSignedEmail] = useState('');
  const [message,setMessage] = useState('');
  const [search,setSearch] = useState('');
  const [query,setQuery] = useState('');
  const [status,setStatus] = useState<EstablishmentStatus | ''>('');
  const [page,setPage] = useState(0);
  const [places,setPlaces] = useState<ManagedPlace[]>([]);
  const [total,setTotal] = useState(0);
  const [selected,setSelected] = useState<ManagedPlace | null>(null);
  const [temporaryStorage,setTemporaryStorage] = useState(browserStorage.isTemporary);
  const generation = useRef(0);
  const authId = useRef<string | null | undefined>(undefined);
  const demo = !getSupabase();
  useEffect(() => {
    const operations = generation;
    const warn = () => setTemporaryStorage(true);
    window.addEventListener('storage-unavailable',warn);
    document.title = 'Gerenciar locais — Apoio na rede';
    const meta = document.createElement('meta');meta.name='robots';meta.content='noindex, nofollow';document.head.append(meta);
    const client = getSupabase();
    const listener = client?.auth.onAuthStateChange((event,session) => {
      if (['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) {
        const id = session?.user.id ?? null;
        if (event !== 'USER_UPDATED' && authId.current === id) return;
        authId.current = id;
        generation.current++;
        setSelected(null);setPlaces([]);setRevision(value => value+1);
      }
    });
    return () => {operations.current++;listener?.data.subscription.unsubscribe();meta.remove();window.removeEventListener('storage-unavailable',warn);};
  },[]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = async () => {
      const client = getSupabase();
      if (client) {
        const {data,error} = await client.auth.getUser();
        if (!active) return;
        if (error || !data.user) {setSignedEmail('');setMode('login');setPlaces([]);return;}
        setSignedEmail(data.user.email ?? 'Administrador');
      }
      const result = await PlaceManagementService.list(query,status,page);
      if (!active) return;
      setPlaces(result.places);setTotal(result.total);setMode('ready');
    };
    void load().catch(error => {
      if (!active) return;
      setPlaces([]);setSelected(null);
      setMode(error instanceof ManagementError && error.status === 403 ? 'denied' : error instanceof ManagementError && error.status === 401 ? 'login' : 'error');
      setMessage((error as Error).message);
    }).finally(() => {if(active)setLoading(false);});
    return () => {active=false;};
  },[revision,query,status,page]);
  const login = async (event:React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);setMessage('Solicitando link de acesso…');
    try {
      const {error} = await getSupabase()!.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:false,emailRedirectTo:new URL('/gestao',window.location.origin).href}});
      if (error) throw error;
      setMessage('Se este e-mail estiver cadastrado, você receberá um link de acesso. Abra o link para entrar. Somente administradores autorizados podem gerenciar locais.');
    } catch {setMessage('Não foi possível solicitar o link. Confira o e-mail e tente novamente mais tarde.');}
    finally {setBusy(false);}
  };
  const logout = async () => {
    setBusy(true);
    try {
      const {error} = await getSupabase()!.auth.signOut();
      if (error) throw error;
      generation.current++;setSelected(null);setPlaces([]);setSignedEmail('');setMode('login');setMessage('Você saiu da área de gestão.');
    } catch {setMessage('Não foi possível sair. Tente novamente.');}
    finally {setBusy(false);}
  };
  const openPlace = async (id:string) => {
    const current = ++generation.current;
    setBusy(true);setMessage('');
    try {const place=await PlaceManagementService.get(id);if(current === generation.current) {setSelected(place);window.scrollTo({top:0,behavior:'instant'});}}
    catch (error) {
      if(current !== generation.current)return;
      if(error instanceof ManagementError && [401,403].includes(error.status)){setPlaces([]);setMode(error.status===401?'login':'denied');}
      setMessage((error as Error).message);
    } finally {setBusy(false);}
  };
  return <div className="min-h-screen text-slate-900">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="border-b bg-white p-4"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"><a href="/" className="font-bold text-blue-700">Apoio na rede</a><a href="/?aba=cadastro" className="text-sm underline">Cadastrar novo local</a></div></header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-6 p-4 pb-24 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Gerenciar locais</h1><p className="mt-2 text-sm text-slate-600">Encontre um local cadastrado para atualizar seus dados e fotos.</p></div>{signedEmail && <div className="flex flex-wrap items-center gap-3 text-sm"><span>{signedEmail}</span><button type="button" disabled={busy} onClick={() => void logout()} className="rounded-xl border px-4 py-2">Sair</button></div>}</div>
      {demo && <p className="rounded-xl border bg-blue-50 p-4 text-sm text-blue-950">Modo de demonstração: esta área edita somente os locais salvos neste navegador. Nenhum e-mail é enviado.</p>}
      {demo && temporaryStorage && <p role="status" className="rounded-xl border p-4 text-sm">O navegador não conseguiu salvar os dados. As alterações desta sessão serão perdidas ao fechar ou recarregar a página.</p>}
      {message && <p role="status" className="rounded-xl border p-4 text-sm">{message}</p>}
      {loading && <p role="status">Carregando locais…</p>}
      {!loading && mode === 'login' && <form onSubmit={event => void login(event)} className="max-w-md space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">Acesso do administrador</h2><p className="text-sm text-slate-600">Informe o e-mail já autorizado. Enviaremos um link para entrar, sem senha.</p>
        <label className="grid gap-2 text-sm font-semibold">E-mail<input type="email" autoComplete="email" required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} className="rounded-xl border bg-white p-3" /></label>
        <button disabled={busy} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Aguarde…' : 'Receber link de acesso'}</button>
      </form>}
      {!loading && mode === 'denied' && <p className="rounded-xl border p-4">Acesso restrito aos administradores autorizados do site. Entre com o e-mail do administrador para continuar.</p>}
      {!loading && mode === 'error' && <button type="button" onClick={() => {setMessage('');setRevision(value => value+1);}} className="rounded-xl border px-4 py-3">Tentar novamente</button>}
      {mode === 'ready' && selected ? <PlaceEditForm key={`${selected.id}-${selected.atualizado_em}`} place={selected} onCancel={() => {setSelected(null);setMessage('');}} onSessionExpired={() => {setSelected(null);setPlaces([]);setRevision(value => value+1);setMessage('Seu acesso precisa ser conferido novamente.');}} onSaved={saved => {
        setSelected(null);setMessage(saved.status === 'verificado' ? 'Alterações salvas e atualizadas no site.' : 'Alterações salvas. O status do cadastro foi mantido.');setRevision(value => value+1);
      }} /> : mode === 'ready' && <section aria-label="Locais cadastrados" className="space-y-4">
        <form onSubmit={event => {event.preventDefault();setPage(0);setQuery(search.trim());setMessage('');}} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-2 text-sm font-semibold">Buscar pelo nome<input type="search" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="Nome do local" className="min-w-0 rounded-xl border bg-white p-3" /></label>
          <label className="grid gap-2 text-sm font-semibold">Status<select value={status} onChange={event => {setStatus(event.target.value as EstablishmentStatus | '');setPage(0);setMessage('');}} className="rounded-xl border bg-white p-3"><option value="">Todos</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button type="submit" disabled={loading} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">Buscar</button>
        </form>
        <p className="text-sm text-slate-600">{total} {total === 1 ? 'local encontrado' : 'locais encontrados'}.</p>
        {!loading && !places.length && <p className="rounded-xl border p-4">Nenhum local encontrado. Confira a busca e o filtro de status.</p>}
        <ul className="space-y-3">{places.map(place => <li key={place.id} className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center"><div className="min-w-0"><h2 className="break-words font-bold">{place.nome}</h2><p className="mt-1 break-words text-sm text-slate-600">{place.endereco} · {place.cidade} / {place.estado}</p><p className="mt-1 text-xs">{statusLabels[place.status]} · {(place.fotos ?? []).length} fotos</p></div><button type="button" disabled={busy || loading} aria-label={`Editar ${place.nome}`} onClick={() => void openPlace(place.id)} className="shrink-0 rounded-xl border px-5 py-3 font-semibold disabled:opacity-50">Editar</button></li>)}</ul>
        {total > 20 && <nav aria-label="Páginas de locais" className="flex flex-wrap items-center gap-3"><button disabled={page===0 || loading} onClick={() => setPage(value => value-1)} className="rounded-xl border px-4 py-3 disabled:opacity-50">Anterior</button><span className="text-sm">Página {page+1} de {Math.ceil(total/20)}</span><button disabled={(page+1)*20>=total || loading} onClick={() => setPage(value => value+1)} className="rounded-xl border px-4 py-3 disabled:opacity-50">Próxima</button></nav>}
      </section>}
      <a href="/" className="inline-block py-3 text-sm underline">Voltar ao site</a>
    </main>
    <AccessibilityToolbar />
  </div>;
}
