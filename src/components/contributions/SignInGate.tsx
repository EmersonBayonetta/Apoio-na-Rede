import { Fragment, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabase';
import { AdminAccessRequest } from './AdminAccessRequest';

export function SignInGate({ children, admin = false, onDemand = false }: { children: ReactNode; admin?: boolean; onDemand?: boolean }) {
  const client = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showLogin, setShowLogin] = useState(false);
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
  if (user) return <Fragment key={user.id}>{admin && !access?.allowed ? <><p role="alert" className="mb-4">Acesso não autorizado.</p><AdminAccessRequest /></> : children}<button type="button" className="min-h-11 underline mt-4" onClick={async () => { const { error } = await client.auth.signOut(); if (error) setMessage('Não foi possível sair.'); }}>Sair da conta</button>{message && <p role="status">{message}</p>}</Fragment>;
  if (onDemand && !showLogin) return <button type="button" onClick={() => setShowLogin(true)} className="min-h-11 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800">Publicar avaliação</button>;
  return <form className={onDemand ? 'space-y-4' : 'rounded-xl border bg-white p-5 space-y-4'} onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage('');
    try {
      if (sent && useCode) {
        const { error } = await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
        if (error) throw error;
      } else {
        const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: admin ? `${window.location.origin}/gestao` : window.location.href } });
        if (error) throw error;
        setSent(true); setMessage('Abra o link enviado ao seu e-mail para entrar. Confira também a pasta de spam.');
      }
    } catch(error) {
      const code=error && typeof error==='object' && 'code' in error ? error.code : undefined;
      const status=error && typeof error==='object' && 'status' in error ? error.status : undefined;
      setMessage(code==='over_email_send_rate_limit' || code==='over_request_rate_limit' || status===429
        ? 'Limite de envio atingido. Aguarde antes de solicitar outro link de acesso.'
        : sent && useCode ? 'Não foi possível confirmar o código. Confira o código recebido ou solicite um novo acesso.'
        : 'Não foi possível enviar o link de acesso. Tente novamente mais tarde.');
    }
    finally { setBusy(false); }
  }}>
    {!admin && !onDemand && <h2 className="text-xl font-bold">Entre para contribuir</h2>}
    {onDemand && <p className="text-sm">Confirme seu e-mail para publicar a avaliação.</p>}
    <label className="block">E-mail<input className="block w-full rounded-lg border p-3" type="email" autoComplete="email" required value={email} disabled={sent} onChange={e => setEmail(e.target.value)} /></label>
    {sent && useCode && <label className="block">Código do e-mail<input className="block w-full rounded-lg border p-3" inputMode="numeric" autoComplete="one-time-code" required value={token} onChange={e => setToken(e.target.value)} /></label>}
    {(!sent || useCode) && <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white" disabled={busy}>{busy ? 'Aguarde…' : sent ? 'Confirmar código' : 'Receber link de acesso'}</button>}
    {sent && <><button type="button" className="min-h-11 underline mr-4" onClick={() => { setSent(false); setToken('');setUseCode(false); }}>Tentar novamente</button>{!useCode && <button type="button" className="min-h-11 underline" onClick={()=>setUseCode(true)}>Meu e-mail contém um código</button>}</>}
    <p role="status" aria-live="polite">{message}</p>
  </form>;
}
