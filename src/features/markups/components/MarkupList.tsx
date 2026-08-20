import React from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Percent,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PowerOff,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Markup } from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { Pagination } from '../../../shared/components/Pagination.tsx';
import { EmptyState, ErrorState, TableLoadingSkeleton } from '../../../shared/components/EmptyState.tsx';

interface MarkupListProps {
  markups: Markup[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  sortBy: 'id' | 'nome' | 'fator' | 'ativo' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortChange: (column: 'id' | 'nome' | 'fator' | 'ativo' | 'createdAt') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNew: () => void;
  onEdit: (markup: Markup) => void;
  onToggleStatus: (markup: Markup) => void;
  onDelete: (markup: Markup) => void;
  onRefresh: () => void;
}

const STATUS_FILTER_OPTIONS = [
  { value: 'ativos', label: 'Somente Ativos' },
  { value: 'todos', label: 'Todos os Status' },
  { value: 'inativos', label: 'Somente Inativos' },
];

export const MarkupList: React.FC<MarkupListProps> = ({
  markups,
  total,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  error,
  searchTerm,
  statusFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onNew,
  onEdit,
  onToggleStatus,
  onDelete,
  onRefresh,
}) => {
  const isFilterActive = Boolean(searchTerm.trim() || (statusFilter && statusFilter !== 'ativos'));

  const renderSortIcon = (column: 'id' | 'nome' | 'fator' | 'ativo' | 'createdAt') => {
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-600" />
            Markups
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie os multiplicadores aplicados sobre os custos para cálculo do preço de venda sugerido
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            title="Atualizar lista de markups"
          >
            Atualizar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onNew}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Markup
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search by name */}
          <div className="flex-1 relative">
            <Input
              id="markup-search"
              placeholder="Buscar markup por nome..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56 shrink-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Filter className="w-4 h-4" />
              </div>
              <select
                id="markup-status-filter"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {isFilterActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSearchChange('');
                onStatusFilterChange('ativos');
              }}
              className="shrink-0 text-slate-600"
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Filter stats */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Filtrando por:</span>
            <span className="font-semibold text-slate-700">
              {statusFilter === 'ativos'
                ? 'Somente Ativos'
                : statusFilter === 'inativos'
                ? 'Somente Inativos'
                : 'Todos os Status'}
            </span>
          </div>
          <span>
            {total} {total === 1 ? 'registro encontrado' : 'registros encontrados'}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {error ? (
          <ErrorState
            title="Não foi possível carregar os markups"
            message={error}
            onRetry={onRefresh}
          />
        ) : isLoading ? (
          <TableLoadingSkeleton rows={4} />
        ) : markups.length === 0 ? (
          <EmptyState
            title={isFilterActive ? 'Nenhum markup encontrado' : 'Nenhum markup cadastrado'}
            description={
              isFilterActive
                ? 'Tente ajustar os termos da pesquisa ou alterar o filtro de status.'
                : 'Cadastre multiplicadores de markup para precificar seus produtos com base no custo total de produção.'
            }
            actionLabel={isFilterActive ? 'Limpar Filtros' : 'Novo Markup'}
            onAction={
              isFilterActive
                ? () => {
                    onSearchChange('');
                    onStatusFilterChange('ativos');
                  }
                : onNew
            }
            icon={<Percent className="w-8 h-8 text-indigo-500" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
                    <th className="py-3 px-4 w-16">
                      <button
                        type="button"
                        onClick={() => onSortChange('id')}
                        className="group flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <span>#</span>
                        {renderSortIcon('id')}
                      </button>
                    </th>

                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onSortChange('nome')}
                        className="group flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <span>Nome</span>
                        {renderSortIcon('nome')}
                      </button>
                    </th>

                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onSortChange('fator')}
                        className="group flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <span>Fator Multiplicador</span>
                        {renderSortIcon('fator')}
                      </button>
                    </th>

                    <th className="py-3 px-4 w-28">
                      <button
                        type="button"
                        onClick={() => onSortChange('ativo')}
                        className="group flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <span>Status</span>
                        {renderSortIcon('ativo')}
                      </button>
                    </th>

                    <th className="py-3 px-4 w-32 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {markups.map((item) => {
                    const numFator = Number(item.fator);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          !item.ativo ? 'bg-slate-50/30 text-slate-500' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 font-medium">
                          {item.id}
                        </td>

                        {/* Nome */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{item.nome}</span>
                            {!item.ativo && (
                              <span className="text-[10px] text-slate-400 font-normal italic">
                                (inativo)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Fator */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-xs">
                            {numFator.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                            x
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {item.ativo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Inativo
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar markup"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Ativar / Inativar */}
                            <button
                              type="button"
                              onClick={() => onToggleStatus(item)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                item.ativo
                                  ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={item.ativo ? 'Inativar markup' : 'Ativar markup'}
                            >
                              {item.ativo ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir markup"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={total}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </div>
    </div>
  );
};
