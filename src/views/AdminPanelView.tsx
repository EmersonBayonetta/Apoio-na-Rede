import { useEffect, useState } from 'react';
import { ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { AccessibilityToolbar } from '../components/accessibility/AccessibilityToolbar';
import { getSupabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function AdminPanelView() {
  const { user, ready } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  useEffect(() => {
    document.title = 'Painel administrativo — Apoio na rede';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.append(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const client = getSupabase();
      if (!user || !client) { if (active) setAuthorized(false); return; }
      const { data, error } = await client.rpc('is_site_admin');
      if (active) setAuthorized(!error && data === true);
    };
    if (ready) void check();
    return () => { active = false; };
  }, [ready, user]);

  return (
    <div className="min-h-screen text-slate-900">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header className="border-b bg-white p-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <a href="/" className="font-bold text-blue-700">Apoio na rede</a>
          <a href="/" className="text-sm underline">Voltar ao site</a>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl p-4 pb-24 pt-10 sm:p-8 sm:pt-14">
        {authorized !== true ? <section className="max-w-xl rounded-2xl border bg-white p-6"><h1 className="text-2xl font-bold">{authorized === null ? 'Verificando acesso…' : 'Área restrita'}</h1><p className="mt-3 text-slate-600">{authorized === null ? 'Aguarde enquanto confirmamos suas permissões.' : 'Este painel é disponível apenas para administradores autorizados.'}</p><a href="/" className="mt-5 inline-block font-semibold text-blue-700 underline">Voltar ao site</a></section> : <>
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <ShieldCheck size={18} aria-hidden="true" /> Área restrita
          </div>
          <h1 className="mt-3 text-3xl font-bold">Painel administrativo</h1>
          <p className="mt-3 text-slate-600">Acesse as ferramentas de revisão e manutenção do catálogo. Cada área pede a autorização adequada antes de exibir dados.</p>
        </div>

        <section aria-label="Ferramentas administrativas" className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
          <a href="/gestao" className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none">
            <Building2 size={24} className="text-blue-700" aria-hidden="true" />
            <h2 className="mt-4 font-bold">Gerenciar locais</h2>
            <p className="mt-2 text-sm text-slate-600">Busque, atualize dados e confira fotos dos locais cadastrados.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Acessar gestão <ArrowRight size={16} aria-hidden="true" /></span>
          </a>
        </section>
        </>}
      </main>
      <AccessibilityToolbar />
    </div>
  );
}
