import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Percent,
  CheckCircle2,
  X,
  FileText,
  Calendar,
  Sparkles,
  DollarSign,
  Tag,
} from 'lucide-react';
import { Produto, ProdutoDetail, ProdutoInsumoDetail, TipoUnidade } from '../../../core/types.ts';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { ProdutoApiService } from '../services/produtoApiService.ts';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onEdit: (produto: Produto) => void;
}

export const ProdutoDetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  produto,
  onEdit,
}) => {
  const [detail, setDetail] = useState<ProdutoDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !produto) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    ProdutoApiService.getById(produto.id)
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load product detail:', err);
          setError(err?.message || 'Falha ao carregar detalhes do produto.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, produto]);

  if (!isOpen || !produto) return null;

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

  const formatQuantidade = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  };

  const getBaseUnitSymbol = (tipo?: TipoUnidade | string) => {
    switch (tipo) {
      case 'Massa':
        return 'g';
      case 'Volume':
        return 'ml';
      case 'Comprimento':
        return 'cm';
      case 'Unidade':
      default:
        return 'un';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes do Produto: ${produto.nome}`}
      description="Consulta completa de dados cadastrais, composição e formação de preço."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Carregando detalhes da composição...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* Header info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-lg">{produto.nome}</h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      produto.ativo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {produto.descricao && (
                  <p className="text-xs text-slate-600 mt-1">{produto.descricao}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  Tipo: <strong>{produto.tipoProdutoNome || '—'}</strong>
                </span>
              </div>
            </div>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Custo Total
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {formatCurrency(produto.custoTotal)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Soma dos insumos
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                  Markup Aplicado
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold font-mono text-indigo-900">
                    {formatFator(produto.markupFator)}
                  </span>
                  <span className="text-xs text-indigo-600 font-medium">
                    ({produto.markupNome})
                  </span>
                </div>
                <span className="text-[10px] text-indigo-500 mt-1 block">
                  Fator multiplicador
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    Preço Sugerido
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                    Automático
                  </span>
                </div>
                <span className="text-xl font-extrabold font-mono text-emerald-700 mt-1 block">
                  {formatCurrency(produto.precoSugerido)}
                </span>
                <span className="text-[10px] text-emerald-600 mt-1 block">
                  Custo × Markup
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/50 to-indigo-100/40 border border-indigo-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block">
                    Preço de Venda
                  </span>
                  <span className="text-[9px] font-bold text-indigo-700 bg-white/80 px-1.5 py-0.2 rounded border border-indigo-200">
                    Usuário
                  </span>
                </div>
                <span className="text-xl font-extrabold font-mono text-indigo-950 mt-1 block">
                  {formatCurrency(produto.precoVenda)}
                </span>
                <span className="text-[10px] text-indigo-700/80 mt-1 block">
                  Preço final comercial
                </span>
              </div>
            </div>

            {/* Composition breakdown table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Itens da Composição ({detail?.itensComposicao.length || 0})</span>
                </h4>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Insumo</th>
                      <th className="py-2.5 px-3 text-right">Quantidade</th>
                      <th className="py-2.5 px-3 text-center">Unidade Base</th>
                      <th className="py-2.5 px-3 text-right">Custo Unitário Base</th>
                      <th className="py-2.5 px-3 text-right">Custo do Componente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail?.itensComposicao.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {item.insumoNome}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                          {formatQuantidade(item.quantidade)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {getBaseUnitSymbol(item.unidadeMedidaTipo)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(item.custoUnitarioBase)} / {getBaseUnitSymbol(item.unidadeMedidaTipo)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.custoComponente)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <td colSpan={4} className="py-2.5 px-3 text-right">
                        Custo Total dos Componentes:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900">
                        {formatCurrency(produto.custoTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={onClose} className="cursor-pointer">
                Fechar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(produto);
                }}
                className="cursor-pointer"
              >
                Editar Produto
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
