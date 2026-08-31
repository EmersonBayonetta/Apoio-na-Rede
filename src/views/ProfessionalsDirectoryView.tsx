import React, { useState, useEffect } from 'react';
import { Professional, DisabilityType } from '../types';
import { StorageService } from '../services/storageService';
import { DisabilityBadge } from '../components/DisabilityBadge';
import { AudioReaderButton } from '../components/AudioReaderButton';
import {
  HeartPulse,
  Search,
  Phone,
  MessageCircle,
  Mail,
  Award,
} from 'lucide-react';

export const ProfessionalsDirectoryView: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchEspecialidade, setSearchEspecialidade] = useState('todas');
  const [selectedDisability, setSelectedDisability] = useState<DisabilityType | 'todas'>('todas');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await StorageService.getProfessionals(
          searchEspecialidade,
          selectedDisability === 'todas' ? undefined : selectedDisability
        );
        setProfessionals(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [searchEspecialidade, selectedDisability]);

  const specialties = [
    { id: 'todas', label: 'Todas as Especialidades' },
    { id: 'Odonto', label: 'Odontologia / Dentistas' },
    { id: 'Fisioterapia', label: 'Fisioterapia & Reabilitação' },
    { id: 'Psicologia', label: 'Psicologia & Neuropsicologia' },
    { id: 'Oftalmologia', label: 'Oftalmologia & Baixa Visão' },
    { id: 'Terapeuta Ocupacional', label: 'Terapia Ocupacional' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 animate-fadeIn">
      {/* Banner */}
      <div className="bg-blue-950 text-white rounded-2xl px-6 py-8 sm:px-10 mb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300 mb-3">
            Saúde e cuidado especializado
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Profissionais com atendimento inclusivo
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Encontre médicos, dentistas, psicólogos e terapeutas com consultórios adaptados e capacitação comprovada para atender pessoas com deficiência.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <section aria-label="Filtros de Profissionais" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="specialty-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Especialidade
            </label>
            <select
              id="specialty-select"
              value={searchEspecialidade}
              onChange={(e) => setSearchEspecialidade(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-600"
            >
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Foco de Atendimento Adaptado
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedDisability('todas')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedDisability === 'todas'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {(['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'] as DisabilityType[]).map((t) => (
                <DisabilityBadge
                  key={t}
                  type={t}
                  size="sm"
                  active={selectedDisability === t}
                  onClick={() => setSelectedDisability(t)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Profissionais */}
      <div role="status" aria-live="polite" className="text-sm font-bold text-slate-600 mb-4">
        {isLoading ? (
          <span>Carregando profissionais...</span>
        ) : (
          <span>
            {professionals.length} {professionals.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {professionals.map((prof) => {
          const textToRead = `${prof.nome}, ${prof.especialidade}. Registro: ${prof.registro_profissional || 'Informado'}. Cidade: ${prof.cidade}. ${prof.descricao}`;

          return (
            <article
              key={prof.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={prof.foto_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                    alt={`Foto de ${prof.nome}`}
                    className="w-18 h-18 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      {prof.nome}
                    </h2>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      {prof.especialidade}
                    </p>
                    {prof.registro_profissional && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-1">
                        <Award size={12} />
                        <span>{prof.registro_profissional}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {prof.descricao}
                </p>

                {/* Tipos Atendidos */}
                <div className="mb-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Atendimento Adaptado para:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {prof.atende_por_tipo.map((t) => (
                      <DisabilityBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <AudioReaderButton textToRead={textToRead} label="Ouvir perfil" size="sm" />

                <div className="flex items-center gap-2">
                  {prof.whatsapp && (
                    <a
                      href={`https://wa.me/55${prof.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                      aria-label={`Conversar com ${prof.nome} no WhatsApp`}
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {prof.telefone && (
                    <a
                      href={`tel:${prof.telefone.replace(/\D/g, '')}`}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      aria-label={`Ligar para ${prof.nome}`}
                    >
                      <Phone size={14} />
                      <span>Ligar</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
