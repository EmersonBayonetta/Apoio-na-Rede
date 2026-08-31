import React, { useState } from 'react';
import {
  EstablishmentCategory,
  DisabilityType,
  AccessibilityCriteria,
} from '../types';
import { StorageService } from '../services/storageService';
import { MapLeaflet } from '../components/MapLeaflet';
import { DISABILITY_INFO } from '../components/DisabilityBadge';
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
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MerchantRegisterWizardProps {
  onSuccess: () => void;
}

const DEFAULT_CRITERIA_TEMPLATES: {
  tipo: DisabilityType;
  criterio: string;
  defaultChecked: boolean;
}[] = [
  // Mobilidade
  { tipo: 'mobilidade', criterio: 'Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)', defaultChecked: true },
  { tipo: 'mobilidade', criterio: 'Banheiro adaptado com barras de apoio e espaço de giro de 1,50m', defaultChecked: true },
  { tipo: 'mobilidade', criterio: 'Portas e corredores com largura mínima de 90cm', defaultChecked: true },
  { tipo: 'mobilidade', criterio: 'Vaga de estacionamento reservada e sinalizada em frente ao local', defaultChecked: false },
  { tipo: 'mobilidade', criterio: 'Mesas e balcões com altura acessível para cadeira de rodas', defaultChecked: false },

  // Visual
  { tipo: 'visual', criterio: 'Piso tátil direcional e de alerta desde o acesso externo', defaultChecked: true },
  { tipo: 'visual', criterio: 'Cardápio / Material em Braille e versão digital acessível por QR Code', defaultChecked: true },
  { tipo: 'visual', criterio: 'Cão-guia aceito com bebedouro e espaço seguro', defaultChecked: true },
  { tipo: 'visual', criterio: 'Sinalização em alto contraste e boa iluminação uniforme', defaultChecked: false },

  // Auditiva
  { tipo: 'auditiva', criterio: 'Atendentes capacitados em Libras (Língua Brasileira de Sinais)', defaultChecked: false },
  { tipo: 'auditiva', criterio: 'Atendimento e pedidos via WhatsApp / Mensagens de Texto', defaultChecked: true },
  { tipo: 'auditiva', criterio: 'Alertas e avisos visuais ou luminosos para chamadas e emergência', defaultChecked: false },

  // Intelectual / Neurodivergência
  { tipo: 'intelectual', criterio: 'Linguagem simples, sinalização pictográfica e fotos reais no cardápio', defaultChecked: true },
  { tipo: 'intelectual', criterio: 'Espaço com baixo ruído sonoro e iluminação suave (horário/sala silenciosa)', defaultChecked: false },
  { tipo: 'intelectual', criterio: 'Equipe treinada para acolhimento de pessoas autistas e neurodivergentes', defaultChecked: false },

  // Invisível / Doenças Crônicas
  { tipo: 'invisivel', criterio: 'Atendimento prioritário para portadores de Cordão de Girassol sem constrangimento', defaultChecked: true },
  { tipo: 'invisivel', criterio: 'Acesso rápido e facilitado aos sanitários', defaultChecked: true },
  { tipo: 'invisivel', criterio: 'Espaço confortável para descanso e hidratação', defaultChecked: false },
];

