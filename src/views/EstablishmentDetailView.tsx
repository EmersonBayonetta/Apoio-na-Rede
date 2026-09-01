import React, { useState, useEffect } from 'react';
import { Establishment, DisabilityType } from '../types';
import { StorageService } from '../services/storageService';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Globe,
  Star,
  Sparkles,
  Share2,
  Flag,
  Send,
  CheckCircle,
  Mail,
  Key,
  ShieldCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { DisabilityBadge, DISABILITY_INFO } from '../components/DisabilityBadge';
import { AccessibilityChecklist } from '../components/AccessibilityChecklist';
import { AudioReaderButton } from '../components/AudioReaderButton';

import { sendValidationEmailResend } from '../services/emailService';

const USER_PROFILE_KEY = 'apoio_user_profile_v1';
const MIN_COMMENT_CHARS = 15;
const MAX_COMMENT_CHARS = 250;

interface EstablishmentDetailViewProps {
  establishment: Establishment;
  onBack: () => void;
  onRefresh: () => void;
}

export const EstablishmentDetailView: React.FC<EstablishmentDetailViewProps> = ({
  establishment,
  onBack,
  onRefresh,
}) => {
  const { accessibilityPreferences } = useAccessibility();
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<DisabilityType | 'todas'>('todas');

  // Form de Cadastro & Verificação por Token
  const [userName, setUserName] = useState('');
  const [userSurname, setUserSurname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [isTokenSent, setIsTokenSent] = useState(false);
  const [isSendingTokenEmail, setIsSendingTokenEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenNoticeMsg, setTokenNoticeMsg] = useState('');

  // Form de Avaliação
  const [newRating, setNewRating] = useState(5);
  const [newDisability, setNewDisability] = useState<DisabilityType>(
    accessibilityPreferences[0] || 'mobilidade'
  );
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Carregar usuário verificado salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nome && parsed.sobrenome && parsed.email && parsed.verified) {
          setUserName(parsed.nome);
          setUserSurname(parsed.sobrenome);
          setUserEmail(parsed.email);
          setIsEmailVerified(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const reviews = establishment.reviews || [];
  const criteria = establishment.criteria || [];

  const filteredReviews = reviews.filter((r) =>
    reviewFilter === 'todas' ? true : r.tipo_deficiencia_avaliada === reviewFilter
  );

  const photos =
    establishment.fotos && establishment.fotos.length > 0
      ? establishment.fotos
      : ['/brand/apoio-na-rede-logo.png'];

  // Enviar Token por E-mail (Resend API)
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    if (!userName.trim() || !userSurname.trim() || !userEmail.trim()) {
      setTokenError('Por favor, informe seu Nome, Sobrenome e E-mail.');
      return;
    }

    if (!userEmail.includes('@') || !userEmail.includes('.')) {
      setTokenError('Insira um endereço de e-mail válido.');
      return;
    }

    setIsSendingTokenEmail(true);

    // Gerar token aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedToken(code);

    const result = await sendValidationEmailResend({
      emailUsuario: userEmail.trim(),
      nomeUsuario: `${userName.trim()} ${userSurname.trim()}`,
      tokenGerado: code,
    });

    setIsSendingTokenEmail(false);
    setIsTokenSent(true);

    if (result.success) {
      setTokenNoticeMsg(`Enviamos um e-mail de verificação com um código de 6 dígitos para ${userEmail}. Por favor, verifique sua caixa de entrada (ou spam) e digite o código abaixo.`);
    } else {
      setTokenError(`Falha ao enviar e-mail: ${result.error}. Tente novamente.`);
    }
  };

  // Validar Token
  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    if (inputToken.trim() === generatedToken) {
      setIsEmailVerified(true);
      setTokenNoticeMsg('');
      // Salva perfil verificado para facilitar próximos comentários
      localStorage.setItem(
        USER_PROFILE_KEY,
        JSON.stringify({
          nome: userName.trim(),
          sobrenome: userSurname.trim(),
          email: userEmail.trim(),
          verified: true,
        })
      );
    } else {
      setTokenError('Token de validação incorreto. Verifique os dígitos e tente novamente.');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanComment = newComment.trim();
    if (!cleanComment) return;

    if (!isEmailVerified) {
      setTokenError('É necessário cadastrar e validar seu e-mail com o token antes de comentar.');
      return;
    }

    if (cleanComment.length < MIN_COMMENT_CHARS) {
      alert(`Seu comentário precisa ter pelo menos ${MIN_COMMENT_CHARS} caracteres.`);
      return;
    }

    if (cleanComment.length > MAX_COMMENT_CHARS) {
      alert(`Seu comentário pode ter no máximo ${MAX_COMMENT_CHARS} caracteres.`);
      return;
    }

    setIsSubmittingReview(true);
    try {
      const fullUserNome = `${userName.trim()} ${userSurname.trim()}`;
      await StorageService.addReview({
        establishment_id: establishment.id,
        user_nome: fullUserNome,
        tipo_deficiencia_avaliada: newDisability,
        nota: newRating,
        comentario: cleanComment,
      });

      setNewComment('');
      setReviewSuccessMsg(true);
      setTimeout(() => setReviewSuccessMsg(false), 5000);
      onRefresh();
    } catch (err) {
      console.error('Erro ao adicionar avaliação:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    const motivo = prompt('Por favor, informe o motivo da denúncia desta avaliação:');
    if (motivo) {
      await StorageService.reportReview(reviewId, motivo);
      setActionMessage('Denúncia registrada para revisão.');
      onRefresh();
    }
  };

  const fullTextToRead = `${establishment.nome}. Categoria: ${establishment.categoria}. Endereço: ${establishment.endereco}, ${establishment.cidade}. Descrição: ${establishment.descricao}. Horário de funcionamento: ${establishment.horario_funcionamento || 'Não informado'}.`;

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-slate-800">
      {/* Botão Voltar & Ações de Topo */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Voltar para a lista e mapa de estabelecimentos"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Voltar ao Catálogo</span>
        </button>

        <div className="flex items-center gap-2">
          <AudioReaderButton textToRead={fullTextToRead} label="Ouvir Informações do Local" />
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: establishment.nome,
                  text: `Confira as informações de acessibilidade de ${establishment.nome} no Apoio na Rede`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href).then(() => setActionMessage('Link copiado.'));
              }
            }}
            className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl transition-colors"
            title="Compartilhar local"
            aria-label="Compartilhar local"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {actionMessage && <p role="status" aria-live="polite" className="mb-4 text-sm font-semibold text-blue-800">{actionMessage}</p>}

      {/* Hero: Cabeçalho com Título, Avaliação e Badges */}
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full uppercase tracking-wider border border-blue-200">
              {establishment.categoria.replace('_', ' ')}
            </span>
            <VerifiedBadge
              status={establishment.status}
              verificadoEm={establishment.verificado_em}
              motivoRejeicao={establishment.motivo_rejeicao}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-amber-900 font-black text-sm">
            <Star size={18} className="fill-amber-400 text-amber-500" aria-hidden="true" />
            <span>{establishment.nota_media}</span>
            <span className="text-xs text-amber-700 font-semibold">
              ({establishment.total_avaliacoes} {establishment.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
          {establishment.nome}
        </h1>

        <div className="flex items-start gap-2 text-slate-600 text-sm mb-4">
          <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {establishment.endereco} - {establishment.bairro ? `${establishment.bairro}, ` : ''}
            {establishment.cidade}, {establishment.estado}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${establishment.nome} ${establishment.endereco} ${establishment.cidade}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 font-bold hover:underline ml-2 text-xs"
          >
            Abrir rotas no Google Maps ↗
          </a>
        </div>

        <p className="text-base text-slate-700 leading-relaxed max-w-3xl">
          {establishment.descricao}
        </p>
      </header>

      {/* Galeria de Fotos Acessível */}
      <section aria-label="Fotos do Estabelecimento" className="mb-8">
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
          <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-100 relative mb-3">
            <img
              src={photos[selectedPhotoIdx]}
              alt={`Foto principal de ${establishment.nome} mostrando entrada e instalações adaptadas`}
              className="w-full h-full object-cover transition-all"
            />
          </div>

          {photos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  aria-label={`Ver foto ${idx + 1} de ${photos.length}`}
                  className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedPhotoIdx === idx
                      ? 'border-blue-600 ring-2 ring-blue-400'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Layout Grid: Informações Práticas + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Coluna Esquerda: Informações de Contato e Horários */}
        <aside className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Informações de Contato & Horários
            </h2>

            <div className="space-y-4 text-sm">
              {establishment.horario_funcionamento && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Funcionamento</div>
                    <div className="text-slate-800 font-semibold">{establishment.horario_funcionamento}</div>
                  </div>
                </div>
              )}

              {establishment.telefone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Telefone</div>
                    <a
                      href={`tel:${establishment.telefone.replace(/\D/g, '')}`}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      {establishment.telefone}
                    </a>
                  </div>
                </div>
              )}

              {establishment.whatsapp && (
                <div className="flex items-start gap-3">
                  <MessageCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">WhatsApp (Suporte Acessível)</div>
                    <a
                      href={`https://wa.me/55${establishment.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      {establishment.whatsapp} ↗
                    </a>
                  </div>
                </div>
              )}

              {establishment.website && (
                <div className="flex items-start gap-3">
                  <Globe size={18} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Site Oficial</div>
                    <a
                      href={establishment.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-bold hover:underline truncate block max-w-[200px]"
                    >
                      {establishment.website} ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Coluna Direita: Checklist de Critérios de Acessibilidade */}
        <div className="lg:col-span-2">
          <AccessibilityChecklist criteria={criteria} />
        </div>
      </div>

      {/* Seção de Avaliações da Comunidade */}
      <section aria-labelledby="reviews-heading" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 id="reviews-heading" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Star size={24} className="fill-amber-400 text-amber-500" aria-hidden="true" />
              Avaliações da Comunidade PCD
            </h2>
            <p className="text-xs text-slate-500">
              Relatos reais de quem experimentou a acessibilidade deste local
            </p>
          </div>

          {/* Filtro de avaliações por tipo de deficiência */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Filtrar por:</span>
            <button
              type="button"
              onClick={() => setReviewFilter('todas')}
              aria-pressed={reviewFilter === 'todas'}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                reviewFilter === 'todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({reviews.length})
            </button>
            {(['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel', 'outro'] as DisabilityType[]).map((type) => (
              <DisabilityBadge
                key={type}
                type={type}
                size="sm"
                active={reviewFilter === type}
                onClick={() => setReviewFilter(type)}
              />
            ))}
          </div>
        </div>

        {/* Lista de Avaliações */}
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-sm mb-8">
            Nenhuma avaliação encontrada para o filtro selecionado. Seja a primeira pessoa a avaliar!
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 transition-all hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-sm text-slate-900">{rev.user_nome}</div>
                    <DisabilityBadge type={rev.tipo_deficiencia_avaliada} size="sm" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < rev.nota ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{rev.data}</span>

                    <button
                      type="button"
                      onClick={() => handleReportReview(rev.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Denunciar avaliação abusiva ou falsa"
                      aria-label="Denunciar avaliação"
                    >
                      <Flag size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{rev.comentario}</p>
              </div>
            ))}
          </div>
        )}

        {/* Formulário: Adicionar Avaliação com Cadastro e Token */}
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles size={20} className="text-blue-700" aria-hidden="true" />
            <h3 className="text-lg font-black text-slate-900">
              Compartilhe sua experiência de acessibilidade
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            Para garantir avaliações autênticas e confiáveis, cadastre seu <strong>Nome, Sobrenome e E-mail</strong> para receber e validar seu token de segurança.
          </p>

          {reviewSuccessMsg && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-3 text-sm font-bold animate-fadeIn">
              <CheckCircle size={20} className="text-emerald-700 shrink-0" />
              <span>Avaliação verificada e enviada com sucesso! Obrigado por fortalecer a acessibilidade comunitária.</span>
            </div>
          )}

          {/* Etapa 1: Cadastro de Usuário e Validação de Token de E-mail */}
          {!isEmailVerified ? (
            <div className="bg-white rounded-2xl p-5 border border-blue-950/10 mb-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-950 tracking-wider pb-2 border-b border-slate-100">
                <ShieldCheck size={16} className="text-blue-700" />
                <span>Passo 1: Identificação & Validação de E-mail por Token</span>
              </div>

              {tokenError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{tokenError}</span>
                </div>
              )}

              {!isTokenSent ? (
                <form onSubmit={handleRequestToken} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="user-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nome *
                      </label>
                      <input
                        id="user-name-input"
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Ex: Carlos"
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="user-surname-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Sobrenome *
                      </label>
                      <input
                        id="user-surname-input"
                        type="text"
                        required
                        value={userSurname}
                        onChange={(e) => setUserSurname(e.target.value)}
                        placeholder="Ex: Oliveira"
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="user-email-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      E-mail para Receber Token *
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="user-email-input"
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSendingTokenEmail}
                      className={`flex-1 py-3 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 ${
                        isSendingTokenEmail
                          ? 'bg-blue-800 cursor-wait opacity-80'
                          : 'bg-blue-900 hover:bg-blue-950 cursor-pointer'
                      }`}
                    >
                      <Key size={16} aria-hidden="true" />
                      <span>
                        {isSendingTokenEmail
                          ? 'Enviando E-mail via Resend...'
                          : 'Gerar & Enviar Token de Verificação por E-mail'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserName('');
                        setUserSurname('');
                        setUserEmail('');
                        setTokenError('');
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyToken} className="space-y-4 animate-fadeIn">
                  {tokenNoticeMsg && (
                    <div className="p-3.5 rounded-xl bg-blue-50 text-blue-950 border border-blue-200 text-xs font-medium leading-relaxed">
                      <strong className="block text-blue-900 font-bold mb-1">📬 Token enviado por e-mail!</strong>
                      <span>{tokenNoticeMsg}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="token-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Digite o Token de 6 Dígitos *
                    </label>
                    <div className="relative">
                      <Key size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="token-input"
                        type="text"
                        maxLength={6}
                        required
                        value={inputToken}
                        onChange={(e) => setInputToken(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 849201"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black tracking-widest text-blue-950 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserCheck size={16} aria-hidden="true" />
                      <span>Validar Token e Autorizar Comentário</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setIsTokenSent(false); setInputToken(''); }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Alterar E-mail
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTokenSent(false);
                        setGeneratedToken(null);
                        setInputToken('');
                        setTokenError('');
                        setTokenNoticeMsg('');
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <UserCheck size={20} className="text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider block">
                    Identidade Verificada por E-mail ✓
                  </span>
                  <span className="text-xs font-medium text-emerald-800">
                    Avaliando como: <strong>{userName} {userSurname}</strong> ({userEmail})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmailVerified(false)}
                className="text-xs font-bold text-emerald-900 hover:underline cursor-pointer"
              >
                Alterar Usuário
              </button>
            </div>
          )}

          {/* Etapa 2: Formulário da Avaliação (Liberado somente após verificação de e-mail) */}
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Qual acessibilidade você avaliou?
                </label>
                <select
                  value={newDisability}
                  onChange={(e) => setNewDisability(e.target.value as DisabilityType)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                >
                  {(['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel', 'outro'] as DisabilityType[]).map((t) => (
                    <option key={t} value={t}>
                      {DISABILITY_INFO[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sua Nota (1 a 5 estrelas)
                </label>
                <div className="flex items-center gap-1 py-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                      aria-label={`Avaliar com ${star} estrelas`}
                    >
                      <Star
                        size={24}
                        className={star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-600 ml-2">{newRating} de 5</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="review-comment" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Seu Relato Detalhado de Acessibilidade *
                </label>
                <span className={`text-xs font-bold ${
                  newComment.trim().length < MIN_COMMENT_CHARS
                    ? 'text-amber-700'
                    : newComment.trim().length > MAX_COMMENT_CHARS
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}>
                  {newComment.trim().length} / {MAX_COMMENT_CHARS} caracteres
                </span>
              </div>

              <textarea
                id="review-comment"
                rows={4}
                required
                maxLength={MAX_COMMENT_CHARS}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Exemplo: Fui ao consultório do Dr. José Silva usando cadeira de rodas motorizada. A sala é super ampla com fácil circulação, e o elevador do prédio comercial atendeu perfeitamente..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
              />

              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Recomendação: Mínimo {MIN_COMMENT_CHARS} caracteres e máximo {MAX_COMMENT_CHARS} caracteres.</span>
                {newComment.trim().length > 0 && newComment.trim().length < MIN_COMMENT_CHARS && (
                  <span className="text-amber-700 font-semibold">Faltam {MIN_COMMENT_CHARS - newComment.trim().length} caracteres</span>
                )}
                {newComment.trim().length >= MIN_COMMENT_CHARS && (
                  <span className="text-emerald-700 font-bold">✓ Tamanho ideal</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!isEmailVerified || newComment.trim().length < MIN_COMMENT_CHARS || newComment.trim().length > MAX_COMMENT_CHARS || isSubmittingReview}
                className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isEmailVerified || newComment.trim().length < MIN_COMMENT_CHARS || newComment.trim().length > MAX_COMMENT_CHARS
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                <Send size={16} aria-hidden="true" />
                <span>
                  {!isEmailVerified
                    ? 'Valide o E-mail com Token no Passo 1 para Publicar'
                    : newComment.trim().length < MIN_COMMENT_CHARS
                    ? `Escreva pelo menos ${MIN_COMMENT_CHARS} caracteres`
                    : isSubmittingReview
                    ? 'Enviando avaliação...'
                    : 'Publicar Avaliação Verificada'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewComment('');
                  setNewRating(5);
                  setNewDisability(accessibilityPreferences[0] || 'mobilidade');
                }}
                className="w-full sm:w-auto px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>
    </article>
  );
};
