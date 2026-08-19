import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Scale, Info, CheckCircle2 } from 'lucide-react';
import { UnidadeMedida, UnidadeMedidaFormData, TipoUnidade } from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { Select } from '../../../shared/components/Select.tsx';

interface FormProps {
  unidade?: UnidadeMedida | null;
  onSave: (data: UnidadeMedidaFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const TIPO_OPTIONS = [
  { value: 'Massa', label: 'Massa (Ex: Grama, Quilograma, Onça)' },
  { value: 'Volume', label: 'Volume (Ex: Mililitro, Litro, Galão)' },
  { value: 'Comprimento', label: 'Comprimento (Ex: Metro, Centímetro, Polegada)' },
  { value: 'Unidade', label: 'Unidade (Ex: Peça, Pacote, Caixa, Par)' },
];

export const UnidadeMedidaForm: React.FC<FormProps> = ({
  unidade,
  onSave,
  onCancel,
  isSaving,
}) => {
  const isEditing = Boolean(unidade && unidade.id);

  const [formData, setFormData] = useState<UnidadeMedidaFormData>({
    nome: '',
    tipo: 'Massa',
    fatorConversao: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (unidade) {
      setFormData({
        nome: unidade.nome,
        tipo: unidade.tipo,
        fatorConversao: unidade.fatorConversao,
      });
    } else {
      setFormData({
        nome: '',
        tipo: 'Massa',
        fatorConversao: 1,
      });
    }
    setErrors({});
    setTouched({});
  }, [unidade]);

  const validateField = (field: keyof UnidadeMedidaFormData, value: any): string | null => {
    if (field === 'nome') {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return 'O nome da unidade de medida é obrigatório.';
      }
      if (value.trim().length > 50) {
        return 'O nome não pode ter mais de 50 caracteres.';
      }
    }

    if (field === 'tipo') {
      if (!['Volume', 'Comprimento', 'Massa', 'Unidade'].includes(value)) {
        return 'Selecione um tipo válido.';
      }
    }

    if (field === 'fatorConversao') {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(num)) {
        return 'O fator de conversão deve ser um valor numérico.';
      }
      if (num <= 0) {
        return 'O fator de conversão deve ser maior que zero.';
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nomeErr = validateField('nome', formData.nome);
    if (nomeErr) newErrors.nome = nomeErr;

    const tipoErr = validateField('tipo', formData.tipo);
    if (tipoErr) newErrors.tipo = tipoErr;

    const fatorErr = validateField('fatorConversao', formData.fatorConversao);
    if (fatorErr) newErrors.fatorConversao = fatorErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof UnidadeMedidaFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => {
        const copy = { ...prev };
        if (err) copy[field] = err;
        else delete copy[field];
        return copy;
      });
    }
  };

  const handleBlur = (field: keyof UnidadeMedidaFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[field] = err;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nome: true, tipo: true, fatorConversao: true });

    if (!validateForm()) {
      return;
    }

    await onSave(formData);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Unidades de Medida
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Alterando dados do registro #${unidade?.id}`
                  : 'Cadastre uma nova unidade para pesagem, medição ou contagem de insumos'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {/* Nome */}
          <div>
            <Input
              label="Nome da Unidade"
              required
              placeholder="Ex: Grama, Quilograma, Litro, Metro, Peça..."
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              onBlur={() => handleBlur('nome')}
              error={errors.nome}
              helperText="Identificação clara da unidade (máximo 50 caracteres)."
              maxLength={50}
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tipo */}
            <div>
              <Select
                label="Tipo de Grandeza"
                required
                options={TIPO_OPTIONS}
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value as TipoUnidade)}
                onBlur={() => handleBlur('tipo')}
                error={errors.tipo}
                helperText="Selecione a grandeza física correspondente à unidade."
                disabled={isSaving}
              />
            </div>

            {/* Fator de Conversao */}
            <div>
              <Input
                label="Fator de Conversão"
                required
                type="number"
                step="any"
                min="0.000001"
                placeholder="Ex: 1, 1000, 0.01"
                value={formData.fatorConversao}
                onChange={(e) => handleChange('fatorConversao', e.target.value)}
                onBlur={() => handleBlur('fatorConversao')}
                error={errors.fatorConversao}
                helperText="Valor positivo de referência utilizado no cálculo de proporções."
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Educational / Explanatory Tip Box */}
          <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-900 leading-relaxed space-y-1">
              <p className="font-semibold">Sobre o Fator de Conversão</p>
              <p className="text-indigo-700/90">
                O fator de conversão é um número positivo que relaciona a unidade com sua medida padrão
                (por exemplo, <strong>1000</strong> para <em>Quilograma</em> em relação a gramas, ou <strong>1</strong> para a unidade base).
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Unidade'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
