import React from 'react';
import { Scale, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './Button.tsx';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isFilterActive?: boolean;
  onClearFilter?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhuma unidade cadastrada',
  description = 'Cadastre as unidades de medida para utilizar na pesagem, corte e precificação de insumos.',
  actionLabel = 'Nova Unidade',
  onAction,
  isFilterActive = false,
  onClearFilter,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3.5">
        <Scale className="w-6 h-6 stroke-[1.5]" />
      </div>

      <h3 className="text-base font-semibold text-slate-800 mb-1">
        {isFilterActive ? 'Nenhum resultado encontrado' : title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
        {isFilterActive
          ? 'Nenhum registro corresponde aos filtros selecionados. Tente ajustar o termo de pesquisa ou limpar os filtros.'
          : description}
      </p>

      <div className="flex items-center gap-2">
        {isFilterActive && onClearFilter && (
          <Button variant="secondary" size="sm" onClick={onClearFilter} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Limpar Filtros
          </Button>
        )}
        {onAction && (
          <Button variant="primary" size="sm" onClick={onAction} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Ocorreu um erro ao carregar as informações do servidor.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-50/50 rounded-xl border border-rose-200 my-4">
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900 mb-1">Falha na Comunicação</h3>
      <p className="text-xs text-rose-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};

export const TableLoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 w-1/3">
            <div className="w-8 h-4 bg-slate-200 rounded" />
            <div className="w-32 h-4 bg-slate-200 rounded" />
          </div>
          <div className="w-24 h-5 bg-slate-200 rounded-full" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-slate-200 rounded-lg" />
            <div className="w-7 h-7 bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};
