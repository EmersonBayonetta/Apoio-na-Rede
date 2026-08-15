import React, { useState, useEffect } from 'react';
import { Establishment, Review } from '../types';
import { StorageService } from '../services/storageService';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  Trash2,
  Check,
} from 'lucide-react';
import { DisabilityBadge } from '../components/DisabilityBadge';

interface AdminDashboardViewProps {
  onRefreshGlobal: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onRefreshGlobal }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'reports'>('pending');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allEst = await StorageService.getEstablishments();
      setEstablishments(allEst);

      const rawRev = localStorage.getItem('acessacidade_reviews');
      const allRev: Review[] = rawRev ? JSON.parse(rawRev) : [];
      setReviews(allRev);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingEstablishments = establishments.filter((e) => e.status === 'pendente');
  const reportedReviews = reviews.filter((r) => r.denunciada);

  const handleApproveEstablishment = async (id: string) => {
    if (confirm('Aprovar e conceder o Selo Verificado a este estabelecimento?')) {
      await StorageService.updateEstablishmentStatus(id, 'verificado');
      alert('Estabelecimento aprovado e publicado com o Selo Verificado!');
      loadData();
      onRefreshGlobal();
    }
  };

  const handleRejectEstablishment = async (id: string) => {
    const motivo = prompt('Informe o motivo da rejeição ou solicitação de ajustes:');
    if (motivo) {
      await StorageService.updateEstablishmentStatus(id, 'rejeitado', motivo);
      alert('Estabelecimento marcado para ajustes.');
      loadData();
      onRefreshGlobal();
    }
  };

  const handleDismissReport = async (reviewId: string) => {
    const rawRev = localStorage.getItem('acessacidade_reviews');
    if (rawRev) {
      const allRev: Review[] = JSON.parse(rawRev);
      const idx = allRev.findIndex((r) => r.id === reviewId);
      if (idx >= 0) {
        allRev[idx].denunciada = false;
        delete allRev[idx].motivo_denuncia;
        localStorage.setItem('acessacidade_reviews', JSON.stringify(allRev));
        loadData();
        onRefreshGlobal();
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta avaliação?')) {
      await StorageService.deleteReview(reviewId);
      alert('Avaliação removida.');
      loadData();
      onRefreshGlobal();
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Deseja restaurar todos os dados fictícios padrão da plataforma?')) {
      await StorageService.resetToDefaults();
      alert('Dados restaurados com sucesso!');
      loadData();
      onRefreshGlobal();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 animate-fadeIn">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-blue-300 text-xs font-bold mb-3 border border-slate-700">
            <ShieldCheck size={14} className="text-blue-400" aria-hidden="true" />
            <span>Painel de Moderação & Qualidade</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            Gestão de Conteúdo e Acessibilidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Valide cadastros de comerciantes e garanta a confiabilidade dos relatos da comunidade.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors"
        >
          <RotateCcw size={14} />
          <span>Restaurar Dados Mock</span>
        </button>
      </div>

      {/* Tabs de Moderação */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Locais Pendentes</span>
          <span className="px-2 py-0.5 bg-blue-900 text-white rounded-full text-[10px] font-black">
            {pendingEstablishments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Avaliações Denunciadas</span>
          <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
            {reportedReviews.length}
          </span>
        </button>
      </div>

      {/* Conteúdo: Estabelecimentos Pendentes */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingEstablishments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                Fila de moderação em dia!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Não há estabelecimentos aguardando validação no momento.
              </p>
            </div>
          ) : (
            pendingEstablishments.map((est) => (
              <div
                key={est.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between"
              >
                <div className="w-full md:w-48 h-36 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={est.fotos[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {est.categoria.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Aguardando Aprovação
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {est.nome}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                    <MapPin size={13} className="text-blue-600 shrink-0" />
                    <span>{est.endereco} - {est.cidade}</span>
                  </p>

                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                    {est.descricao}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {Array.from(
                      new Set(est.criteria?.filter((c) => c.presente).map((c) => c.tipo_deficiencia) || [])
                    ).map((t) => (
                      <DisabilityBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 w-full md:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveEstablishment(est.id)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check size={16} />
                    <span>Aprovar com Selo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectEstablishment(est.id)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={16} />
                    <span>Solicitar Ajuste</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Conteúdo: Avaliações Denunciadas */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportedReviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                Nenhuma denúncia pendente
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Todas as avaliações da comunidade estão em conformidade com as diretrizes.
              </p>
            </div>
          ) : (
            reportedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rev.user_nome}</span>
                    <DisabilityBadge type={rev.tipo_deficiencia_avaliada} size="sm" />
                  </div>
                  <span className="text-xs text-slate-400">{rev.data}</span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 mb-3">
                  ⚠️ <strong>Motivo da Denúncia:</strong> {rev.motivo_denuncia || 'Conteúdo considerado inverídico ou ofensivo'}
                </div>

                <p className="text-sm text-slate-700 italic mb-4">
                  "{rev.comentario}"
                </p>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDismissReport(rev.id)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Manter Avaliação (Descartar Denúncia)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Excluir Avaliação</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
