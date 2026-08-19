import React from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Scale,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { UnidadeMedida, TipoUnidade } from '../../../core/types.ts';
import { TipoBadge } from '../../../shared/components/Badge.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { Pagination } from '../../../shared/components/Pagination.tsx';
import { EmptyState, ErrorState, TableLoadingSkeleton } from '../../../shared/components/EmptyState.tsx';

interface ListProps {
  unidades: UnidadeMedida[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  tipoFilter: string;
  sortBy: 'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onTipoFilterChange: (value: string) => void;
  onSortChange: (column: 'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNew: () => void;
  onEdit: (unidade: UnidadeMedida) => void;
  onDelete: (unidade: UnidadeMedida) => void;
  onRefresh: () => void;
}

const TIPO_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos os Tipos' },
  { value: 'Massa', label: 'Massa' },
  { value: 'Volume', label: 'Volume' },
  { value: 'Comprimento', label: 'Comprimento' },
  { value: 'Unidade', label: 'Unidade' },
];

export const UnidadeMedidaList: React.FC<ListProps> = ({
  unidades,
  total,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  error,
  searchTerm,
  tipoFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onTipoFilterChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onNew,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const isFilterActive = Boolean(searchTerm.trim() || (tipoFilter && tipoFilter !== 'todos'));

  const renderSortIcon = (column: 'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Unidades de Medida</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {total} {total === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie os padrões de pesagem, volume, comprimento e contagem utilizados na produção artesanal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            aria-label="Atualizar lista"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search text input */}
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="!py-1.5 text-xs"
            />
          </div>

          {/* Tipo Filter Select */}
          <div className="w-full sm:w-52 shrink-0 flex items-center gap-2">
            <div className="relative w-full">
              <select
                value={tipoFilter}
                onChange={(e) => onTipoFilterChange(e.target.value)}
                aria-label="Filtrar por tipo"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-400"
              >
                {TIPO_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  onTipoFilterChange('todos');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / Content Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={onRefresh} />
        ) : isLoading && unidades.length === 0 ? (
          <TableLoadingSkeleton rows={5} />
        ) : unidades.length === 0 ? (
          <EmptyState
            isFilterActive={isFilterActive}
            onClearFilter={() => {
              onSearchChange('');
              onTipoFilterChange('todos');
            }}
            onAction={onNew}
          />
        ) : (
          <>
            {/* Desktop & Tablet Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    {/* ID */}
                    <th className="py-3 px-4 w-20">
                      <button
                        onClick={() => onSortChange('id')}
                        className="group flex items-center gap-1 cursor-pointer select-none"
                      >
                        <span>ID</span>
                        {renderSortIcon('id')}
                      </button>
                    </th>

                    {/* Nome */}
                    <th className="py-3 px-4">
                      <button
                        onClick={() => onSortChange('nome')}
                        className="group flex items-center gap-1 cursor-pointer select-none"
                      >
                        <span>Nome</span>
                        {renderSortIcon('nome')}
                      </button>
                    </th>

                    {/* Tipo */}
                    <th className="py-3 px-4 w-36">
                      <button
                        onClick={() => onSortChange('tipo')}
                        className="group flex items-center gap-1 cursor-pointer select-none"
                      >
                        <span>Tipo</span>
                        {renderSortIcon('tipo')}
                      </button>
                    </th>

                    {/* Fator Conversao */}
                    <th className="py-3 px-4 w-44 text-right">
                      <button
                        onClick={() => onSortChange('fatorConversao')}
                        className="group flex items-center justify-end gap-1 cursor-pointer select-none ml-auto"
                      >
                        <span>Fator de Conversão</span>
                        {renderSortIcon('fatorConversao')}
                      </button>
                    </th>

                    {/* Ações */}
                    <th className="py-3 px-4 w-28 text-center">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {unidades.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">
                        #{item.id}
                      </td>

                      {/* Nome */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.nome}</span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4">
                        <TipoBadge tipo={item.tipo} />
                      </td>

                      {/* Fator de Conversão */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                        {item.fatorConversao.toLocaleString('pt-BR', {
                          maximumFractionDigits: 6,
                        })}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEdit(item)}
                            title="Editar Unidade"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            aria-label={`Editar ${item.nome}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDelete(item)}
                            title="Excluir Unidade"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            aria-label={`Excluir ${item.nome}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </div>
    </div>
  );
};
