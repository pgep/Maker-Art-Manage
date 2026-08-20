import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  Layers,
  Percent,
  CheckCircle2,
  Search,
  Calculator,
  HelpCircle,
} from 'lucide-react';
import {
  ProdutoDetail,
  ProdutoFormData,
  TipoProduto,
  Markup,
  Insumo,
  TipoUnidade,
} from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { Select } from '../../../shared/components/Select.tsx';
import { ProdutoApiService } from '../services/produtoApiService.ts';

interface FormProps {
  produto?: ProdutoDetail | null;
  onSave: (data: ProdutoFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

interface CompositionRowState {
  id: string; // unique key for react state
  insumoId: string;
  quantidade: string;
}

export const ProdutoForm: React.FC<FormProps> = ({ produto, onSave, onCancel, isSaving }) => {
  const isEditing = Boolean(produto);

  // Form Fields
  const [nome, setNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [tipoProdutoId, setTipoProdutoId] = useState<string>('');
  const [markupId, setMarkupId] = useState<string>('');
  const [precoVenda, setPrecoVenda] = useState<string>('');
  const [isPrecoVendaCustomized, setIsPrecoVendaCustomized] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<boolean>(true);

  // Composition rows
  const [compositionRows, setCompositionRows] = useState<CompositionRowState[]>([]);

  // Auxiliary dropdown data
  const [tiposProdutoList, setTiposProdutoList] = useState<TipoProduto[]>([]);
  const [markupsList, setMarkupsList] = useState<Markup[]>([]);
  const [insumosList, setInsumosList] = useState<Insumo[]>([]);
  const [isLoadingPrereqs, setIsLoadingPrereqs] = useState<boolean>(true);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper mapping for quick insumo lookup
  const insumoMap = useMemo(() => {
    const map = new Map<number, Insumo>();
    insumosList.forEach((ins) => map.set(ins.id, ins));
    return map;
  }, [insumosList]);

  // Load auxiliary lists on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAuxiliaryData() {
      setIsLoadingPrereqs(true);
      setPrereqError(null);
      try {
        const [tipos, mrkups, ins] = await Promise.all([
          ProdutoApiService.loadActiveTiposProduto(),
          ProdutoApiService.loadActiveMarkups(),
          ProdutoApiService.loadActiveInsumos(),
        ]);

        if (!isMounted) return;

        setTiposProdutoList(tipos);
        setMarkupsList(mrkups);
        setInsumosList(ins);

        // Pre-fill form if editing
        if (produto) {
          setNome(produto.nome);
          setDescricao(produto.descricao || '');
          setTipoProdutoId(produto.tipoProdutoId.toString());
          setMarkupId(produto.markupId.toString());
          setAtivo(produto.ativo);
          setPrecoVenda(
            produto.precoVenda !== undefined && produto.precoVenda !== null
              ? Number(produto.precoVenda).toFixed(2).replace('.', ',')
              : ''
          );
          setIsPrecoVendaCustomized(true);

          if (produto.itensComposicao && produto.itensComposicao.length > 0) {
            setCompositionRows(
              produto.itensComposicao.map((item, idx) => ({
                id: `row-${idx}-${Date.now()}`,
                insumoId: item.insumoId.toString(),
                quantidade: item.quantidade.toString().replace('.', ','),
              }))
            );
          } else {
            setCompositionRows([{ id: `row-0-${Date.now()}`, insumoId: '', quantidade: '' }]);
          }
        } else {
          // Creating new product: check for "Markup Padrão"
          const markupPadrao = mrkups.find(
            (m) => m.nome.trim().toLowerCase() === 'markup padrão' || m.nome.trim().toLowerCase() === 'markup padrao'
          );
          if (markupPadrao) {
            setMarkupId(markupPadrao.id.toString());
          } else if (mrkups.length > 0) {
            setMarkupId(mrkups[0].id.toString());
          }

          if (tipos.length > 0) {
            setTipoProdutoId(tipos[0].id.toString());
          }

          setIsPrecoVendaCustomized(false);

          // Initial empty composition row
          setCompositionRows([{ id: `row-0-${Date.now()}`, insumoId: '', quantidade: '' }]);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load auxiliary data for ProdutoForm:', err);
        setPrereqError(
          err?.message || 'Falha ao carregar dados auxiliares (Tipos, Markups e Insumos).'
        );
      } finally {
        if (isMounted) setIsLoadingPrereqs(false);
      }
    }

    loadAuxiliaryData();

    return () => {
      isMounted = false;
    };
  }, [produto]);

  // Composition management
  const handleAddRow = () => {
    setCompositionRows((prev) => [
      ...prev,
      { id: `row-${Date.now()}-${Math.random()}`, insumoId: '', quantidade: '' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setCompositionRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowInsumoChange = (index: number, newInsumoId: string) => {
    setCompositionRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], insumoId: newInsumoId };
      return updated;
    });

    // Clear specific error
    if (errors[`item_${index}_insumoId`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}_insumoId`];
        return next;
      });
    }
  };

  const handleRowQuantidadeChange = (index: number, newQuantidade: string) => {
    setCompositionRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantidade: newQuantidade };
      return updated;
    });

    // Clear specific error
    if (errors[`item_${index}_quantidade`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}_quantidade`];
        return next;
      });
    }
  };

  // Base Unit Symbol Helper
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

  // Real-time Visual Cost & Price Calculations (Preview only)
  const calculationSummary = useMemo(() => {
    let custoTotal = 0;
    const rowCalculations = compositionRows.map((row) => {
      const insumoIdNum = parseInt(row.insumoId, 10);
      const insumo = !isNaN(insumoIdNum) ? insumoMap.get(insumoIdNum) : undefined;
      const rawQ = row.quantidade.replace(',', '.');
      const quantidadeNum = parseFloat(rawQ);

      const isValidQuantidade = !isNaN(quantidadeNum) && quantidadeNum > 0;
      const custoUnitarioBase = insumo ? Number(insumo.custoUnitarioBase || 0) : 0;
      const custoComponente = isValidQuantidade ? quantidadeNum * custoUnitarioBase : 0;

      if (insumo && isValidQuantidade) {
        custoTotal += custoComponente;
      }

      return {
        insumo,
        quantidadeNum: isValidQuantidade ? quantidadeNum : 0,
        custoUnitarioBase,
        custoComponente,
        baseUnit: insumo ? getBaseUnitSymbol(insumo.unidadeMedidaTipo) : '—',
      };
    });

    const selectedMarkupNum = parseInt(markupId, 10);
    const selectedMarkup = markupsList.find((m) => m.id === selectedMarkupNum);
    const markupFator = selectedMarkup ? Number(selectedMarkup.fator) : 1;
    const precoSugerido = custoTotal * markupFator;

    return {
      rowCalculations,
      custoTotal,
      markupFator,
      selectedMarkup,
      precoSugerido,
    };
  }, [compositionRows, insumoMap, markupId, markupsList]);

  // Auto-sync precoVenda with precoSugerido on creation when user has not manually customized it
  useEffect(() => {
    if (!isEditing && !isPrecoVendaCustomized) {
      if (calculationSummary.precoSugerido > 0) {
        setPrecoVenda(calculationSummary.precoSugerido.toFixed(2).replace('.', ','));
      } else {
        setPrecoVenda('');
      }
    }
  }, [isEditing, isPrecoVendaCustomized, calculationSummary.precoSugerido]);

  const handlePrecoVendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecoVenda(e.target.value);
    setIsPrecoVendaCustomized(true);
    if (errors.precoVenda) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.precoVenda;
        return next;
      });
    }
  };

  const handleApplyPrecoSugerido = () => {
    if (calculationSummary.precoSugerido > 0) {
      setPrecoVenda(calculationSummary.precoSugerido.toFixed(2).replace('.', ','));
      setIsPrecoVendaCustomized(false);
      if (errors.precoVenda) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.precoVenda;
          return next;
        });
      }
    }
  };

  // Form Validation & Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // 1. Nome
    if (!nome.trim()) {
      newErrors.nome = 'O nome do produto é obrigatório.';
    } else if (nome.trim().length > 150) {
      newErrors.nome = 'O nome do produto não pode exceder 150 caracteres.';
    }

    // 2. Tipo de Produto
    const parsedTipoId = parseInt(tipoProdutoId, 10);
    if (isNaN(parsedTipoId) || parsedTipoId <= 0) {
      newErrors.tipoProdutoId = 'Selecione um Tipo de Produto.';
    }

    // 3. Markup
    const parsedMarkupId = parseInt(markupId, 10);
    if (isNaN(parsedMarkupId) || parsedMarkupId <= 0) {
      newErrors.markupId = 'Selecione um Markup.';
    }

    // 4. Preço de Venda
    const rawPrecoVenda = precoVenda.replace(',', '.');
    const parsedPrecoVenda = parseFloat(rawPrecoVenda);
    if (!precoVenda.trim()) {
      newErrors.precoVenda = 'O Preço de Venda é obrigatório.';
    } else if (isNaN(parsedPrecoVenda) || parsedPrecoVenda <= 0) {
      newErrors.precoVenda = 'O Preço de Venda deve ser um valor numérico maior que zero.';
    }

    // 5. Composição
    if (compositionRows.length === 0) {
      newErrors.itensComposicao = 'Adicione pelo menos um insumo à composição.';
    } else {
      const seenInsumos = new Set<number>();
      let hasValidItem = false;

      compositionRows.forEach((row, idx) => {
        const insumoIdNum = parseInt(row.insumoId, 10);
        if (isNaN(insumoIdNum) || insumoIdNum <= 0) {
          newErrors[`item_${idx}_insumoId`] = 'Selecione o insumo.';
        } else {
          if (seenInsumos.has(insumoIdNum)) {
            newErrors[`item_${idx}_insumoId`] =
              'Este insumo já foi incluído na composição. O mesmo insumo não pode ser duplicado.';
          }
          seenInsumos.add(insumoIdNum);
        }

        const rawQ = row.quantidade.replace(',', '.');
        const qNum = parseFloat(rawQ);
        if (isNaN(qNum) || qNum <= 0) {
          newErrors[`item_${idx}_quantidade`] = 'Informe uma quantidade maior que zero.';
        } else if (!isNaN(insumoIdNum) && insumoIdNum > 0) {
          hasValidItem = true;
        }
      });

      if (!hasValidItem && !newErrors.itensComposicao) {
        newErrors.itensComposicao = 'Adicione pelo menos um insumo válido à composição.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const formData: ProdutoFormData = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      tipoProdutoId: parseInt(tipoProdutoId, 10),
      markupId: parseInt(markupId, 10),
      precoVenda: parsedPrecoVenda,
      ativo,
      itensComposicao: compositionRows.map((r) => ({
        insumoId: parseInt(r.insumoId, 10),
        quantidade: r.quantidade.replace(',', '.'),
      })),
    };

    try {
      await onSave(formData);
    } catch (err: any) {
      if (err?.details) {
        setErrors(err.details);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatFator = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  // Check prerequisites
  const hasNoTipos = !isLoadingPrereqs && tiposProdutoList.length === 0;
  const hasNoMarkups = !isLoadingPrereqs && markupsList.length === 0;
  const hasNoInsumos = !isLoadingPrereqs && insumosList.length === 0;
  const hasBlockingPrereqs = hasNoTipos || hasNoMarkups || hasNoInsumos;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Card */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800 cursor-pointer"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? `Editar Produto: ${produto?.nome}` : 'Novo Produto'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Atualize os dados, composição e precificação do produto.'
                : 'Cadastre o produto, monte a lista de insumos e visualize a formação de preço.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving || isLoadingPrereqs || hasBlockingPrereqs}
            className="cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Produto'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Prerequisite Warnings */}
      {hasBlockingPrereqs && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cadastros necessários antes de criar um Produto:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1 ml-2">
            {hasNoTipos && (
              <li>
                É necessário cadastrar ou ativar pelo menos um <strong>Tipo de Produto</strong>.
              </li>
            )}
            {hasNoMarkups && (
              <li>
                É necessário cadastrar ou ativar pelo menos um <strong>Markup</strong>.
              </li>
            )}
            {hasNoInsumos && (
              <li>
                É necessário cadastrar pelo menos um <strong>Insumo ativo</strong> para a composição.
              </li>
            )}
          </ul>
        </div>
      )}

      {prereqError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{prereqError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ======================================================== */}
        {/* SEÇÃO 1 — Dados do Produto                               */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center border border-indigo-100">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Dados do Produto</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-8">
              Informações cadastrais básicas, classificação e política de markup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Produto */}
            <div className="md:col-span-2">
              <Input
                label="Nome do Produto"
                required
                placeholder="Ex: Vela Aromática Lavanda 180g, Sabonete Artesanal Mel..."
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (errors.nome) setErrors((prev) => ({ ...prev, nome: '' }));
                }}
                error={errors.nome}
                helperText="O nome deve ser único e identificar claramente a peça ou produto final."
                maxLength={150}
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descrição <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes adicionais, notas sobre a peça ou técnica utilizada..."
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-1 resize-none"
              />
            </div>

            {/* Tipo de Produto */}
            <div>
              <Select
                label="Tipo de Produto"
                required
                options={[
                  { value: '', label: 'Selecione o Tipo de Produto...' },
                  ...tiposProdutoList.map((t) => ({
                    value: t.id.toString(),
                    label: t.nome,
                  })),
                ]}
                value={tipoProdutoId}
                onChange={(e) => {
                  setTipoProdutoId(e.target.value);
                  if (errors.tipoProdutoId) setErrors((prev) => ({ ...prev, tipoProdutoId: '' }));
                }}
                error={errors.tipoProdutoId}
                helperText="Exibe somente tipos de produto ativos."
              />
            </div>

            {/* Markup */}
            <div>
              <Select
                label="Markup de Precificação"
                required
                options={[
                  { value: '', label: 'Selecione o Markup...' },
                  ...markupsList.map((m) => ({
                    value: m.id.toString(),
                    label: `${m.nome} — ${formatFator(m.fator)}`,
                  })),
                ]}
                value={markupId}
                onChange={(e) => {
                  setMarkupId(e.target.value);
                  if (errors.markupId) setErrors((prev) => ({ ...prev, markupId: '' }));
                }}
                error={errors.markupId}
                helperText="Fator multiplicador aplicado sobre o custo total para sugestão de preço."
              />
            </div>

            {/* Status (Ativo / Inativo) */}
            {isEditing && (
              <div className="md:col-span-2 pt-2">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Produto Ativo</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SEÇÃO 2 — Composição do Produto                          */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center border border-indigo-100">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Composição do Produto</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-8">
                Adicione os insumos e a quantidade consumida para produzir 1 unidade deste produto.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddRow}
              disabled={hasNoInsumos}
              className="cursor-pointer shrink-0 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Adicionar Insumo</span>
            </Button>
          </div>

          {errors.itensComposicao && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errors.itensComposicao}</span>
            </div>
          )}

          {/* Composition Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 select-none">
                    <th className="py-2.5 px-3 min-w-[220px]">Insumo</th>
                    <th className="py-2.5 px-3 w-32">Quantidade</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unidade</th>
                    <th className="py-2.5 px-3 w-32 text-right">Custo Unitário Base</th>
                    <th className="py-2.5 px-3 w-32 text-right">Custo do Componente</th>
                    <th className="py-2.5 px-3 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compositionRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Nenhum insumo adicionado ainda. Clique em "+ Adicionar Insumo" acima.
                      </td>
                    </tr>
                  ) : (
                    compositionRows.map((row, idx) => {
                      const rowCalc = calculationSummary.rowCalculations[idx];
                      const selectedInsumo = rowCalc?.insumo;
                      const insumoError = errors[`item_${idx}_insumoId`];
                      const quantidadeError = errors[`item_${idx}_quantidade`];

                      // Exclude already selected insumos in other rows from dropdown or show alert
                      const insumoSelectOptions = [
                        { value: '', label: 'Selecione o Insumo...' },
                        ...insumosList.map((ins) => ({
                          value: ins.id.toString(),
                          label: `${ins.nome} (${getBaseUnitSymbol(ins.unidadeMedidaTipo)} - ${formatCurrency(
                            ins.custoUnitarioBase
                          )}/${getBaseUnitSymbol(ins.unidadeMedidaTipo)})`,
                        })),
                      ];

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* 1. Insumo Selector */}
                          <td className="py-2.5 px-3 align-top">
                            <div>
                              <select
                                value={row.insumoId}
                                onChange={(e) => handleRowInsumoChange(idx, e.target.value)}
                                className={`w-full rounded-md border bg-white px-2.5 py-1.5 text-xs text-slate-800 transition-colors focus:outline-none focus:ring-1 ${
                                  insumoError
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                                }`}
                              >
                                {insumoSelectOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              {insumoError && (
                                <p className="text-[11px] text-rose-600 font-medium mt-1">
                                  {insumoError}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 2. Quantidade */}
                          <td className="py-2.5 px-3 align-top">
                            <div>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Ex: 500"
                                value={row.quantidade}
                                onChange={(e) => handleRowQuantidadeChange(idx, e.target.value)}
                                className={`w-full rounded-md border bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono transition-colors focus:outline-none focus:ring-1 ${
                                  quantidadeError
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                                }`}
                              />
                              {quantidadeError && (
                                <p className="text-[11px] text-rose-600 font-medium mt-1">
                                  {quantidadeError}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 3. Unidade Base (Automatic) */}
                          <td className="py-2.5 px-3 text-center align-middle">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                              {rowCalc?.baseUnit || '—'}
                            </span>
                          </td>

                          {/* 4. Custo Unitário Base (Automatic) */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-600 align-middle">
                            {selectedInsumo
                              ? `${formatCurrency(rowCalc.custoUnitarioBase)} / ${rowCalc.baseUnit}`
                              : '—'}
                          </td>

                          {/* 5. Custo do Componente (Live Calculated) */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-xs text-slate-900 align-middle">
                            {selectedInsumo && rowCalc.quantidadeNum > 0
                              ? formatCurrency(rowCalc.custoComponente)
                              : '—'}
                          </td>

                          {/* 6. Action Delete */}
                          <td className="py-2.5 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              title="Remover insumo da composição"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SEÇÃO 3 — Formação do Custo, Preço Sugerido e Preço de Venda */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center border border-indigo-100">
                3
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Formação do Custo, Preço Sugerido e Preço de Venda
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-8">
              Resumo financeiro calculado com base na composição e definição do preço final de venda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Custo Total dos Insumos */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Custo Total dos Insumos
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                  {formatCurrency(calculationSummary.custoTotal)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Calculado automaticamente pela soma dos insumos
              </p>
            </div>

            {/* 2. Markup Selecionado */}
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">
                  Markup Aplicado
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-indigo-900">
                    {formatFator(calculationSummary.markupFator)}
                  </span>
                  <span className="text-xs text-indigo-600 font-medium">
                    ({calculationSummary.selectedMarkup?.nome || 'Não selecionado'})
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-indigo-500 mt-2">
                Fator multiplicador selecionado
              </p>
            </div>

            {/* 3. Preço Sugerido */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Preço Sugerido
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                    Automático
                  </span>
                </div>
                <span className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 block">
                  {formatCurrency(calculationSummary.precoSugerido)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-2">
                Fórmula: Custo Total × Markup
              </p>
            </div>
          </div>

          {/* 4. Preço de Venda (Definido pelo Usuário) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border-2 border-indigo-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <label htmlFor="precoVenda" className="text-sm font-bold text-slate-900">
                    Preço de Venda (R$) <span className="text-rose-500">*</span>
                  </label>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Definido pelo Usuário
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Valor final de venda comercializado. Inicialmente preenchido com o preço sugerido, mas você pode ajustá-lo livremente.
                </p>
              </div>

              {calculationSummary.precoSugerido > 0 && (
                <button
                  type="button"
                  onClick={handleApplyPrecoSugerido}
                  className="text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Igualar ao Preço Sugerido ({formatCurrency(calculationSummary.precoSugerido)})
                </button>
              )}
            </div>

            <div className="max-w-md">
              <div className="relative rounded-md shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 font-semibold text-sm">R$</span>
                </div>
                <input
                  type="text"
                  id="precoVenda"
                  name="precoVenda"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={precoVenda}
                  onChange={handlePrecoVendaChange}
                  className={`block w-full rounded-lg border bg-white pl-10 pr-4 py-2.5 text-base font-bold font-mono text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.precoVenda
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.precoVenda && (
                <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.precoVenda}</p>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[11px] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Regra de Precificação:</strong> O <em>Preço Sugerido</em> é calculado automaticamente pelo sistema (Custo Total × Markup). O <em>Preço de Venda</em> é definido por você e será salvo de forma independente, sem ser sobrescrito automaticamente em atualizações.
            </span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
            className="cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || isLoadingPrereqs || hasBlockingPrereqs}
            className="cursor-pointer shadow-xs min-w-[140px]"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Produto'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
