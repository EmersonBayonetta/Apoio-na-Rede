import { imageFallback } from '../utils/imageFallback';
import React, { useState } from 'react';
import { MAP_CATEGORIES } from '../data/mapCategories';
import { validCoordinates, validPhotoUrl, validUf, validateRegistration } from '../utils/registrationValidation';
import {
  EstablishmentCategory,
  DisabilityType,
  AccessibilityCriteria,
} from '../types';
import { ACCESSIBILITY_RESOURCES } from '../data/accessibilityResources';
import { PlacesService } from '../services/placesService';
import { locateAddress } from '../services/addressService';
import type { NearbyPlace } from '../types';
import { submitPublicRegistration } from '../services/publicRegistrationService';
import { splitBrazilianAddress } from '../utils/addressParts';
import { whatsappUrl } from '../utils/communityDirectory';

import { DISABILITY_INFO } from '../components/accessibility/DisabilityBadge';
import {
  Building2,
  MapPin,
  ListChecks,
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';

interface MerchantRegisterWizardProps {
  onSuccess: () => void;
}

type ResourceId = typeof ACCESSIBILITY_RESOURCES[number]['id'];
type Answer = { presente: boolean | null; observacao: string };

const DISABILITY_ORDER: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];
const MAX_PHOTOS = 10;
const phoneDigits = (value: string) => value.replace(/\D/g, '');

