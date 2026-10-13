import { ArrowLeft, ArrowUpRight, Building2, Inbox, LogOut, ShieldCheck, Sun, Moon, KeyRound } from 'lucide-react';
import '../styles/admin.css';
import { useEffect, useRef, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { browserStorage } from '../lib/browserStorage';
import { PlaceManagementService, ManagementError, type ManagedPlace } from '../services/placeManagementService';
import { ReceivedRegistrations } from '../components/establishments/ReceivedRegistrations';
import { PlaceEditForm } from '../components/establishments/PlaceEditForm';
import { AccessibilityToolbar } from '../components/accessibility/AccessibilityToolbar';
import type { EstablishmentStatus } from '../types';

const statusLabels = {pendente:'Pendente',verificado:'Publicado',rejeitado:'Recusado'};
export function PlaceManagementView() {
  const [theme,setTheme] = useState<'light'|'dark'>(() => browserStorage.getItem('apoio_color_theme') === 'light' ? 'light' : 'dark');
  useEffect(() => {document.documentElement.dataset.theme=theme;browserStorage.setItem('apoio_color_theme',theme);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#ffffff':'#101111');},[theme]);
  const [revision,setRevision] = useState(0);
  const [mode,setMode] = useState<'login'|'ready'|'denied'|'error'>('login');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [panel,setPanel] = useState<'received'|'places'>('received');
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
    document.title = 'Painel administrador — Apoio na rede';
    const meta = document.createElement('meta');meta.name='robots';meta.content='noindex, nofollow';document.head.append(meta);
    const client = getSupabase();
    const listener = client?.auth.onAuthStateChange((event,session) => {
      if (['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) {
        const id = session?.user.id ?? null;
        if (event !== 'USER_UPDATED' && authId.current === id) return;
        authId.current = id;
        generation.current++;
        setSelected(null);setPlaces([]);setMode('login');setRevision(value => value+1);
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
        const access=await client.rpc('is_site_admin');
        if(!active)return;
        if(access.error || access.data!==true)throw new ManagementError('Este e-mail não tem autorização administrativa.',403);
      }
      if(panel==='received'){if(active)setMode('ready');return;}
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
  },[revision,query,status,page,panel]);
  const login = async (event:React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);setMessage('Entrando…');
    try {
      const client=getSupabase()!;
      const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw Error('E-mail ou senha inválidos.');
      const access=await client.rpc('is_site_admin');
      if(access.error || access.data!==true){await client.auth.signOut({scope:'local'});throw Error('Esta conta não tem permissão administrativa.');}
      setPassword('');setMessage('');setRevision(value=>value+1);
    } catch (error) {setMessage((error as Error).message);}
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
  return <div className="admin-shell min-h-screen text-slate-900">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="app-header"><div className="header-inner admin-header"><a href="/" className="brand-logo" aria-label="Apoio na rede — Página inicial"><img className="brand-logo-dark" src="/brand/apoio-na-rede-logo-white.png" alt="" /><img className="brand-logo-light" src="/brand/apoio-na-rede-logo.png" alt="" /></a><span className="admin-header-label"><ShieldCheck size={16} aria-hidden="true" /> Administração</span><div className="admin-header-actions"><a href="/?aba=cadastro" className="admin-header-link">Cadastrar novo local <ArrowUpRight size={16} aria-hidden="true" /></a><button type="button" className="admin-icon-button" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'}>{theme==='dark'?<Sun size={20} aria-hidden="true" />:<Moon size={20} aria-hidden="true" />}</button></div></div></header>
    <main id="main-content" tabIndex={-1} className="admin-main mx-auto max-w-5xl space-y-6 p-4 pb-24 sm:p-8">
      <div className="admin-intro"><div><p className="admin-kicker"><ShieldCheck size={15} aria-hidden="true" /> Cuidando da informação</p><h1>Painel <span>administrador</span></h1><p className="admin-description">Revise os cadastros recebidos e gerencie os dados e fotos dos locais.</p></div>{signedEmail && <div className="admin-account"><span className="admin-account-icon"><ShieldCheck size={20} aria-hidden="true" /></span><span className="admin-account-email"><small>Conectado como</small>{signedEmail}</span><button type="button" disabled={busy} onClick={() => void logout()} className="admin-icon-button" aria-label="Sair"><LogOut size={18} aria-hidden="true" /></button></div>}</div>
      {demo && <p className="rounded-xl border bg-blue-50 p-4 text-sm text-blue-950">Modo de demonstração: este painel usa somente os cadastros salvos neste navegador. Nenhum e-mail é enviado.</p>}
      {demo && temporaryStorage && <p role="status" className="rounded-xl border p-4 text-sm">O navegador não conseguiu salvar os dados. As alterações desta sessão serão perdidas ao fechar ou recarregar a página.</p>}
      {message && <p role="status" className="rounded-xl border p-4 text-sm">{message}</p>}
      {loading && <p role="status">Carregando locais…</p>}
      {!loading && mode === 'login' && <form onSubmit={event => void login(event)} className="admin-login space-y-5 rounded-2xl border bg-white p-5">
        <span className="admin-login-icon"><KeyRound size={26} aria-hidden="true" /></span><h2 className="text-lg font-bold">Acesso do administrador</h2><p className="text-sm text-slate-600">Entre com seu e-mail autorizado e senha.</p>
        <label className="grid gap-2 text-sm font-semibold">E-mail<input type="email" autoComplete="email" required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} className="admin-field rounded-xl border bg-white p-3" /></label>
        <label className="grid gap-2 text-sm font-semibold">Senha<input type="password" autoComplete="current-password" required value={password} disabled={busy} onChange={event=>setPassword(event.target.value)} className="admin-field rounded-xl border bg-white p-3" /></label>
        <button disabled={busy} className="admin-login-submit rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Aguarde…' : 'Entrar'}<ArrowUpRight size={18} aria-hidden="true" /></button>
      </form>}
      {!loading && mode === 'denied' && <p className="rounded-xl border p-4">Acesso restrito aos administradores autorizados do site. Entre com o e-mail do administrador para continuar.</p>}
      {!loading && mode === 'error' && <button type="button" onClick={() => {setMessage('');setRevision(value => value+1);}} className="rounded-xl border px-4 py-3">Tentar novamente</button>}
      {mode === 'ready' && <nav aria-label="Seções do painel" className="admin-tabs flex flex-wrap gap-3"><button type="button" aria-pressed={panel==='received'} onClick={()=>{setPanel('received');setSelected(null);setMessage('');}} className="rounded-xl border px-4 py-3 font-semibold"><Inbox size={18} aria-hidden="true" />Cadastros recebidos</button><button type="button" aria-pressed={panel==='places'} onClick={()=>{setPanel('places');setSelected(null);setMessage('');}} className="rounded-xl border px-4 py-3 font-semibold"><Building2 size={18} aria-hidden="true" />Gerenciar locais</button></nav>}
      {mode === 'ready' && selected ? <PlaceEditForm key={`${selected.id}-${selected.atualizado_em}`} place={selected} onCancel={() => {setSelected(null);setMessage('');}} onSessionExpired={() => {setSelected(null);setPlaces([]);setRevision(value => value+1);setMessage('Seu acesso precisa ser conferido novamente.');}} onSaved={saved => {
        setSelected(null);setMessage(saved.status === 'verificado' ? 'Alterações salvas e atualizadas no site.' : 'Alterações salvas. O status do cadastro foi mantido.');setRevision(value => value+1);
      }} /> : mode === 'ready' && panel === 'received' ? <ReceivedRegistrations onEditPlace={id=>{setPanel('places');void openPlace(id);}} /> : mode === 'ready' && <section aria-label="Locais cadastrados" className="space-y-4">
        <form onSubmit={event => {event.preventDefault();setPage(0);setQuery(search.trim());setMessage('');}} className="admin-filters flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-2 text-sm font-semibold">Buscar pelo nome<input type="search" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="Nome do local" className="min-w-0 rounded-xl border bg-white p-3" /></label>
          <label className="grid gap-2 text-sm font-semibold">Status<select value={status} onChange={event => {setStatus(event.target.value as EstablishmentStatus | '');setPage(0);setMessage('');}} className="admin-field rounded-xl border bg-white p-3"><option value="">Todos</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button type="submit" disabled={loading} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">Buscar</button>
        </form>
        <p className="text-sm text-slate-600">{total} {total === 1 ? 'local encontrado' : 'locais encontrados'}.</p>
        {!loading && !places.length && <p className="rounded-xl border p-4">Nenhum local encontrado. Confira a busca e o filtro de status.</p>}
        <ul className="space-y-3">{places.map(place => <li key={place.id} className="admin-record flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center"><div className="min-w-0"><h2 className="break-words font-bold">{place.nome}</h2><p className="mt-1 break-words text-sm text-slate-600">{place.endereco} · {place.cidade} / {place.estado}</p><p className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className={`admin-status admin-status-${place.status}`}>{statusLabels[place.status]}</span><span>{(place.fotos ?? []).length} fotos</span></p></div><button type="button" disabled={busy || loading} aria-label={`Editar ${place.nome}`} onClick={() => void openPlace(place.id)} className="shrink-0 rounded-xl border px-5 py-3 font-semibold disabled:opacity-50">Editar</button></li>)}</ul>
        {total > 20 && <nav aria-label="Páginas de locais" className="flex flex-wrap items-center gap-3"><button disabled={page===0 || loading} onClick={() => setPage(value => value-1)} className="rounded-xl border px-4 py-3 disabled:opacity-50">Anterior</button><span className="text-sm">Página {page+1} de {Math.ceil(total/20)}</span><button disabled={(page+1)*20>=total || loading} onClick={() => setPage(value => value+1)} className="rounded-xl border px-4 py-3 disabled:opacity-50">Próxima</button></nav>}
      </section>}
      <a href="/" className="admin-back inline-flex items-center gap-2 py-3 text-sm"><ArrowLeft size={16} aria-hidden="true" />Voltar ao site</a>
    </main>
    <AccessibilityToolbar />
  </div>;
}
