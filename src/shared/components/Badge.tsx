import React from 'react';
import { TipoUnidade } from '../../core/types.ts';

interface BadgeProps {
  tipo: TipoUnidade | string;
  className?: string;
}

export const TipoBadge: React.FC<BadgeProps> = ({ tipo, className = '' }) => {
  const getStyle = (t: string) => {
    switch (t) {
      case 'Massa':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10';
      case 'Volume':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10';
      case 'Comprimento':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10';
      case 'Unidade':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/10';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = (t: string) => {
    switch (t) {
      case 'Massa':
        return 'bg-emerald-500';
      case 'Volume':
        return 'bg-blue-500';
      case 'Comprimento':
        return 'bg-purple-500';
      case 'Unidade':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStyle(
        tipo
      )} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(tipo)}`} />
      {tipo}
    </span>
  );
};
