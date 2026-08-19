import React, { useState, useEffect } from 'react';
import { TipoProduto, TipoProdutoFormData } from '../../../core/types.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { Input } from '../../../shared/components/Input.tsx';
import { ArrowLeft, Save, Tag, AlertCircle } from 'lucide-react';

interface TipoProdutoFormProps {
  tipoProduto: TipoProduto | null;
  onSave: (data: TipoProdutoFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const TipoProdutoForm: React.FC<TipoProdutoFormProps> = ({
  tipoProduto,
  onSave,
  onCancel,
  isSaving,
}) => {
  const isEditing = Boolean(tipoProduto);

  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (tipoProduto) {
      setNome(tipoProduto.nome);
      setAtivo(tipoProduto.ativo);
    } else {
      setNome('');
      setAtivo(true);
    }
    setErrors({});
    setTouched({});
  }, [tipoProduto]);

  const validateField = (field: string, value: string): string | null => {
    if (field === 'nome') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 'O nome do tipo de produto é obrigatório.';
      }
      if (trimmed.length > 100) {
        return 'O nome não pode exceder 100 caracteres.';
      }
    }
    return null;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'nome') {
      const err = validateField('nome', nome);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next.nome = err;
        else delete next.nome;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nomeErr = validateField('nome', nome);
    const newErrors: Record<string, string> = {};
    if (nomeErr) newErrors.nome = nomeErr;

    setTouched({ nome: true });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await onSave({
        nome: nome.trim(),
        ativo,
      });
    } catch (err: any) {
      if (err?.details) {
        setErrors(err.details);
      }
    }
  };

  return (
    <div className="space-y-6">
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
              <Tag className="w-5 h-5 text-indigo-600" />
              {isEditing ? 'Editar Tipo de Produto' : 'Novo Tipo de Produto'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `Atualize as informações do tipo de produto #${tipoProduto?.id}`
                : 'Cadastre uma nova classificação genérica para os produtos do ateliê'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
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
            {isEditing ? 'Salvar Alterações' : 'Salvar Tipo de Produto'}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General form alert error */}
          {errors._form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errors._form}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <Input
              id="tipo-produto-nome"
              label="Nome do Tipo de Produto"
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
              placeholder="Ex.: Bijuterias, Peças em Madeira, Cerâmica, Papelaria..."
              error={touched.nome ? errors.nome : undefined}
              required
              maxLength={100}
              helpText="Nome único que categoriza os produtos. Máximo 100 caracteres."
            />
          </div>

          {/* Ativo (if editing, informational badge or note) */}
          {isEditing && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">Status do Registro</p>
                <p className="text-[11px] text-slate-500">
                  {ativo
                    ? 'Este tipo de produto está atualmente ATIVO.'
                    : 'Este tipo de produto está atualmente INATIVO.'}
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  ativo
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          )}

          {/* Form Actions footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
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
              {isEditing ? 'Salvar Alterações' : 'Salvar Tipo de Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
