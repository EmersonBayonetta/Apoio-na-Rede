import React, { useState, useEffect } from 'react';
import { Establishment, FilterState, DisabilityType, EstablishmentCategory } from '../types';
import { StorageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { MapLeaflet } from '../components/MapLeaflet';
import { DisabilityBadge, DISABILITY_INFO } from '../components/DisabilityBadge';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { VoiceSearchButton } from '../components/VoiceSearchButton';
import { AudioReaderButton } from '../components/AudioReaderButton';
import {
  Search,
  Map,
  List,
  MapPin,
  Star,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ExplorerViewProps {
  onSelectEstablishment: (establishment: Establishment) => void;
}

const CATEGORIES: { id: EstablishmentCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas as Categorias' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'saude', label: 'Saúde & Clínicas' },
  { id: 'lazer_cultura', label: 'Lazer & Cultura' },
  { id: 'comercio_loja', label: 'Comércio & Lojas' },
  { id: 'servico_publico', label: 'Serviço Público' },
  { id: 'banheiro_adaptado', label: 'Banheiro Adaptado' },
  { id: 'hospedagem', label: 'Hospedagem' },
  { id: 'transporte_mobilidade', label: 'Transporte' },
];

export const ExplorerView: React.FC<ExplorerViewProps> = ({ onSelectEstablishment }) => {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EstablishmentCategory | 'todas'>('todas');
  const [selectedCity, setSelectedCity] = useState<string>('todas');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>(() => {
    return currentUser?.preferencias_acessibilidade || [];
  });

  // Atualizar quando o usuário trocar de perfil/preferências
  useEffect(() => {
    if (currentUser?.preferencias_acessibilidade && currentUser.preferencias_acessibilidade.length > 0) {
      setSelectedDisabilities(currentUser.preferencias_acessibilidade);
    }
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filters: Partial<FilterState> = {
        searchQuery,
        category: selectedCategory,
        city: selectedCity,
        onlyVerified,
        selectedDisabilities,
      };
      const list = await StorageService.getEstablishments(filters);
      setEstablishments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedCity, onlyVerified, selectedDisabilities]);

  const toggleDisabilityFilter = (type: DisabilityType) => {
    setSelectedDisabilities((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('todas');
    setSelectedCity('todas');
    setOnlyVerified(false);
    setSelectedDisabilities([]);
  };

  const disabilityKeys: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800">
      {/* Banner de Boas-Vindas Inclusivo */}
      <section aria-label="Apresentação da Plataforma" className="mb-6">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/80 text-blue-200 text-xs font-bold mb-3 border border-blue-400/30">
              <Sparkles size={14} className="text-yellow-300" aria-hidden="true" />
              <span>Acessibilidade Real e Transparente</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
              Encontre locais que realmente acolhem você
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed mb-4">
              Filtre por tipo específico de necessidade: rampas NBR 9050, piso tátil, atendimento em Libras, salas de regulação sensorial e respeito a deficiências invisíveis.
            </p>
          </div>
        </div>
      </section>

      {/* Seção de Busca e Filtros */}
      <section
        id="search-filter-section"
        aria-label="Filtros e Busca de Estabelecimentos"
        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6 space-y-5"
      >
        {/* Barra de Busca + Reconhecimento de Voz */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              id="main-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, bairro, recurso (ex: rampa, Libras, Braille)..."
              aria-label="Campo de busca de estabelecimentos acessíveis"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <VoiceSearchButton
            onTranscript={(text) => setSearchQuery(text)}
            className="sm:w-auto w-full py-3.5 px-4"
          />
        </div>

        {/* Chips de Filtros Multi-Seleção por Deficiência */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-blue-700" aria-hidden="true" />
              Filtrar por Necessidade Específica (Multi-seleção):
            </span>
            {selectedDisabilities.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDisabilities([])}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                Limpar necessidades
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {disabilityKeys.map((type) => {
              const isSelected = selectedDisabilities.includes(type);
              return (
                <DisabilityBadge
                  key={type}
                  type={type}
                  size="md"
                  active={isSelected}
                  onClick={() => toggleDisabilityFilter(type)}
                />
              );
            })}
          </div>
        </div>

        {/* Filtros Secundários: Categoria, Cidade, Verificados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label htmlFor="category-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Categoria
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as EstablishmentCategory | 'todas')}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Cidade
            </label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              <option value="todas">Todas as Cidades</option>
              <option value="São Paulo">São Paulo (SP)</option>
              <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
              <option value="Curitiba">Curitiba (PR)</option>
              <option value="Brasília">Brasília (DF)</option>
              <option value="Recife">Recife (PE)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2.5 p-2.5 w-full bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Apenas com Selo Verificado
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Barra de Status de Resultados e Alternador Mapa / Lista */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div role="status" aria-live="polite" className="text-sm font-bold text-slate-700">
          {isLoading ? (
            <span>Carregando estabelecimentos...</span>
          ) : (
            <span>
              Mostrando <strong>{establishments.length}</strong>{' '}
              {establishments.length === 1 ? 'local acessível' : 'locais acessíveis'}
              {searchQuery ? ` para "${searchQuery}"` : ''}
            </span>
          )}
        </div>

        {/* Alternador Obrigatório: Visual Mapa vs Lista Semântica */}
        <div
          role="radiogroup"
          aria-label="Modo de visualização"
          className="flex items-center bg-slate-200/80 p-1 rounded-2xl"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'map'}
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map size={16} aria-hidden="true" />
            <span>Mapa Interativo</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List size={16} aria-hidden="true" />
            <span>Lista Acessível (Leitor de Tela)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal: Mapa ou Lista */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Mapa Leaflet */}
          <div className="lg:col-span-2">
            <MapLeaflet
              establishments={establishments}
              selectedEstablishment={selectedEstablishment}
              onSelectEstablishment={(est) => {
                setSelectedEstablishment(est);
              }}
              heightClass="h-[560px]"
            />
          </div>

          {/* Coluna Lateral de Estabelecimento em Destaque */}
          <div className="space-y-4">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {selectedEstablishment ? 'Local Selecionado no Mapa' : 'Toque em um local para prévia'}
            </div>

            {selectedEstablishment ? (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
                <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={selectedEstablishment.fotos[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'}
                    alt={`Foto de ${selectedEstablishment.nome}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <VerifiedBadge status={selectedEstablishment.status} />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {selectedEstablishment.categoria.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedEstablishment.nome}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-blue-600 shrink-0" />
                    <span>{selectedEstablishment.endereco} - {selectedEstablishment.cidade}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3">
                  {selectedEstablishment.descricao}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set(
                      selectedEstablishment.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia) || []
                    )
                  ).map((t) => (
                    <DisabilityBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <AudioReaderButton
                    textToRead={`${selectedEstablishment.nome}. ${selectedEstablishment.descricao}`}
                    label="Ouvir"
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => onSelectEstablishment(selectedEstablishment)}
                    className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Ver Detalhes e Checklist</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-8 border border-dashed border-slate-300 text-center text-slate-500 text-sm">
                <MapPin size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-700">Selecione um ponto no mapa</p>
                <p className="text-xs text-slate-500 mt-1">
                  Ou alterne para o modo "Lista Acessível" para navegar com facilidade.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODO LISTA ACESSÍVEL (OTIMIZADO PARA LEITOR DE TELA) */
        <div id="main-content" className="space-y-4 mb-12">
          {establishments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-base font-bold text-slate-700 mb-2">
                Nenhum local atende a todos os critérios selecionados simultaneamente.
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Tente desmarcar alguns filtros ou buscar por outro termo.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                <RotateCcw size={14} />
                <span>Restaurar todos os filtros</span>
              </button>
            </div>
          ) : (
            establishments.map((est) => {
              const supportedTypes = Array.from(
                new Set(est.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia) || [])
              );
              const cardSummary = `${est.nome}, ${est.categoria}, localizado em ${est.endereco}, ${est.cidade}. Nota ${est.nota_media} com ${est.total_avaliacoes} avaliações. ${est.descricao}`;

              return (
                <article
                  key={est.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start justify-between"
                >
                  <div className="w-full md:w-56 h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={est.fotos[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'}
                      alt={`Foto de ${est.nome}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                        {est.categoria.replace('_', ' ')}
                      </span>
                      <VerifiedBadge status={est.status} />
                      <div className="flex items-center gap-1 text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-black">
                        <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" />
                        <span>{est.nota_media}</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      {est.nome}
                    </h2>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                      <MapPin size={14} className="text-blue-600 shrink-0" aria-hidden="true" />
                      <span>{est.endereco} - {est.bairro ? `${est.bairro}, ` : ''}{est.cidade} ({est.estado})</span>
                    </p>

                    <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {est.descricao}
                    </p>

                    {/* Badges de Deficiência Suportadas */}
                    <div className="flex flex-wrap gap-1.5">
                      {supportedTypes.map((t) => (
                        <DisabilityBadge key={t} type={t} size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                    <AudioReaderButton textToRead={cardSummary} label="Ouvir resumo" size="sm" />
                    <button
                      type="button"
                      onClick={() => onSelectEstablishment(est)}
                      className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-blue-600"
                      aria-label={`Ver detalhes completos e critérios de acessibilidade de ${est.nome}`}
                    >
                      <span>Ver Detalhes</span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