export const MerchantRegisterWizard: React.FC<MerchantRegisterWizardProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Dados Básicos
  const [linkedPlace, setLinkedPlace] = useState<NearbyPlace | null>(null);
  const [placeResults, setPlaceResults] = useState<NearbyPlace[]>([]);
  const [placeSearchStatus, setPlaceSearchStatus] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<EstablishmentCategory | ''>('');
  const [descricao, setDescricao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horario, setHorario] = useState('');

  // Step 2: Endereço & Ponto no mapa
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Cataguases');
  const [estado, setEstado] = useState('MG');
  const [cep, setCep] = useState('');
  // The card distance and walking route use this point, so it is never a default guess.
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locateStatus, setLocateStatus] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  // A place chosen in step 1 already has its address; step 2 only confirms it unless the user corrects it.
  const [editingAddress, setEditingAddress] = useState(false);

  // Step 3: Recursos de acessibilidade (os mesmos exibidos nos cards e na página do local)
  const [answers, setAnswers] = useState<Record<ResourceId, Answer>>(() =>
    Object.fromEntries(ACCESSIBILITY_RESOURCES.map(resource => [resource.id, { presente: null, observacao: '' }])) as Record<ResourceId, Answer>
  );

  // Step 4: Fotos
  const [fotos, setFotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const updateAnswer = (id: ResourceId, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: { ...prev[id], presente: value === 'sim' ? true : value === 'nao' ? false : null } }));
  };

  const updateObservacao = (id: ResourceId, observacao: string) => {
    setAnswers(prev => ({ ...prev, [id]: { ...prev[id], observacao } }));
  };

  // Changing the address moves the place, so the previous map point no longer applies.
  const changeLocation = (update: () => void) => {
    update();
    setLinkedPlace(null);
    setCoords(null);
    setLocateStatus('');
  };

  const linkPlace = (place: NearbyPlace) => {
    const parts = place.endereco === 'Endereço não informado' ? { endereco: '' } : splitBrazilianAddress(place.endereco);
    setLinkedPlace(place);
    setNome(place.nome);
    setCategoria(place.categoria);
    setEndereco(parts.endereco);
    setBairro(parts.bairro ?? '');
    if (parts.cidade) setCidade(parts.cidade);
    if (parts.estado) setEstado(parts.estado);
    setCep(parts.cep ?? '');
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    setLocateStatus('');
    setEditingAddress(false);
    setPlaceResults([]);
  };

  const handleLocate = async () => {
    if (!endereco.trim() || !cidade.trim()) {
      failField(2, 'est-end', 'Informe o endereço e a cidade para localizar no mapa.');
      return;
    }
    setLocateStatus('Localizando endereço…');
    try {
      const point = await locateAddress([endereco, bairro, `${cidade} - ${estado}`, cep].filter(value => value.trim()).join(', '));
      setCoords(point);
      setLocateStatus('Ponto encontrado. Confira no mapa antes de continuar.');
    } catch {
      setLocateStatus('Não encontramos este endereço no mapa. Confira rua e número ou informe as coordenadas abaixo.');
    }
  };

  const handleManualCoordinates = () => {
    const latitude = Number(manualLatitude.replace(',', '.'));
    const longitude = Number(manualLongitude.replace(',', '.'));
    if (!manualLatitude.trim() || !manualLongitude.trim() || !validCoordinates(latitude, longitude)) {
      failField(2, 'manual-latitude', 'Informe latitude e longitude válidas (ex.: -21.3924 e -42.6896).');
      return;
    }
    setCoords({ latitude, longitude });
    setLocateStatus('Coordenadas confirmadas.');
    setFormMessage('');
  };

  const handleAddPhoto = () => {
    if (fotos.length >= MAX_PHOTOS) {
      setFormMessage(`Envie no máximo ${MAX_PHOTOS} fotos.`);
      return;
    }
    if (!validPhotoUrl(newPhotoUrl.trim())) {
      setFormMessage('Informe uma URL de foto válida, começando com https:// ou http://.');
      document.getElementById('photo-url')?.focus();
      return;
    }
    setFormMessage('');
    setFotos((prev) => [...prev, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (idx: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUseAsCover = (idx: number) => {
    setFotos((prev) => [prev[idx], ...prev.filter((_, i) => i !== idx)]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateStep(1) || !validateStep(2) || !coords || !categoria) return;
    setIsSubmitting(true);

    try {
      // Unanswered resources are not sent: the place summary already shows them as "Não verificado".
      const criteriaList: Omit<AccessibilityCriteria, 'id' | 'establishment_id'>[] = ACCESSIBILITY_RESOURCES
        .filter(resource => answers[resource.id].presente !== null)
        .map(resource => ({
          tipo_deficiencia: resource.tipo,
          criterio: resource.legacy,
          presente: answers[resource.id].presente,
          recurso: resource.id,
          observacao_livre: answers[resource.id].presente ? answers[resource.id].observacao.trim() || undefined : undefined,
        }));

      const optional = (value: string) => value.trim() || undefined;
      const result = await submitPublicRegistration(
        {
          nome: nome.trim(),
          place_id: linkedPlace?.place_id,
          categoria,
          endereco: endereco.trim(),
          bairro: optional(bairro),
          cidade: cidade.trim(),
          estado,
          cep: optional(cep),
          latitude: coords.latitude,
          longitude: coords.longitude,
          descricao: descricao.trim(),
          fotos,
          telefone: optional(telefone),
          whatsapp: optional(whatsapp),
          horario_funcionamento: optional(horario),
        },
        criteriaList
      );

      setFormMessage(result.message);
      window.setTimeout(onSuccess, 5000);
    } catch (err) {
      console.error(err);
      setFormMessage(err instanceof Error ? err.message : 'Não foi possível salvar o cadastro. Revise os dados e tente novamente.');
      setIsSubmitting(false);
    }
  };

  const failField = (step: number, id: string, message: string) => {
    setCurrentStep(step);
    setFormMessage(message);
    window.setTimeout(() => document.getElementById(id)?.focus(), 0);
    return false;
  };
  const validateStep = (step: number) => {
    if (step === 1) {
      if (!nome.trim()) return failField(1, 'est-nome', 'Informe o nome do estabelecimento.');
      if (!categoria) return failField(1, 'est-categoria', 'Selecione a categoria do estabelecimento.');
      if (!descricao.trim()) return failField(1, 'est-desc', 'Informe a descrição do estabelecimento.');
      if (telefone.trim() && ![10, 11].includes(phoneDigits(telefone).length)) return failField(1, 'est-tel', 'Informe o telefone com DDD, por exemplo (32) 3421-0011.');
      if (whatsapp.trim() && !whatsappUrl(whatsapp)) return failField(1, 'est-zap', 'Informe o WhatsApp com DDD, por exemplo (32) 98765-4321.');
    }
    if (step === 2) {
      if (!endereco.trim()) return failField(2, 'est-end', 'Informe o endereço do estabelecimento.');
      if (!cidade.trim()) return failField(2, 'est-cidade', 'Informe a cidade.');
      if (!validUf(estado)) return failField(2, 'est-estado', 'Informe uma UF válida.');
      if (cep.trim() && !/^\d{5}-?\d{3}$/.test(cep.trim())) return failField(2, 'est-cep', 'Informe o CEP com 8 dígitos, por exemplo 36770-000.');
      if (!coords) return failField(2, 'locate-address', 'Localize o endereço no mapa ou informe as coordenadas do local.');
      try { validateRegistration({ nome, descricao, endereco, cidade, estado, latitude: coords.latitude, longitude: coords.longitude, fotos: [] }); }
      catch (error) { return failField(2, 'locate-address', (error as Error).message); }
    }
    setFormMessage('');
    return true;
  };

  const steps = [
    { number: 1, title: 'Dados Básicos', icon: Building2 },
    { number: 2, title: 'Endereço', icon: MapPin },
    { number: 3, title: 'Recursos de Acessibilidade', icon: ListChecks },
    { number: 4, title: 'Fotos & Envio', icon: Camera },
  ];

  const answered = (value: boolean | null) => ACCESSIBILITY_RESOURCES.filter(resource => answers[resource.id].presente === value);
  const confirmOnly = Boolean(linkedPlace && coords && endereco.trim() && !editingAddress);
  const fullAddress = [endereco.trim(), bairro.trim(), [cidade.trim(), estado].filter(Boolean).join(' - '), cep.trim()].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700 mb-2">Cadastro de local</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Cadastre um local
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Preencha apenas o que puder confirmar. O cadastro é revisado antes de aparecer no mapa.
        </p>
      </div>

      {/* Indicador de Progresso com ARIA */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-label={`Etapa ${currentStep} de 4: ${steps[currentStep - 1].title}`}
        className="mb-8"
      >
        <div className="grid grid-cols-4 gap-2 mb-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div
                key={step.number}
                className={`flex flex-col sm:flex-row items-center gap-2 p-3 rounded-2xl border text-center sm:text-left transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-2 ring-blue-400'
                    : isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-blue-700 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Etapa {step.number}
                  </div>
                  <div className="text-xs font-bold truncate">{step.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* ETAPA 1: DADOS BÁSICOS */}
        {currentStep === 1 && (
          <section aria-labelledby="step1-heading" className="space-y-5 animate-fadeIn">
            <h2 id="step1-heading" className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              Etapa 1: Informações Gerais do Estabelecimento
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="est-nome" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Estabelecimento *
                </label>
                <input
                  id="est-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Livraria & Café Acessível"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
                <button type="button" disabled={nome.trim().length < 3 || placeSearchStatus === 'Buscando locais…'} className="mt-2 rounded-xl border border-blue-700 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-50" onClick={async () => {
                  setPlaceSearchStatus('Buscando locais…');
                  setPlaceResults([]);
                  try {
                    const results = await PlacesService.search(nome);
                    setPlaceResults(results);
                    setPlaceSearchStatus(results.length ? 'Selecione o local correto para vincular o cadastro.' : 'Nenhum local encontrado. Você pode continuar com o cadastro manual.');
                  } catch { setPlaceSearchStatus('Não foi possível buscar no Google Maps. Tente novamente.'); }
                }}>Buscar este local no Google Maps</button>
                <p role="status" className="mt-2 text-xs text-slate-600">{linkedPlace ? `Vinculado a ${linkedPlace.nome}. Endereço, categoria e ponto no mapa foram preenchidos.` : placeSearchStatus}</p>
                <ul className="mt-2 space-y-2">{placeResults.map(place => <li key={place.id}><button type="button" className="w-full rounded-xl border border-slate-200 p-3 text-left text-xs hover:bg-blue-50" onClick={() => linkPlace(place)}><strong>{place.nome}</strong><span className="block">{place.endereco}</span></button></li>)}</ul>
                <p className="mt-2 text-xs text-slate-500">Comece buscando o local para preencher endereço, categoria e ponto no mapa. Se não encontrar, você pode cadastrar manualmente.</p>
              </div>

              <div>
                <label htmlFor="est-categoria" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoria *
                </label>
                <select
                  id="est-categoria"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as EstablishmentCategory | '')}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Selecione a categoria</option>
                  {Object.entries(MAP_CATEGORIES).map(([id, category]) => <option key={id} value={id}>{category.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="est-horario" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Horário de Funcionamento
                </label>
                <input
                  id="est-horario"
                  type="text"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex: Seg a Sáb: 08:00 às 20:00"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-tel" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Telefone de Contato
                </label>
                <input
                  id="est-tel"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (32) 3421-0011"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-zap" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  WhatsApp (Atendimento por Texto)
                </label>
                <input
                  id="est-zap"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: (32) 98765-4321"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="est-desc" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descrição do Local *
                </label>
                <textarea
                  id="est-desc"
                  rows={3}
                  required
                  aria-describedby="est-desc-hint"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Conte o que o local oferece, o tipo de atendimento e como é o ambiente..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
                <p id="est-desc-hint" className="mt-1 text-xs text-slate-500">Os recursos de acessibilidade são informados na Etapa 3.</p>
              </div>
            </div>
          </section>
        )}

        {/* ETAPA 2: ENDEREÇO & PONTO NO MAPA */}
        {currentStep === 2 && (
          <section aria-labelledby="step2-heading" className="space-y-5 animate-fadeIn">
            <h2 id="step2-heading" className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              {confirmOnly ? 'Etapa 2: Confirme o endereço' : 'Etapa 2: Endereço'}
            </h2>

            {confirmOnly && coords ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-emerald-800">Preenchido pelo local escolhido no Google Maps na Etapa 1.</p>
                <p className="font-semibold text-slate-900">{fullAddress}</p>
                <p className="text-xs text-slate-600">O ponto no mapa também foi definido. Ele é usado para a distância no card e a rota a pé.</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a className="text-xs font-semibold text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`}>Conferir ponto no Google Maps<span className="sr-only"> (abre em nova aba)</span></a>
                  <button type="button" onClick={() => setEditingAddress(true)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800">Corrigir endereço</button>
                </div>
              </div>
            ) : <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="est-end" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rua e Número *
                </label>
                <input
                  id="est-end"
                  type="text"
                  required
                  value={endereco}
                  onChange={(e) => changeLocation(() => setEndereco(e.target.value))}
                  placeholder="Ex.: Rua Major Vieira, 120"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-bairro" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bairro
                </label>
                <input
                  id="est-bairro"
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Ex: Centro"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-cidade" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cidade *
                </label>
                <input
                  id="est-cidade"
                  type="text"
                  required
                  value={cidade}
                  onChange={(e) => changeLocation(() => setCidade(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-estado" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Estado (UF) *
                </label>
                <input
                  id="est-estado"
                  type="text"
                  required
                  maxLength={2}
                  value={estado}
                  onChange={(e) => changeLocation(() => setEstado(e.target.value.toUpperCase()))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-cep" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  CEP
                </label>
                <input
                  id="est-cep"
                  type="text"
                  inputMode="numeric"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="36770-000"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Ponto no mapa *</h3>
              <p className="text-xs text-slate-600">Usado para mostrar a distância no card e traçar a rota a pé até o local.</p>
              {linkedPlace && coords
                ? <p className="text-xs font-semibold text-emerald-800">Definido pelo local vinculado no Google Maps.</p>
                : <button id="locate-address" type="button" onClick={() => void handleLocate()} disabled={locateStatus === 'Localizando endereço…'} className="rounded-xl border border-blue-700 bg-white px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-50">Localizar endereço no mapa</button>}
              {locateStatus && <p role="status" className="text-xs text-slate-700">{locateStatus}</p>}
              {coords && <a className="inline-block text-xs font-semibold text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`}>Conferir ponto no Google Maps<span className="sr-only"> (abre em nova aba)</span></a>}
              {!linkedPlace && (
                <details className="text-xs" open={locateStatus.startsWith('Não encontramos')}>
                  <summary className="cursor-pointer font-semibold text-slate-700">Informar coordenadas manualmente</summary>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <label className="grid gap-1">Latitude<input id="manual-latitude" inputMode="decimal" value={manualLatitude} onChange={e => setManualLatitude(e.target.value)} placeholder="-21.3924" className="p-2 bg-white border border-slate-300 rounded-lg" /></label>
                    <label className="grid gap-1">Longitude<input id="manual-longitude" inputMode="decimal" value={manualLongitude} onChange={e => setManualLongitude(e.target.value)} placeholder="-42.6896" className="p-2 bg-white border border-slate-300 rounded-lg" /></label>
                    <button type="button" onClick={handleManualCoordinates} className="rounded-lg bg-slate-900 px-3 py-2 font-bold text-white">Confirmar coordenadas</button>
                  </div>
                </details>
              )}
            </div>
            </>}
          </section>
        )}

        {/* ETAPA 3: RECURSOS DE ACESSIBILIDADE */}
        {currentStep === 3 && (
          <section aria-labelledby="step3-heading" className="space-y-6 animate-fadeIn">
            <div>
              <h2 id="step3-heading" className="text-xl font-bold text-slate-900 mb-1">
                Etapa 3: Recursos de Acessibilidade
              </h2>
              <p className="text-xs text-slate-500">
                Responda “Sim” ou “Não” apenas para o que puder confirmar. Deixe “Não verificado” quando não souber.
              </p>
            </div>

            {DISABILITY_ORDER.map(type => {
              const info = DISABILITY_INFO[type];
              const Icon = info.icon;
              const resources = ACCESSIBILITY_RESOURCES.filter(resource => resource.tipo === type);
              if (!resources.length) return null;
              return (
                <fieldset key={type} className="space-y-3">
                  <legend className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                    <Icon size={16} className="text-blue-700" aria-hidden="true" />
                    {info.label}
                  </legend>
                  {resources.map(resource => {
                    const idx = ACCESSIBILITY_RESOURCES.indexOf(resource);
                    const answer = answers[resource.id];
                    return (
                      <div
                        key={resource.id}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          answer.presente === true
                            ? 'border-blue-300 bg-blue-50/40'
                            : answer.presente === false
                            ? 'border-rose-200 bg-rose-50/40'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <select id={`crit-${idx}`} value={answer.presente === true ? 'sim' : answer.presente === false ? 'nao' : 'desconhecido'} onChange={event => updateAnswer(resource.id, event.target.value)} className="max-w-[135px] rounded-lg border border-slate-300 bg-white p-2 text-xs">
                            <option value="desconhecido">Não verificado</option><option value="sim">Sim</option><option value="nao">Não</option>
                          </select>
                          <div className="flex-1">
                            <label htmlFor={`crit-${idx}`} className="cursor-pointer block">
                              <span className="font-bold text-sm text-slate-900 block">{resource.label}</span>
                              <span className="text-xs text-slate-600 block mt-0.5">{resource.legacy}</span>
                            </label>

                            {answer.presente === true && (
                              <div className="mt-2.5">
                                <input
                                  type="text"
                                  aria-label={`Observação sobre ${resource.label}`}
                                  value={answer.observacao}
                                  onChange={(e) => updateObservacao(resource.id, e.target.value)}
                                  placeholder="Observação livre (ex: 'Rampa de 8% de inclinação', 'Equipe fez curso em 2024')..."
                                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </fieldset>
              );
            })}
          </section>
        )}

        {/* ETAPA 4: FOTOS & ENVIO */}
        {currentStep === 4 && (
          <section aria-labelledby="step4-heading" className="space-y-6 animate-fadeIn">
            <div>
              <h2 id="step4-heading" className="text-xl font-bold text-slate-900 mb-1">
                Etapa 4: Fotos & Confirmação Final
              </h2>
              <p className="text-xs text-slate-500">
                A primeira foto é a capa do card: prefira a fachada ou a entrada. Depois, mostre as adaptações (rampa, sanitário, etc.).
              </p>
            </div>

            <div>
              <label htmlFor="photo-url" className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Adicionar URL da Foto:
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  id="photo-url"
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto-do-local.jpg"
                  className="min-w-0 w-full flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={fotos.length >= MAX_PHOTOS}
                  className="px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Lista de Fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fotos.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative rounded-2xl overflow-hidden h-32 border border-slate-200 group">
                    <img onError={imageFallback} src={url} alt={idx === 0 ? 'Foto de capa' : `Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0
                      ? <span className="absolute left-2 top-2 rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-bold text-white">Capa</span>
                      : <button type="button" onClick={() => handleUseAsCover(idx)} className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-900">Usar como capa</button>}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                      aria-label={`Remover foto ${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo do Envio: mesmos dados exibidos no card e na página do local */}
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold text-sm">Resumo do Cadastro:</div>
              <div><strong>Nome:</strong> {nome || 'Não preenchido'}</div>
              <div><strong>Categoria:</strong> {categoria ? MAP_CATEGORIES[categoria].label : 'Não selecionada'}</div>
              <div><strong>Endereço:</strong> {fullAddress || 'Não preenchido'}</div>
              <div><strong>Ponto no mapa:</strong> {coords ? 'Definido' : 'Não definido'}</div>
              <div><strong>Horário:</strong> {horario.trim() || 'Não informado'}</div>
              <div><strong>Telefone:</strong> {telefone.trim() || 'Não informado'} · <strong>WhatsApp:</strong> {whatsapp.trim() || 'Não informado'}</div>
              <div><strong>Recursos:</strong> {answered(true).length} com “Sim”, {answered(false).length} com “Não”, {answered(null).length} não verificados</div>
              {answered(true).length > 0 && <div><strong>Disponíveis:</strong> {answered(true).map(resource => resource.label).join(', ')}</div>}
              <div><strong>Fotos:</strong> {fotos.length ? `${fotos.length} (a primeira é a capa)` : 'Nenhuma'}</div>
            </div>
          </section>
        )}

        {formMessage && <p role="status" aria-live="polite" className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-950">{formMessage}</p>}

        {/* Botões de Navegação entre Etapas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => { setFormMessage(''); setCurrentStep((prev) => prev - 1); }}
              className="px-5 py-3 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Etapa Anterior</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (!validateStep(currentStep)) return;
                setCurrentStep((prev) => prev + 1);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <span>Próxima Etapa</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>{isSubmitting ? 'Salvando...' : 'Enviar cadastro'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
