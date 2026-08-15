import React from 'react';
import { DisabilityType } from '../types';
import { Accessibility, Eye, Ear, Brain, HeartPulse } from 'lucide-react';

interface DisabilityBadgeProps {
  type: DisabilityType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export const DISABILITY_INFO: Record<
  DisabilityType,
  { label: string; shortLabel: string; description: string; icon: React.ElementType; color: string; activeBg: string }
> = {
  mobilidade: {
    label: 'Mobilidade Reduzida / Cadeirante',
    shortLabel: 'Mobilidade',
    description: 'Rampas, elevadores, portas largas, banheiros adaptados',
    icon: Accessibility,
    color: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
    activeBg: 'bg-blue-600 text-white border-blue-700 shadow-md',
  },
  visual: {
    label: 'Deficiência Visual / Baixa Visão',
    shortLabel: 'Visual',
    description: 'Piso tátil, Braille, audiodescrição, cão-guia aceito',
    icon: Eye,
    color: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100',
    activeBg: 'bg-amber-600 text-white border-amber-700 shadow-md',
  },
  auditiva: {
    label: 'Deficiência Auditiva / Libras',
    shortLabel: 'Auditiva',
    description: 'Atendimento em Libras, alertas visuais, suporte por texto',
    icon: Ear,
    color: 'text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100',
    activeBg: 'bg-purple-600 text-white border-purple-700 shadow-md',
  },
  intelectual: {
    label: 'Intelectual / Neurodivergência / TEA',
    shortLabel: 'Intelectual / TEA',
    description: 'Linguagem simples, baixo ruído sensorial, equipe acolhedora',
    icon: Brain,
    color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    activeBg: 'bg-emerald-600 text-white border-emerald-700 shadow-md',
  },
  invisivel: {
    label: 'Deficiência Invisível / Doença Crônica',
    shortLabel: 'Invisível / Crônica',
    description: 'Cordão de Girassol aceito, assento e fila prioritária sem constrangimento',
    icon: HeartPulse,
    color: 'text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100',
    activeBg: 'bg-rose-600 text-white border-rose-700 shadow-md',
  },
};

export const DisabilityBadge: React.FC<DisabilityBadgeProps> = ({
  type,
  size = 'md',
  showLabel = true,
  active = false,
  onClick,
}) => {
  const info = DISABILITY_INFO[type];
  if (!info) return null;

  const Icon = info.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3.5 py-1.5 text-base gap-2 font-medium',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const baseStyle = `inline-flex items-center rounded-full border transition-all duration-150 font-medium ${
    sizeClasses[size]
  } ${active ? info.activeBg : info.color} ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2' : ''}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={`${info.label}: ${active ? 'Filtro ativado' : 'Filtro desativado'}`}
        className={baseStyle}
        title={info.description}
      >
        <Icon size={iconSizes[size]} aria-hidden="true" />
        {showLabel && <span>{info.shortLabel}</span>}
      </button>
    );
  }

  return (
    <span className={baseStyle} title={info.description}>
      <Icon size={iconSizes[size]} aria-hidden="true" />
      {showLabel && <span>{info.shortLabel}</span>}
      <span className="sr-only">({info.label})</span>
    </span>
  );
};
