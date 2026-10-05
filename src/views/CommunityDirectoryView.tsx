import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Accessibility, MapPinned, Plus, Search, Stethoscope, ExternalLink, CheckCircle2, Clock3 } from 'lucide-react';
import type { AccessibleRoute, DisabilityType, Professional } from '../types';
import { StorageService } from '../services/storageService';
import { filterProfessionals, filterRoutes, validateProfessional, validateRoute, whatsappUrl } from '../utils/communityDirectory';

const needs: { id: DisabilityType; label: string }[] = [
  { id: 'mobilidade', label: 'Mobilidade' }, { id: 'visual', label: 'Visual' },
  { id: 'auditiva', label: 'Auditiva' }, { id: 'intelectual', label: 'Intelectual / sensorial' },
  { id: 'invisivel', label: 'Condições não visíveis' },
];

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 font-semibold text-white hover:bg-blue-800';

export function CommunityDirectoryView({ section }: { section: 'routes' | 'professionals' }) {
  const [routes, setRoutes] = useState<AccessibleRoute[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [query, setQuery] = useState('');
  const [need, setNeed] = useState<DisabilityType | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([StorageService.getRoutes(), StorageService.getProfessionals()]).then(([r, p]) => { setRoutes(r); setProfessionals(p); });
  }, []);

  const filteredProfessionals = useMemo(() => filterProfessionals(professionals, query, need), [professionals, query, need]);
  const filteredRoutes = useMemo(() => filterRoutes(routes, query), [routes, query]);

  const saveRoute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const truth = (key: string) => data.get(key) === 'on';
    let route;
    try {
      route = validateRoute({ origin: String(data.get('origin')), destination: String(data.get('destination')), city: String(data.get('city')),
        description: String(data.get('description')), ramp: truth('ramp'), tactile: truth('tactile'), signal: truth('signal') });
    } catch (validationError) { setError((validationError as Error).message); return; }
    const saved = await StorageService.saveRoute(route);
    setRoutes(previous => [saved, ...previous]); setShowForm(false); setError(''); setNotice('Trecho adicionado. Ele aparece como relato comunitário até ser conferido no local.');
  };

  const saveProfessional = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let professional;
    try {
      professional = validateProfessional({
        nome: String(data.get('name')), especialidade: String(data.get('specialty')), cidade: String(data.get('city')),
        estado: String(data.get('state')), endereco: String(data.get('address')), telefone: String(data.get('phone')),
        whatsapp: String(data.get('whatsapp')), registro_profissional: String(data.get('registry')),
        atende_por_tipo: needs.filter(n => data.get(`need-${n.id}`) === 'on').map(n => n.id), descricao: String(data.get('description')),
      });
    } catch (validationError) { setError((validationError as Error).message); return; }
    const saved = await StorageService.saveProfessional(professional);
    setProfessionals(previous => [saved, ...previous]); setShowForm(false); setError(''); setNotice('Profissional adicionado ao catálogo deste navegador. Confira os dados antes de entrar em contato.');
  };

  const directions = (route: AccessibleRoute) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${route.ponto_origem}, ${route.cidade}`)}&destination=${encodeURIComponent(`${route.ponto_destino}, ${route.cidade}`)}&travelmode=walking`;

  return <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-7 rounded-3xl bg-gradient-to-br from-blue-950 to-teal-800 p-7 text-white sm:p-10">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-200"><Accessibility size={18} /> Apoio na rede · Catálogo comunitário</div>
      <h1 className="text-3xl font-bold sm:text-4xl">{section === 'routes' ? 'Trechos e rotas acessíveis' : 'Profissionais preparados para atender'}</h1>
      <p className="mt-3 max-w-2xl text-blue-100">{section === 'routes' ? 'Consulte informações sobre rampas, piso tátil e travessias. Os trajetos precisam ser conferidos presencialmente.' : 'Encontre profissionais por especialidade e necessidades atendidas. As informações são colaborativas e devem ser confirmadas com o consultório.'}</p>
      <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-blue-950" onClick={() => { setShowForm(v => !v); setNotice(''); setError(''); }}><Plus size={18} />{section === 'routes' ? 'Compartilhar um trecho' : 'Cadastrar profissional'}</button>
    </div>
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-900">{notice}</p>}
    {showForm && <form onSubmit={section === 'routes' ? saveRoute : saveProfessional} className={`${panel} mb-6 grid gap-4 md:grid-cols-2`}>
      <h2 className="text-xl font-bold md:col-span-2">{section === 'routes' ? 'Descreva o trecho' : 'Dados para o catálogo'}</h2>
      {section === 'routes' ? <>
        <label className="grid gap-1">Ponto de partida<input className={field} name="origin" required /></label><label className="grid gap-1">Destino<input className={field} name="destination" required /></label>
        <label className="grid gap-1">Cidade<input className={field} name="city" defaultValue="Cataguases" required /></label>
        <label className="grid gap-1 md:col-span-2">Condições observadas<textarea className={field} name="description" rows={3} placeholder="Descreva piso, obstáculos, inclinação, travessias e quando foi observado" required /></label>
        <fieldset className="flex flex-wrap gap-4 md:col-span-2"><legend className="mb-2 font-semibold">O que foi observado no trecho?</legend>{[['ramp','Rampas'],['tactile','Piso tátil'],['signal','Semáforo sonoro']].map(([id,label]) => <label key={id} className="flex items-center gap-2"><input type="checkbox" name={id} />{label}</label>)}</fieldset>
      </> : <>
        <label className="grid gap-1">Nome<input className={field} name="name" required /></label><label className="grid gap-1">Especialidade<input className={field} name="specialty" required placeholder="Ex.: fisioterapia, odontologia" /></label>
        <label className="grid gap-1">Cidade<input className={field} name="city" defaultValue="Cataguases" required /></label><label className="grid gap-1">Estado<input className={field} name="state" defaultValue="MG" required maxLength={2} /></label>
        <label className="grid gap-1">Endereço<input className={field} name="address" /></label><label className="grid gap-1">Telefone<input className={field} name="phone" type="tel" placeholder="(32) 3422-1234" /></label><label className="grid gap-1">WhatsApp<input className={field} name="whatsapp" type="tel" placeholder="Opcional, com DDD" /></label>
        <label className="grid gap-1">Registro profissional<input className={field} name="registry" placeholder="Opcional" /></label><label className="grid gap-1">Sobre o atendimento<textarea className={field} name="description" rows={2} /></label>
        <fieldset className="flex flex-wrap gap-4 md:col-span-2"><legend className="mb-2 font-semibold">Necessidades atendidas</legend>{needs.map(n => <label key={n.id} className="flex items-center gap-2"><input type="checkbox" name={`need-${n.id}`} />{n.label}</label>)}</fieldset>
      </>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 font-semibold text-red-900 md:col-span-2">{error}</p>}
      <div className="flex gap-3 md:col-span-2"><button className={primary} type="submit">Salvar no catálogo</button><button type="button" className="rounded-xl border px-4 py-2" onClick={() => { setShowForm(false); setError(''); }}>Cancelar</button></div>
      <p className="text-sm text-slate-600 md:col-span-2">Os dados ficam salvos neste navegador neste protótipo. Não inclua informações pessoais de pacientes.</p>
    </form>}
    <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="relative"><Search className="absolute left-3 top-3 text-slate-500" size={19} /><input className={`${field} pl-10`} value={query} onChange={e => setQuery(e.target.value)} placeholder={section === 'routes' ? 'Buscar por cidade, trecho ou local' : 'Buscar por nome, especialidade ou cidade'} /></label>
      {section === 'professionals' && <select className={field} value={need} onChange={e => setNeed(e.target.value as DisabilityType | '')}><option value="">Todas as necessidades</option>{needs.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select>}
    </div>
    {section === 'routes' ? <div className="grid gap-4 lg:grid-cols-2">{filteredRoutes.map(route => <article key={route.id} className={panel}>
      <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-teal-800"><MapPinned size={17}/>{route.cidade}</div><h2 className="mt-2 text-xl font-bold">{route.ponto_origem} <span aria-hidden="true">→</span> {route.ponto_destino}</h2></div>{route.auditada ? <span className="flex items-center gap-1 text-sm text-emerald-800"><CheckCircle2 size={16}/>Conferido</span> : <span className="flex items-center gap-1 text-sm text-amber-800"><Clock3 size={16}/>Relato</span>}</div>
      <p className="mt-3 text-slate-700">{route.trecho_descricao}</p><div className="mt-4 flex flex-wrap gap-2">{route.tem_rampa && <span className="rounded-full bg-blue-50 px-3 py-1 text-sm">Rampas</span>}{route.tem_piso_tatil && <span className="rounded-full bg-blue-50 px-3 py-1 text-sm">Piso tátil</span>}{route.tem_semaforo_sonoro && <span className="rounded-full bg-blue-50 px-3 py-1 text-sm">Semáforo sonoro</span>}{!route.tem_rampa && !route.tem_piso_tatil && !route.tem_semaforo_sonoro && <span className="text-sm text-slate-600">Sem itens de acessibilidade confirmados</span>}</div>
      <div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-sm text-slate-600">{route.distancia_metros ? `${route.distancia_metros} m` : 'Distância não informada'} · {route.nivel_seguranca}</span><a className="inline-flex items-center gap-1 font-semibold text-blue-900" target="_blank" rel="noreferrer" href={directions(route)}>Ver direções <ExternalLink size={15}/></a></div>
    </article>)}</div> : <div className="grid gap-4 lg:grid-cols-2">{filteredProfessionals.map(person => <article key={person.id} className={panel}>
      <div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-800"><Stethoscope/></div><div><h2 className="text-xl font-bold">{person.nome}</h2><p className="font-medium text-teal-800">{person.especialidade}</p><p className="mt-1 text-sm text-slate-600">{person.cidade} – {person.estado}{person.registro_profissional ? ` · ${person.registro_profissional}` : ''}</p></div></div>
      <p className="mt-4 text-slate-700">{person.descricao}</p>{person.endereco && <p className="mt-2 text-sm">📍 {person.endereco}</p>}
      <div className="mt-3 flex flex-wrap gap-2">{person.atende_por_tipo.map(type => <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{needs.find(n => n.id === type)?.label ?? type}</span>)}</div>
      <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">{person.telefone && <a className={primary} href={`tel:${person.telefone.replace(/[^+\d]/g, '')}`}>Ligar · {person.telefone}</a>}{whatsappUrl(person.whatsapp) && <a className="rounded-xl border border-emerald-700 px-4 py-2.5 font-semibold text-emerald-900" target="_blank" rel="noreferrer" href={whatsappUrl(person.whatsapp) ?? undefined}>WhatsApp</a>}</div>
    </article>)}</div>}
    {((section === 'routes' && !filteredRoutes.length) || (section === 'professionals' && !filteredProfessionals.length)) && <div className={`${panel} py-12 text-center`}><p className="text-lg font-semibold">Nenhum resultado para essa busca.</p><p className="mt-2 text-slate-600">Tente outro termo ou compartilhe uma informação para ampliar o catálogo.</p></div>}
    <p className="mt-6 text-sm text-slate-600">Informações comunitárias podem mudar. Confirme acessibilidade e disponibilidade diretamente com o local ou profissional antes de sair.</p>
  </section>;
}
