import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DisabilityType } from '../types';
import { DISABILITY_INFO } from './DisabilityBadge';
import { X, Check, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserPreferences } = useAuth();
  const [selected, setSelected] = useState<DisabilityType[]>(
    currentUser?.preferencias_acessibilidade || []
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleType = (type: DisabilityType) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserPreferences(selected);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const disabilityKeys: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pref-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          aria-label="Fechar janela de preferências"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
            <HeartHandshake size={28} aria-hidden="true" />
          </div>
          <div>
            <h2 id="pref-modal-title" className="text-xl font-bold text-slate-900">
              Suas Preferências de Acessibilidade
            </h2>
            <p className="text-xs text-slate-500">
              Personalize o AcessaCidade para destacar os locais que atendem você
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Selecione quais tipos de acessibilidade são essenciais para você ou seus familiares. Isso configurará seus filtros automáticos:
        </p>

        <div className="space-y-2.5 mb-6">
          {disabilityKeys.map((type) => {
            const info = DISABILITY_INFO[type];
            const Icon = info.icon;
            const isChecked = selected.includes(type);

            return (
              <button
                key={type}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggleType(type)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                    isChecked ? 'bg-blue-700 text-white' : 'border border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check size={14} strokeWidth={3} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Icon size={16} className={isChecked ? 'text-blue-700' : 'text-slate-500'} aria-hidden="true" />
                    <span>{info.label}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{info.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  );
};
