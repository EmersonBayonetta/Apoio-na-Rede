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
  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setLoading(false); } });
    const { data } = client.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client]);
  if (!client) return <><p role="status" className="rounded-xl border p-4 mb-4">Modo demonstração: os dados ficam apenas neste navegador. {admin && 'A moderação desta demonstração não exige login.'}</p>{children}</>;
  if (loading) return <p role="status">Verificando acesso…</p>;
  if (user) return <Fragment key={user.id}>{admin && user.app_metadata.role !== 'admin' ? <p role="alert">Acesso não autorizado</p> : children}<button type="button" className="min-h-11 underline mt-4" onClick={async () => { const { error } = await client.auth.signOut(); if (error) setMessage('Não foi possível sair.'); }}>Sair da conta</button>{message && <p role="status">{message}</p>}</Fragment>;
  return <form className="rounded-xl border bg-white p-5 space-y-4" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage('');
    try {
      if (sent) {
        const { error } = await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
        if (error) throw error;
      } else {
        const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: window.location.href } });
        if (error) throw error;
        setSent(true); setMessage('Confira seu e-mail. Use o código recebido ou abra o link de acesso.');
      }
    } catch { setMessage('Não foi possível entrar. Confira o e-mail e o código ou tente novamente mais tarde.'); }
    finally { setBusy(false); }
  }}>
    <h2 className="text-xl font-bold">Entre para {admin ? 'acessar a gestão' : 'contribuir'}</h2>
    <label className="block">E-mail<input className="block w-full rounded-lg border p-3" type="email" autoComplete="email" required value={email} disabled={sent} onChange={e => setEmail(e.target.value)} /></label>
    {sent && <label className="block">Código do e-mail<input className="block w-full rounded-lg border p-3" inputMode="numeric" autoComplete="one-time-code" required value={token} onChange={e => setToken(e.target.value)} /></label>}
    <button className="min-h-11 rounded-lg bg-blue-700 px-4 text-white" disabled={busy}>{busy ? 'Aguarde…' : sent ? 'Confirmar código' : 'Receber acesso por e-mail'}</button>
    {sent && <button type="button" className="min-h-11 ml-4 underline" onClick={() => { setSent(false); setToken(''); }}>Alterar e-mail</button>}
    <p role="status" aria-live="polite">{message}</p>
  </form>;
}
