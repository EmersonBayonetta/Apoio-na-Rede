import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

interface AdminLoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onBack: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex bg-slate-950 text-white p-12 xl:p-16 flex-col justify-between">
        <img src="/brand/apoio-na-rede-logo-white.png" alt="Apoio na rede" className="h-14 w-auto self-start" />
        <div className="max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300 mb-4">Ambiente restrito</p>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-5">Moderação com contexto, segurança e responsabilidade.</h1>
          <p className="text-base text-slate-300 leading-relaxed">Revise cadastros e relatos da comunidade mantendo a qualidade das informações de acessibilidade.</p>
        </div>
        <p className="text-xs text-slate-500">Acesso exclusivo para administradores autorizados.</p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <button type="button" onClick={onBack} className="absolute top-5 left-5 sm:top-8 sm:left-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar ao site
        </button>

        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10"><img src="/brand/apoio-na-rede-logo.png" alt="Apoio na rede" className="h-14 w-auto" /></div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-5">
            <LockKeyhole size={24} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-950 mb-2">Acessar administração</h1>
          <p className="text-sm text-slate-600 mb-8">Use suas credenciais administrativas para continuar.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="block text-sm font-bold text-slate-800 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full min-h-12 pl-11 pr-4 rounded-xl border border-slate-300 bg-white text-sm focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-bold text-slate-800 mb-1.5">Senha</label>
              <div className="relative">
                <LockKeyhole size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full min-h-12 pl-11 pr-12 rounded-xl border border-slate-300 bg-white text-sm focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !email || !password} className="w-full min-h-12 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors">
              {isSubmitting ? 'Verificando…' : 'Entrar na administração'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};
