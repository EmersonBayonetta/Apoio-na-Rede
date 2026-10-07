import { Fragment, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabase';

export function SignInGate({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const client = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [useCode,setUseCode] = useState(false);
  const [access,setAccess] = useState<{id:string;allowed:boolean}|null>(null);
  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setLoading(false); } });
    const { data } = client.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client]);
  useEffect(()=>{
    if (!client || !admin || !user) return;
    let active=true;
    void client.rpc('is_site_admin').then(({data,error})=>{if(active)setAccess({id:user.id,allowed:!error && data===true});});
    return ()=>{active=false;setAccess(null);};
  },[client,admin,user]);
  if (!client) return admin ? <p role="alert">Painel administrativo indisponível neste ambiente.</p> : <><p role="status" className="rounded-xl border p-4 mb-4">Modo demonstração: os dados ficam apenas neste navegador.</p>{children}</>;
  if (loading) return <p role="status">Verificando acesso…</p>;
  if (user && admin && access?.id!==user.id) return <p role="status">Verificando acesso…</p>;
  if (user) return <Fragment key={user.id}>{admin && !access?.allowed ? <p role="alert">Acesso não autorizado. Esta conta não pertence à equipe administrativa.</p> : children}<button type="button" className="min-h-11 underline mt-4" onClick={async () => { const { error } = await client.auth.signOut(); if (error) setMessage('Não foi possível sair.'); }}>Sair da conta</button>{message && <p role="status">{message}</p>}</Fragment>;
  return <form className="rounded-xl border bg-white p-5 space-y-4" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage('');
    try {
      if (sent && useCode) {
        const { error } = await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
        if (error) throw error;
      } else {
        const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: !admin, emailRedirectTo: admin ? `${window.location.origin}/gestao` : window.location.href } });
        if (error) throw error;
        setSent(true); setMessage('Abra o link enviado ao seu e-mail para entrar. Confira também a pasta de spam.');
      }
    } catch { setMessage('Não foi possível entrar. Confira o e-mail e o código ou tente novamente mais tarde.'); }
    finally { setBusy(false); }
  }}>
    {!admin && <h2 className="text-xl font-bold">Entre para contribuir</h2>}
    <label className="block">E-mail<input className="block w-full rounded-lg border p-3" type="email" autoComplete="email" required value={email} disabled={sent} onChange={e => setEmail(e.target.value)} /></label>
    {sent && useCode && <label className="block">Código do e-mail<input className="block w-full rounded-lg border p-3" inputMode="numeric" autoComplete="one-time-code" required value={token} onChange={e => setToken(e.target.value)} /></label>}
    {(!sent || useCode) && <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white" disabled={busy}>{busy ? 'Aguarde…' : sent ? 'Confirmar código' : 'Receber link de acesso'}</button>}
    {sent && <><button type="button" className="min-h-11 underline mr-4" onClick={() => { setSent(false); setToken('');setUseCode(false); }}>Tentar novamente</button>{!useCode && <button type="button" className="min-h-11 underline" onClick={()=>setUseCode(true)}>Meu e-mail contém um código</button>}</>}
    <p role="status" aria-live="polite">{message}</p>
  </form>;
}
