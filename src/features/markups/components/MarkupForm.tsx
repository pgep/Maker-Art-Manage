import React, { useState, useEffect, useMemo } from 'react';
import { Markup, MarkupFormData } from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import {
  ArrowLeft,
  Save,
  Percent,
  Calculator,
  Info,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface MarkupFormProps {
  markup: Markup | null;
  onSave: (data: MarkupFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const MarkupForm: React.FC<MarkupFormProps> = ({
  markup,
  onSave,
  onCancel,
  isSaving,
}) => {
  const isEditing = Boolean(markup);

  const [nome, setNome] = useState('');
  const [fator, setFator] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (markup) {
      setNome(markup.nome);
      setFator(markup.fator.toString());
      setAtivo(markup.ativo);
    } else {
      setNome('');
      setFator('');
      setAtivo(true);
    }
    setErrors({});
    setTouched({});
  }, [markup]);

  // Simulation calculation
  const simulation = useMemo(() => {
    const baseExampleCost = 100;
    const numFator = parseFloat(fator.replace(',', '.'));
    const isValidFator = !isNaN(numFator) && numFator > 0;

    const suggestedPrice = isValidFator ? baseExampleCost * numFator : null;

    return {
      baseExampleCost,
      numFator,
      isValidFator,
      suggestedPrice,
    };
  }, [fator]);

  const validateField = (field: string, value: any): string | null => {
    if (field === 'nome') {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      if (!trimmed) {
        return 'O nome do markup é obrigatório.';
      }
      if (trimmed.length > 100) {
        return 'O nome do markup não pode exceder 100 caracteres.';
      }
    }

    if (field === 'fator') {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return 'O fator de markup é obrigatório.';
      }
      const num = parseFloat(typeof value === 'string' ? value.replace(',', '.') : String(value));
      if (isNaN(num) || num <= 0) {
        return 'O fator de markup deve ser um número maior que zero.';
      }
    }

    return null;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'nome' ? nome : fator;
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

    const fields = ['nome', 'fator'];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    fields.forEach((f) => {
      newTouched[f] = true;
      const val = f === 'nome' ? nome : fator;
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
        fator: parseFloat(fator.replace(',', '.')),
        ativo,
      });
    } catch (err: any) {
      if (err?.details) {
        setErrors(err.details);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
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
              <Percent className="w-5 h-5 text-indigo-600" />
              {isEditing ? 'Editar Markup' : 'Novo Markup'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `Atualize o identificador e o fator multiplicador do markup #${markup?.id}`
                : 'Cadastre um multiplicador utilizado na formação do preço sugerido dos produtos'}
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
            {isEditing ? 'Salvar Alterações' : 'Salvar Markup'}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors._form && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors._form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form Inputs (7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Dados do Multiplicador
              </h2>

              {/* Nome */}
              <div>
                <Input
                  id="markup-nome"
                  label="Nome / Identificação do Markup"
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
                  placeholder="Ex.: Markup Padrão, Varejo, Feiras, Atacado..."
                  error={touched.nome ? errors.nome : undefined}
                  required
                  maxLength={100}
                  helpText="Nome único para identificar o markup ao precificar produtos."
                  autoFocus
                />
              </div>

              {/* Fator */}
              <div>
                <Input
                  id="markup-fator"
                  label="Fator de Markup"
                  type="number"
                  step="any"
                  min="0.0001"
                  value={fator}
                  onChange={(e) => {
                    setFator(e.target.value);
                    if (touched.fator) {
                      const err = validateField('fator', e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        if (err) next.fator = err;
                        else delete next.fator;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => handleBlur('fator')}
                  placeholder="Ex.: 2.00 ou 2,50 ou 3.00"
                  error={touched.fator ? errors.fator : undefined}
                  required
                  helpText="Valor decimal maior que zero (ex.: 2,00 dobra o custo total)."
                />
              </div>

              {/* Explanatory concept message */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Este fator será multiplicado pelo custo do produto para calcular o preço sugerido.
                </p>
              </div>
            </div>
          </div>

          {/* Simulation Preview Card (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-gradient-to-b from-indigo-50/60 to-slate-50 rounded-xl border border-indigo-100 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-100 pb-3">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold">Simulação de Preço</h3>
                  <p className="text-[11px] text-indigo-700/80">Exemplo ilustrativo de cálculo</p>
                </div>
              </div>

              {/* Formula & Calculation Box */}
              <div className="bg-white p-4 rounded-lg border border-indigo-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                  <span>Custo total de exemplo:</span>
                  <span className="font-semibold text-slate-900 font-mono">R$ 100,00</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                  <span>Markup aplicado:</span>
                  <span className="font-bold text-indigo-600 font-mono">
                    {simulation.isValidFator
                      ? `${simulation.numFator.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}x`
                      : '—'}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-800">Preço sugerido:</span>
                    <span className="text-xl font-extrabold text-indigo-700 font-mono">
                      {simulation.suggestedPrice !== null
                        ? `R$ ${simulation.suggestedPrice.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </span>
                  </div>
                  {simulation.suggestedPrice !== null && (
                    <p className="text-[10px] text-slate-400 text-right mt-0.5">
                      Fórmula: R$ 100,00 ×{' '}
                      {simulation.numFator.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                    </p>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-500 leading-relaxed bg-white/70 p-3 rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700">Nota:</span> Essa prévia é apenas ilustrativa e não representa um valor real armazenado.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isEditing ? (
              <span>Editando registro cadastrado em {new Date(markup!.createdAt).toLocaleDateString('pt-BR')}</span>
            ) : (
              <span>Novo markup será cadastrado como <strong>Ativo</strong></span>
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
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Markup'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
