import React, { useState, useEffect, useMemo } from 'react';
import {
  Insumo,
  InsumoFormData,
  UnidadeMedida,
  TipoInsumo,
  TipoUnidade,
} from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { Select } from '../../../shared/components/Select.tsx';
import { InsumoApiService } from '../services/insumoApiService.ts';
import {
  ArrowLeft,
  Save,
  Package2,
  Calculator,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface InsumoFormProps {
  insumo: Insumo | null;
  onSave: (data: InsumoFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const InsumoForm: React.FC<InsumoFormProps> = ({
  insumo,
  onSave,
  onCancel,
  isSaving,
}) => {
  const isEditing = Boolean(insumo);

  // Form State
  const [nome, setNome] = useState('');
  const [tipoInsumoId, setTipoInsumoId] = useState<string>('');
  const [unidadeMedidaId, setUnidadeMedidaId] = useState<string>('');
  const [quantidadeCompra, setQuantidadeCompra] = useState<string>('');
  const [valorCompra, setValorCompra] = useState<string>('');
  const [estoqueMinimo, setEstoqueMinimo] = useState<string>('0');
  const [ativo, setAtivo] = useState(true);

  // Relational options
  const [unidadesList, setUnidadesList] = useState<UnidadeMedida[]>([]);
  const [tiposList, setTiposList] = useState<TipoInsumo[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);

  // Errors & Touch
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load auxiliary data
  useEffect(() => {
    let isMounted = true;
    const fetchSelectOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [unidades, tipos] = await Promise.all([
          InsumoApiService.loadActiveUnidadesMedida(),
          InsumoApiService.loadActiveTiposInsumo(),
        ]);
        if (isMounted) {
          setUnidadesList(unidades);
          setTiposList(tipos);
        }
      } catch (error) {
        console.error('Error loading form auxiliary options:', error);
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    fetchSelectOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize form with insumo data if editing
  useEffect(() => {
    if (insumo) {
      setNome(insumo.nome);
      setTipoInsumoId(insumo.tipoInsumoId.toString());
      setUnidadeMedidaId(insumo.unidadeMedidaId.toString());
      setQuantidadeCompra(insumo.quantidadeCompra.toString());
      setValorCompra(insumo.valorCompra.toString());
      setEstoqueMinimo(insumo.estoqueMinimo.toString());
      setAtivo(insumo.ativo);
    } else {
      setNome('');
      setTipoInsumoId('');
      setUnidadeMedidaId('');
      setQuantidadeCompra('');
      setValorCompra('');
      setEstoqueMinimo('0');
      setAtivo(true);
    }
    setErrors({});
    setTouched({});
  }, [insumo]);

  // Selected Unidade Medida object
  const selectedUnidade = useMemo(() => {
    if (!unidadeMedidaId) return null;
    return unidadesList.find((u) => u.id === Number(unidadeMedidaId)) || null;
  }, [unidadeMedidaId, unidadesList]);

  // Determine base unit label according to category
  const getBaseUnitLabel = (tipo?: TipoUnidade) => {
    switch (tipo) {
      case 'Massa':
        return 'g (gramas)';
      case 'Volume':
        return 'ml (mililitros)';
      case 'Comprimento':
        return 'cm (centímetros)';
      case 'Unidade':
      default:
        return 'un (unidades)';
    }
  };

  const getBaseUnitSymbol = (tipo?: TipoUnidade) => {
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

  // Real-time calculations for preview
  const calculated = useMemo(() => {
    const qtd = parseFloat(quantidadeCompra.replace(',', '.'));
    const val = parseFloat(valorCompra.replace(',', '.'));
    const fator = selectedUnidade ? Number(selectedUnidade.fatorConversao) : 1;

    const hasValidQtd = !isNaN(qtd) && qtd > 0;
    const hasValidVal = !isNaN(val) && val > 0;
    const hasUnidade = Boolean(selectedUnidade);

    const qtdBase = hasValidQtd && hasUnidade ? qtd * fator : null;
    const custoBase = hasValidVal && qtdBase && qtdBase > 0 ? val / qtdBase : null;

    return {
      fator,
      hasValidQtd,
      hasValidVal,
      hasUnidade,
      qtdBase,
      custoBase,
    };
  }, [quantidadeCompra, valorCompra, selectedUnidade]);

  // Field validation
  const validateField = (field: string, value: any): string | null => {
    if (field === 'nome') {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      if (!trimmed) {
        return 'O nome do insumo é obrigatório.';
      }
      if (trimmed.length > 150) {
        return 'O nome do insumo não pode exceder 150 caracteres.';
      }
    }

    if (field === 'tipoInsumoId') {
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        return 'Selecione uma categoria/tipo de insumo.';
      }
    }

    if (field === 'unidadeMedidaId') {
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        return 'Selecione a unidade de medida da compra.';
      }
    }

    if (field === 'quantidadeCompra') {
      const num = parseFloat(typeof value === 'string' ? value.replace(',', '.') : String(value));
      if (isNaN(num) || num <= 0) {
        return 'Informe uma quantidade de compra maior que zero.';
      }
    }

    if (field === 'valorCompra') {
      const num = parseFloat(typeof value === 'string' ? value.replace(',', '.') : String(value));
      if (isNaN(num) || num <= 0) {
        return 'Informe um valor de compra maior que zero.';
      }
    }

    if (field === 'estoqueMinimo') {
      const num = parseFloat(typeof value === 'string' ? value.replace(',', '.') : String(value));
      if (isNaN(num) || num < 0) {
        return 'O estoque mínimo não pode ser negativo (mínimo 0).';
      }
    }

    return null;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val: any = '';
    if (field === 'nome') val = nome;
    if (field === 'tipoInsumoId') val = tipoInsumoId;
    if (field === 'unidadeMedidaId') val = unidadeMedidaId;
    if (field === 'quantidadeCompra') val = quantidadeCompra;
    if (field === 'valorCompra') val = valorCompra;
    if (field === 'estoqueMinimo') val = estoqueMinimo;

    const err = validateField(field, val);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allFields = ['nome', 'tipoInsumoId', 'unidadeMedidaId', 'quantidadeCompra', 'valorCompra', 'estoqueMinimo'];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    allFields.forEach((f) => {
      newTouched[f] = true;
      let val: any = '';
      if (f === 'nome') val = nome;
      if (f === 'tipoInsumoId') val = tipoInsumoId;
      if (f === 'unidadeMedidaId') val = unidadeMedidaId;
      if (f === 'quantidadeCompra') val = quantidadeCompra;
      if (f === 'valorCompra') val = valorCompra;
      if (f === 'estoqueMinimo') val = estoqueMinimo;

      const err = validateField(f, val);
      if (err) newErrors[f] = err;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await onSave({
        nome: nome.trim(),
        tipoInsumoId: Number(tipoInsumoId),
        unidadeMedidaId: Number(unidadeMedidaId),
        quantidadeCompra: parseFloat(quantidadeCompra.replace(',', '.')),
        valorCompra: parseFloat(valorCompra.replace(',', '.')),
        estoqueMinimo: parseFloat(estoqueMinimo.replace(',', '.')),
        ativo,
      });
    } catch (err: any) {
      if (err?.details) {
        setErrors(err.details);
      }
    }
  };

  // Prepare select options
  const tipoOptions = [
    { value: '', label: 'Selecione o tipo de insumo...' },
    ...tiposList.map((t) => ({
      value: t.id.toString(),
      label: t.nome,
    })),
  ];

  const unidadeOptions = [
    { value: '', label: 'Selecione a unidade de medida...' },
    ...unidadesList.map((u) => ({
      value: u.id.toString(),
      label: `${u.nome} (${u.tipo} • Fator: ${u.fatorConversao})`,
    })),
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package2 className="w-5 h-5 text-indigo-600" />
              {isEditing ? 'Editar Insumo' : 'Novo Insumo'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `Atualize as informações e parâmetros de custo do insumo #${insumo?.id}`
                : 'Cadastre um material com seus dados de compra e conversão para a unidade-base'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Salvar Alterações' : 'Salvar Insumo'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Inputs + Real-time Calculation Panel */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Global Errors */}
        {errors._form && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors._form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Core Inputs (8 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card 1: Identificação */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                1. Identificação do Material
              </h2>

              {/* Nome */}
              <div>
                <Input
                  id="insumo-nome"
                  label="Nome do Insumo"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (touched.nome) {
                      const err = validateField('nome', e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        if (err) next.nome = err;
                        else delete next.nome;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => handleBlur('nome')}
                  placeholder="Ex.: Parafina de Soja, Resina Epóxi, Argila Branca, Linha 100% Algodão..."
                  error={touched.nome ? errors.nome : undefined}
                  required
                  maxLength={150}
                  helpText="Nome único do material utilizado na confecção das peças."
                  autoFocus
                />
              </div>

              {/* Tipo de Insumo */}
              <div>
                <Select
                  id="insumo-tipo-id"
                  label="Tipo de Insumo"
                  options={tipoOptions}
                  value={tipoInsumoId}
                  onChange={(e) => {
                    setTipoInsumoId(e.target.value);
                    if (touched.tipoInsumoId) {
                      const err = validateField('tipoInsumoId', e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        if (err) next.tipoInsumoId = err;
                        else delete next.tipoInsumoId;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => handleBlur('tipoInsumoId')}
                  error={touched.tipoInsumoId ? errors.tipoInsumoId : undefined}
                  required
                  helpText="Classificação genérica do insumo (ex.: Ceras, Madeiras, Tintas, Embalagens)."
                  disabled={isLoadingOptions}
                />
              </div>
            </div>

            {/* Card 2: Dados de Compra & Conversão */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                2. Aquisição & Unidade de Medida
              </h2>

              {/* Unidade de Medida */}
              <div>
                <Select
                  id="insumo-unidade-id"
                  label="Unidade de Medida da Compra"
                  options={unidadeOptions}
                  value={unidadeMedidaId}
                  onChange={(e) => {
                    setUnidadeMedidaId(e.target.value);
                    if (touched.unidadeMedidaId) {
                      const err = validateField('unidadeMedidaId', e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        if (err) next.unidadeMedidaId = err;
                        else delete next.unidadeMedidaId;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => handleBlur('unidadeMedidaId')}
                  error={touched.unidadeMedidaId ? errors.unidadeMedidaId : undefined}
                  required
                  helpText="Unidade em que o material é adquirido (ex.: Quilograma, Litro, Metro, Pacote)."
                  disabled={isLoadingOptions}
                />
              </div>

              {/* Quantidade e Valor de Compra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="insumo-quantidade-compra"
                    label="Quantidade Comprada"
                    type="number"
                    step="any"
                    min="0.000001"
                    placeholder="Ex.: 5 ou 0.5"
                    value={quantidadeCompra}
                    onChange={(e) => {
                      setQuantidadeCompra(e.target.value);
                      if (touched.quantidadeCompra) {
                        const err = validateField('quantidadeCompra', e.target.value);
                        setErrors((prev) => {
                          const next = { ...prev };
                          if (err) next.quantidadeCompra = err;
                          else delete next.quantidadeCompra;
                          return next;
                        });
                      }
                    }}
                    onBlur={() => handleBlur('quantidadeCompra')}
                    error={touched.quantidadeCompra ? errors.quantidadeCompra : undefined}
                    required
                    helpText="Quantidade no pacote/compra."
                  />
                </div>

                <div>
                  <Input
                    id="insumo-valor-compra"
                    label="Valor Total Pago (R$)"
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="Ex.: 50.00"
                    value={valorCompra}
                    onChange={(e) => {
                      setValorCompra(e.target.value);
                      if (touched.valorCompra) {
                        const err = validateField('valorCompra', e.target.value);
                        setErrors((prev) => {
                          const next = { ...prev };
                          if (err) next.valorCompra = err;
                          else delete next.valorCompra;
                          return next;
                        });
                      }
                    }}
                    onBlur={() => handleBlur('valorCompra')}
                    error={touched.valorCompra ? errors.valorCompra : undefined}
                    required
                    helpText="Valor monetário total pago."
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Parâmetros de Estoque */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                3. Controle de Estoque Mínimo
              </h2>

              <div>
                <Input
                  id="insumo-estoque-minimo"
                  label={`Estoque Mínimo Desejado (em ${getBaseUnitLabel(selectedUnidade?.tipo)})`}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex.: 500"
                  value={estoqueMinimo}
                  onChange={(e) => {
                    setEstoqueMinimo(e.target.value);
                    if (touched.estoqueMinimo) {
                      const err = validateField('estoqueMinimo', e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        if (err) next.estoqueMinimo = err;
                        else delete next.estoqueMinimo;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => handleBlur('estoqueMinimo')}
                  error={touched.estoqueMinimo ? errors.estoqueMinimo : undefined}
                  required
                  helpText={`Importante: Informe o estoque mínimo diretamente na unidade-base (${getBaseUnitSymbol(
                    selectedUnidade?.tipo
                  )}).`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Dynamic Calculation & Conversion Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-gradient-to-b from-indigo-50/70 to-slate-50 rounded-xl border border-indigo-100 shadow-2xs p-5 space-y-4 sticky top-4">
              <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-100 pb-3">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold">Cálculo Automático & Conversão</h3>
                  <p className="text-[11px] text-indigo-700/80">
                    Valores calculados automaticamente pelo sistema
                  </p>
                </div>
              </div>

              {/* Conversion Factor */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 space-y-1 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Unidade-Base & Fator de Conversão
                </span>
                {selectedUnidade ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      1 {selectedUnidade.nome} = {selectedUnidade.fatorConversao}{' '}
                      {getBaseUnitSymbol(selectedUnidade.tipo)}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium px-2 py-0.5 bg-indigo-50 rounded-md">
                      {selectedUnidade.tipo}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Selecione a unidade de compra acima
                  </span>
                )}
              </div>

              {/* Quantidade Equivalente Base */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 space-y-1 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Quantidade Equivalente na Base
                </span>
                {calculated.qtdBase !== null ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      {calculated.qtdBase.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {getBaseUnitSymbol(selectedUnidade?.tipo)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Aguardando quantidade e unidade
                  </span>
                )}
                <p className="text-[10px] text-slate-400">
                  Fórmula: Quantidade Comprada × Fator de Conversão
                </p>
              </div>

              {/* Custo Unitário Base */}
              <div className="bg-white p-3.5 rounded-lg border border-indigo-200/80 space-y-1 shadow-2xs ring-1 ring-indigo-500/10">
                <span className="text-[11px] font-bold text-indigo-900 block flex items-center justify-between">
                  <span>Custo Unitário Base</span>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                    Precisão Real
                  </span>
                </span>
                {calculated.custoBase !== null ? (
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-indigo-700 font-mono">
                        R${' '}
                        {calculated.custoBase.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        / {getBaseUnitSymbol(selectedUnidade?.tipo)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Fórmula: R$ {valorCompra || '0'} ÷{' '}
                      {calculated.qtdBase?.toLocaleString('pt-BR')}{' '}
                      {getBaseUnitSymbol(selectedUnidade?.tipo)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Aguardando quantidade e valor da compra
                  </span>
                )}
              </div>

              {/* Estoque Inicial / Atual */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 space-y-1 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {isEditing ? 'Estoque Físico Atual' : 'Estoque Inicial Calculado'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-800 font-mono">
                    {isEditing
                      ? `${insumo?.quantidadeEstoque.toLocaleString('pt-BR', {
                          maximumFractionDigits: 4,
                        })} ${getBaseUnitSymbol(selectedUnidade?.tipo)}`
                      : calculated.qtdBase !== null
                      ? `${calculated.qtdBase.toLocaleString('pt-BR', {
                          maximumFractionDigits: 4,
                        })} ${getBaseUnitSymbol(selectedUnidade?.tipo)}`
                      : '—'}
                  </span>
                </div>
                {isEditing ? (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/60 mt-1">
                    Nota: A alteração dos dados de compra recalcula o custo unitário base, mas preserva a quantidade em estoque real.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    O estoque inicial inicia automaticamente igual à quantidade base adquirida.
                  </p>
                )}
              </div>

              {/* Explanatory Note */}
              <div className="p-3 bg-indigo-100/50 rounded-lg text-[11px] text-indigo-900 flex items-start gap-2 border border-indigo-200/60">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Esses custos unitários calculados na unidade-base permitirão precificar e deduzir automaticamente as receitas e fichas técnicas de produtos no futuro.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isEditing ? (
              <span>Editando registro cadastrado em {new Date(insumo!.createdAt).toLocaleDateString('pt-BR')}</span>
            ) : (
              <span>Novo insumo será criado como <strong>Ativo</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Insumo'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