export const MerchantRegisterWizard: React.FC<MerchantRegisterWizardProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Dados Básicos
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<EstablishmentCategory>('alimentacao');
  const [descricao, setDescricao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horario, setHorario] = useState('Seg a Sáb: 08:00 às 20:00');
  const [website, setWebsite] = useState('');

  // Step 2: Endereço & Coordenadas
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('São Paulo');
  const [estado, setEstado] = useState('SP');
  const [cep, setCep] = useState('');
  const [latitude, setLatitude] = useState(-23.5614);
  const [longitude, setLongitude] = useState(-46.6559);

  // Step 3: Checklist de Critérios
  const [criteriaState, setCriteriaState] = useState<
    { tipo: DisabilityType; criterio: string; presente: boolean; observacao: string }[]
  >(() =>
    DEFAULT_CRITERIA_TEMPLATES.map((item) => ({
      tipo: item.tipo,
      criterio: item.criterio,
      presente: item.defaultChecked,
      observacao: '',
    }))
  );

  // Step 4: Fotos
  const [fotos, setFotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const toggleCriteriaPresent = (index: number) => {
    setCriteriaState((prev) =>
      prev.map((c, i) => (i === index ? { ...c, presente: !c.presente } : c))
    );
  };

  const updateCriteriaObservacao = (index: number, observacao: string) => {
    setCriteriaState((prev) =>
      prev.map((c, i) => (i === index ? { ...c, observacao } : c))
    );
  };

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      setFotos((prev) => [...prev, newPhotoUrl.trim()]);
      setNewPhotoUrl('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const criteriaList: Omit<AccessibilityCriteria, 'id' | 'establishment_id'>[] = criteriaState
        .filter((c) => c.presente)
        .map((c) => ({
          tipo_deficiencia: c.tipo,
          criterio: c.criterio,
          presente: true,
          observacao_livre: c.observacao || undefined,
        }));

      await StorageService.createEstablishment(
        {
          nome,
          categoria,
          endereco,
          bairro,
          cidade,
          estado,
          cep,
          latitude,
          longitude,
          descricao,
          fotos: fotos.length > 0 ? fotos : ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'],
          telefone,
          whatsapp,
          horario_funcionamento: horario,
          website,
        },
        criteriaList
      );

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      alert('Cadastro enviado com sucesso! O estabelecimento foi enviado para a fila de moderação e verificação.');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados Básicos', icon: Building2 },
    { number: 2, title: 'Localização & Mapa', icon: MapPin },
    { number: 3, title: 'Critérios de Acessibilidade', icon: ListChecks },
    { number: 4, title: 'Fotos & Envio', icon: Camera },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
          <Sparkles size={16} aria-hidden="true" />
          <span>Cadastro de Estabelecimento Acessível</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Cadastre seu Espaço Inclusivo
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Preencha o formulário em etapas guiadas. Detalhe com transparência quais recursos o seu local oferece.
        </p>
      </div>

      {/* Indicador de Progresso com ARIA */}
      <div
        role="progressbar"
        aria-valuenow={(currentStep / 4) * 100}
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
              </div>

              <div>
                <label htmlFor="est-categoria" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoria *
                </label>
                <select
                  id="est-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as EstablishmentCategory)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                >
                  <option value="alimentacao">Alimentação (Restaurante, Café, Bar)</option>
                  <option value="saude">Saúde & Clínicas</option>
                  <option value="lazer_cultura">Lazer & Cultura (Museu, Teatro, Cinema)</option>
                  <option value="comercio_loja">Comércio & Lojas</option>
                  <option value="servico_publico">Serviço Público / Cidadão</option>
                  <option value="banheiro_adaptado">Sanitário Adaptado Público</option>
                  <option value="hospedagem">Hotel / Pousada</option>
                  <option value="transporte_mobilidade">Transporte & Mobilidade</option>
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
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (11) 3255-0011"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="est-zap" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  WhatsApp (Atendimento por Texto)
                </label>
                <input
                  id="est-zap"
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="est-desc" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descrição Geral do Espaço e Ambiente *
                </label>
                <textarea
                  id="est-desc"
                  rows={3}
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva a estrutura, tipo de atendimento e os diferenciais de acessibilidade..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </section>
        )}

        {/* ETAPA 2: LOCALIZAÇÃO & PONTO NO MAPA */}
        {currentStep === 2 && (
          <section aria-labelledby="step2-heading" className="space-y-5 animate-fadeIn">
            <h2 id="step2-heading" className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              Etapa 2: Endereço e Ponto no Mapa
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="est-end" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Endereço Completo (Rua e Número) *
                </label>
                <input
                  id="est-end"
                  type="text"
                  required
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Av. Paulista, 1420"
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
                  placeholder="Ex: Bela Vista"
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
                  onChange={(e) => setCidade(e.target.value)}
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
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
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
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="01310-100"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ponto Exato no Mapa (Clique no mapa para posicionar o pin):
              </label>
              <div className="text-xs text-slate-500 mb-2">
                Latitude: <strong>{latitude.toFixed(5)}</strong> | Longitude: <strong>{longitude.toFixed(5)}</strong>
              </div>
              <MapLeaflet
                center={[latitude, longitude]}
                zoom={15}
                heightClass="h-72"
                interactivePointSelection={true}
                onPointSelected={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
            </div>
          </section>
        )}

        {/* ETAPA 3: CHECKLIST DE ACESSIBILIDADE */}
        {currentStep === 3 && (
          <section aria-labelledby="step3-heading" className="space-y-6 animate-fadeIn">
            <div>
              <h2 id="step3-heading" className="text-xl font-bold text-slate-900 mb-1">
                Etapa 3: Checklist Guiado de Acessibilidade
              </h2>
              <p className="text-xs text-slate-500">
                Marque os itens que o seu local realmente possui e adicione observações explicativas.
              </p>
            </div>

            <div className="space-y-4">
              {criteriaState.map((crit, idx) => {
                const info = DISABILITY_INFO[crit.tipo];
                const Icon = info.icon;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      crit.presente
                        ? 'border-blue-300 bg-blue-50/40'
                        : 'border-slate-200 bg-slate-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`crit-${idx}`}
                        checked={crit.presente}
                        onChange={() => toggleCriteriaPresent(idx)}
                        className="w-5 h-5 mt-0.5 text-blue-600 rounded-md focus:ring-blue-500 shrink-0"
                      />
                      <div className="flex-1">
                        <label htmlFor={`crit-${idx}`} className="font-bold text-sm text-slate-900 cursor-pointer block">
                          {crit.criterio}
                        </label>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Icon size={14} className="text-blue-700" />
                          <span>{info.label}</span>
                        </div>

                        {crit.presente && (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={crit.observacao}
                              onChange={(e) => updateCriteriaObservacao(idx, e.target.value)}
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
            </div>
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
                Adicione fotos que mostrem claramente as adaptações do local (entrada, rampa, sanitário, etc.).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Adicionar URL da Foto:
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto-do-local.jpg"
                  className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Lista de Fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fotos.map((url, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden h-32 border border-slate-200 group">
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                      aria-label="Remover foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo do Envio */}
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold text-sm">Resumo do Cadastro:</div>
              <div>🏢 <strong>Nome:</strong> {nome || 'Não preenchido'}</div>
              <div>📍 <strong>Endereço:</strong> {endereco}, {cidade} ({estado})</div>
              <div><strong>Critérios atendidos:</strong> {criteriaState.filter((c) => c.presente).length} itens marcados</div>
            </div>
          </section>
        )}

        {/* Botões de Navegação entre Etapas */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
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
                if (currentStep === 1 && !nome.trim()) {
                  alert('Por favor, informe o nome do estabelecimento.');
                  return;
                }
                if (currentStep === 2 && !endereco.trim()) {
                  alert('Por favor, informe o endereço do estabelecimento.');
                  return;
                }
                setCurrentStep((prev) => prev + 1);
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
              <span>{isSubmitting ? 'Salvando...' : 'Finalizar e Enviar para Moderação'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
