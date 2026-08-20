import React from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PowerOff,
  CheckCircle2,
  X,
  Eye,
  Layers,
} from 'lucide-react';
import { Produto, TipoProduto } from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { Select } from '../../../shared/components/Select.tsx';
import { Pagination } from '../../../shared/components/Pagination.tsx';
import { EmptyState, ErrorState, TableLoadingSkeleton } from '../../../shared/components/EmptyState.tsx';

interface ListProps {
  produtos: Produto[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  tipoProdutoFilter?: number;
  statusFilter: string;
  tiposProdutoList: TipoProduto[];
  sortBy: 'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'precoVenda' | 'ativo' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onTipoProdutoFilterChange: (value?: number) => void;
  onStatusFilterChange: (value: string) => void;
  onSortChange: (
    column: 'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'precoVenda' | 'ativo' | 'createdAt'
  ) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNew: () => void;
  onView: (produto: Produto) => void;
  onEdit: (produto: Produto) => void;
  onToggleStatus: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
  onRefresh: () => void;
}

const STATUS_FILTER_OPTIONS = [
  { value: 'ativos', label: 'Somente Ativos' },
  { value: 'todos', label: 'Todos os Status' },
  { value: 'inativos', label: 'Somente Inativos' },
];

export const ProdutoList: React.FC<ListProps> = ({
  produtos,
  total,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  error,
  searchTerm,
  tipoProdutoFilter,
  statusFilter,
  tiposProdutoList,
  sortBy,
  sortOrder,
  onSearchChange,
  onTipoProdutoFilterChange,
  onStatusFilterChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onNew,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onRefresh,
}) => {
  const isFilterActive = Boolean(
    searchTerm.trim() ||
      (statusFilter && statusFilter !== 'ativos') ||
      (tipoProdutoFilter && tipoProdutoFilter > 0)
  );

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatFator = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const renderSortIcon = (
    column: 'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'precoVenda' | 'ativo' | 'createdAt'
  ) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 font-bold" />
    );
  };

  const tipoSelectOptions = [
    { value: '', label: 'Todos os Tipos de Produto' },
    ...tiposProdutoList.map((t) => ({
      value: t.id.toString(),
      label: t.nome,
    })),
  ];

  return (
    <div className="space-y-5">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Produtos</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {total} {total === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro de produtos com composição de insumos, custo calculado e preço sugerido.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            title="Atualizar lista"
            disabled={isLoading}
            className="cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button variant="primary" size="sm" onClick={onNew} className="cursor-pointer shadow-xs">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Produto</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search by Name */}
          <div className="md:col-span-5">
            <div className="relative">
              <Input
                placeholder="Buscar por nome do produto..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tipo de Produto filter */}
          <div className="md:col-span-4">
            <Select
              options={tipoSelectOptions}
              value={tipoProdutoFilter ? tipoProdutoFilter.toString() : ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                onTipoProdutoFilterChange(val);
              }}
            />
          </div>

          {/* Status filter */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  options={STATUS_FILTER_OPTIONS}
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                />
              </div>

              {isFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSearchChange('');
                    onStatusFilterChange('ativos');
                    onTipoProdutoFilterChange(undefined);
                  }}
                  title="Limpar todos os filtros"
                  className="text-slate-500 hover:text-rose-600 shrink-0 px-2 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Limpar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={onRefresh} />
          </div>
        ) : isLoading ? (
          <div className="p-6">
            <TableLoadingSkeleton rows={5} columns={7} />
          </div>
        ) : produtos.length === 0 ? (
          <div className="p-8">
            {isFilterActive ? (
              <EmptyState
                icon={<Search className="w-8 h-8 text-slate-400" />}
                title="Nenhum produto encontrado"
                description="Nenhum produto corresponde aos filtros aplicados. Tente ajustar os termos de pesquisa ou o filtro de status."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onSearchChange('');
                      onStatusFilterChange('ativos');
                      onTipoProdutoFilterChange(undefined);
                    }}
                    className="cursor-pointer"
                  >
                    Limpar Filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Layers className="w-8 h-8 text-indigo-500" />}
                title="Nenhum produto cadastrado"
                description="Comece cadastrando seu primeiro produto com sua composição de insumos e markup de precificação."
                action={
                  <Button variant="primary" size="sm" onClick={onNew} className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Cadastrar Produto
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 select-none">
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => onSortChange('nome')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Nome do Produto</span>
                        {renderSortIcon('nome')}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => onSortChange('tipoProdutoNome')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tipo de Produto</span>
                        {renderSortIcon('tipoProdutoNome')}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-right"
                      onClick={() => onSortChange('custoTotal')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Custo Total</span>
                        {renderSortIcon('custoTotal')}
                      </div>
                    </th>

                    <th className="py-3 px-4 text-center">
                      <span>Markup</span>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-right"
                      onClick={() => onSortChange('precoSugerido')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Preço Sugerido</span>
                        {renderSortIcon('precoSugerido')}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-right"
                      onClick={() => onSortChange('precoVenda')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Preço de Venda</span>
                        {renderSortIcon('precoVenda')}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-center"
                      onClick={() => onSortChange('ativo')}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Status</span>
                        {renderSortIcon('ativo')}
                      </div>
                    </th>

                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produtos.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          !item.ativo ? 'bg-slate-50/40 text-slate-500' : ''
                        }`}
                      >
                        {/* Nome & Descrição */}
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>
                            <span className="font-semibold text-slate-900 block">{item.nome}</span>
                            {item.descricao && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {item.descricao}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                              <Package className="w-3 h-3 text-slate-400" />
                              <span>
                                {item.totalItensComposicao || 0}{' '}
                                {item.totalItensComposicao === 1 ? 'insumo' : 'insumos'} na composição
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tipo de Produto */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {item.tipoProdutoNome || '—'}
                          </span>
                        </td>

                        {/* Custo Total */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 font-mono">
                          {formatCurrency(item.custoTotal)}
                        </td>

                        {/* Markup */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-medium text-slate-800">
                              {item.markupNome}
                            </span>
                            <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {formatFator(item.markupFator)}
                            </span>
                          </div>
                        </td>

                        {/* Preço Sugerido */}
                        <td className="py-3.5 px-4 text-right font-semibold font-mono text-emerald-700">
                          <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                            {formatCurrency(item.precoSugerido)}
                          </span>
                        </td>

                        {/* Preço de Venda */}
                        <td className="py-3.5 px-4 text-right font-bold font-mono text-indigo-900">
                          <span className="bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-200/80">
                            {formatCurrency(item.precoVenda)}
                          </span>
                        </td>

                        {/* Status (Ativo/Inativo) */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onToggleStatus(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-85"
                            title={
                              item.ativo
                                ? 'Clique para inativar este produto'
                                : 'Clique para ativar este produto'
                            }
                          >
                            {item.ativo ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inativo
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(item)}
                            title="Visualizar detalhes e composição"
                            className="p-1.5 h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            title="Editar produto e composição"
                            className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item)}
                            title="Excluir produto"
                            className="p-1.5 h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={total}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
