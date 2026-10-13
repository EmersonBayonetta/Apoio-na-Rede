import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

type AuthMode = 'welcome' | 'login' | 'signup';
type AuthContextValue = {
  user: User | null;
  ready: boolean;
  showWelcomeChoices: boolean;
  openAuthentication: (mode?: AuthMode) => void;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!client);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [showWelcomeChoices, setShowWelcomeChoices] = useState(() => window.location.pathname === '/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setReady(true);
      if (data.session?.user) { setMode(null); setShowWelcomeChoices(false); }
    }).catch(() => { if (active) setReady(true); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user) { setMode(null); setShowWelcomeChoices(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);

  const openAuthentication = useCallback((nextMode: AuthMode = 'welcome') => {
    setMessage('');
    setPassword('');
    setMode(client ? nextMode : 'welcome');
  }, [client]);
  const continueAsGuest = useCallback(() => {
    setMode(null);
    setShowWelcomeChoices(false);
  }, []);
  const signOut = useCallback(async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setUser(null);
    setShowWelcomeChoices(false);
  }, [client]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw Error('Use uma senha com pelo menos 8 caracteres.');
        const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) { setMessage('Conta criada. Confirme seu e-mail e depois entre para cadastrar um local.'); setMode('login'); }
      } else {
        const { data: signedIn, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error?.code === 'invalid_credentials') throw Error('E-mail ou senha incorretos.');
        if (error?.code === 'email_not_confirmed') throw Error('Confirme seu e-mail antes de entrar.');
        if (error) throw error;
        if (!signedIn.session) throw Error('Não foi possível confirmar a sessão. Tente entrar novamente.');
        // Confirm the newly issued token before asking the database for the role.
        // This prevents the admin check from using a stale pre-login session.
        const { error: identityError } = await client.auth.getUser(signedIn.session.access_token);
        if (identityError) throw Error('Não foi possível confirmar a sessão. Tente entrar novamente.');
        // Permission is decided by the protected database allowlist, never by an
        // email address or role stored in browser-visible code.
        const { data: isAdmin, error: accessError } = await client.rpc('is_site_admin');
        if (!accessError && isAdmin === true) {
          window.location.assign('/admin');
          return;
        }
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir o acesso.'); }
    finally { setBusy(false); }
  };
  const value = useMemo<AuthContextValue>(() => ({ user, ready, showWelcomeChoices, openAuthentication, continueAsGuest, signOut }), [user, ready, showWelcomeChoices, openAuthentication, continueAsGuest, signOut]);

  return <AuthContext.Provider value={value}>
    {children}
    {mode && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        {mode === 'welcome' ? <>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Apoio na rede</p>
          <h1 id="auth-title" className="mt-2 text-2xl font-bold text-slate-900">Como deseja continuar?</h1>
          <p className="mt-3 text-sm text-slate-600">Você pode explorar o catálogo sem conta. Para cadastrar ou contribuir, é necessário entrar.</p>
          {client ? <div className="mt-6 grid gap-3"><button type="button" onClick={() => setMode('signup')} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white">Criar uma conta</button><button type="button" onClick={() => setMode('login')} className="rounded-xl border border-blue-700 px-4 py-3 font-bold text-blue-800">Fazer login</button><button type="button" onClick={continueAsGuest} className="rounded-xl px-4 py-3 font-semibold text-slate-700 underline">Continuar sem se cadastrar</button></div> : <><p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">O acesso por conta não está configurado neste ambiente.</p><button type="button" onClick={continueAsGuest} className="mt-4 w-full rounded-xl border px-4 py-3 font-semibold">Continuar sem se cadastrar</button></>}
        </> : <>
          <button type="button" className="text-sm font-semibold text-blue-700 underline" onClick={() => { setMessage(''); setMode(null); }}>Voltar</button>
          <h1 id="auth-title" className="mt-4 text-2xl font-bold text-slate-900">{mode === 'signup' ? 'Criar uma conta' : 'Entrar na sua conta'}</h1>
          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <label className="grid gap-1 text-sm font-semibold text-slate-800">E-mail<input required autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-3" /></label>
            <label className="grid gap-1 text-sm font-semibold text-slate-800">Senha<input required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type="password" value={password} onChange={event => setPassword(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-3" /></label>
            {message && <p role="status" className="rounded-xl border p-3 text-sm">{message}</p>}
            <button disabled={busy} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : 'Entrar'}</button>
          </form>
          <button type="button" onClick={continueAsGuest} className="mt-4 text-sm font-semibold text-slate-700 underline">Continuar sem se cadastrar</button>
        </>}
      </section>
    </div>}
  </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
