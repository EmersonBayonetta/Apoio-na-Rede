import { ArrowRight, CircleCheckBig, Compass, LogIn, MapPinned, ShieldCheck, UserPlus } from 'lucide-react';

interface WelcomeViewProps {
  onCreateAccount: () => void;
  onLogin: () => void;
  onContinue: () => void;
}

export function WelcomeView({ onCreateAccount, onLogin, onContinue }: WelcomeViewProps) {
  return <main id="main-content" className="relative min-h-screen overflow-hidden bg-[#071f25] px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8">
    <div aria-hidden="true" className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
    <div aria-hidden="true" className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
    <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col sm:min-h-[calc(100vh-3rem)]">
      <header className="flex items-center justify-between gap-3">
        <img src="/brand/apoio-na-rede-logo-white.png" alt="Apoio na rede" className="h-11 w-auto sm:h-14" />
        <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-teal-100 sm:text-xs">Acessibilidade urbana</span>
      </header>

      <section className="my-auto grid items-center gap-8 py-9 sm:gap-10 sm:py-14 lg:grid-cols-[1.12fr_.88fr] lg:items-start lg:gap-12 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-teal-300 sm:text-sm sm:tracking-[0.14em]"><CircleCheckBig size={17} aria-hidden="true" /> Informação para ir mais longe</p>
          <h1 className="mt-4 max-w-3xl text-[2.45rem] font-extrabold leading-[1.08] tracking-tight sm:mt-5 sm:text-5xl sm:leading-tight lg:text-6xl">Saiba se um lugar é acessível antes de sair.</h1>
          <p className="mt-5 max-w-2xl text-[0.97rem] leading-relaxed text-slate-200 sm:mt-6 sm:text-lg">O Apoio na Rede reúne informações colaborativas sobre acessibilidade para ajudar você a encontrar locais, profissionais e caminhos que atendam às suas necessidades.</p>
          <div className="mt-7 grid max-w-2xl gap-3 min-[440px]:grid-cols-3 sm:mt-8">
            <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 min-[440px]:block"><Compass className="shrink-0 text-teal-300" size={22} aria-hidden="true" /><div><p className="min-[440px]:mt-3 text-sm font-bold">Explore com autonomia</p><p className="mt-1 text-xs leading-relaxed text-slate-300">Encontre locais e serviços.</p></div></div>
            <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 min-[440px]:block"><MapPinned className="shrink-0 text-teal-300" size={22} aria-hidden="true" /><div><p className="min-[440px]:mt-3 text-sm font-bold">Planeje sua saída</p><p className="mt-1 text-xs leading-relaxed text-slate-300">Consulte endereço e rota a pé.</p></div></div>
            <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 min-[440px]:block"><ShieldCheck className="shrink-0 text-teal-300" size={22} aria-hidden="true" /><div><p className="min-[440px]:mt-3 text-sm font-bold">Dados transparentes</p><p className="mt-1 text-xs leading-relaxed text-slate-300">Veja o que já foi confirmado.</p></div></div>
          </div>
        </div>

        <section aria-labelledby="welcome-choice-title" className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur sm:p-8 lg:mt-[4.25rem] lg:max-w-[30.5rem] lg:justify-self-end">
          <h2 id="welcome-choice-title" className="text-xl font-bold sm:text-2xl">Como você quer começar?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">Crie uma conta ou entre para aproveitar todos os recursos da plataforma. Se preferir, você também pode explorar o Apoio na Rede sem se cadastrar.</p>
          <div className="mt-6 grid gap-3 sm:mt-7">
            <button type="button" onClick={onCreateAccount} className="flex min-h-14 items-center justify-between rounded-xl bg-teal-400 px-4 py-3 text-left font-bold text-slate-950 transition hover:bg-teal-300"><span className="inline-flex items-center gap-3"><UserPlus size={19} aria-hidden="true" />Criar uma conta</span><ArrowRight size={18} aria-hidden="true" /></button>
            <button type="button" onClick={onLogin} className="flex min-h-14 items-center justify-between rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-left font-bold text-white transition hover:bg-white/10"><span className="inline-flex items-center gap-3"><LogIn size={19} aria-hidden="true" />Fazer login</span><ArrowRight size={18} aria-hidden="true" /></button>
            <button type="button" onClick={onContinue} className="min-h-12 rounded-xl px-4 py-3 text-sm font-semibold text-teal-100 underline decoration-teal-300/60 underline-offset-4 hover:text-white">Continuar sem se cadastrar</button>
          </div>
        </section>
      </section>
      <p className="text-center text-xs text-slate-400">Suas necessidades de acessibilidade ficam apenas neste navegador.</p>
    </div>
  </main>;
}
