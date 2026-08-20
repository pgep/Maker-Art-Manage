import React from 'react';
import { PowerOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Produto } from '../../../core/types.ts';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  produto: Produto | null;
  isUpdating: boolean;
}

export const ProdutoStatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  produto,
  isUpdating,
}) => {
  if (!produto) return null;

  const nextStatus = !produto.ativo;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={nextStatus ? 'Ativar Produto' : 'Inativar Produto'}
      description="Confirme a alteração de status do produto selecionado."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            nextStatus
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {nextStatus ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <PowerOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}

          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">
              {nextStatus
                ? `Deseja ativar o produto "${produto.nome}"?`
                : `Deseja inativar o produto "${produto.nome}"?`}
            </p>
            <p className="text-slate-600">
              {nextStatus
                ? 'Ao ativar, este produto voltará a estar disponível e visível nas listagens padrão.'
                : 'Ao inativar, este produto não aparecerá em futuras seleções e ficará oculto no filtro padrão de ativos.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isUpdating}
            className="cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant={nextStatus ? 'primary' : 'danger'}
            size="sm"
            onClick={onConfirm}
            disabled={isUpdating}
            className="cursor-pointer shadow-xs min-w-[100px]"
          >
            <span>
              {isUpdating
                ? 'Salvando...'
                : nextStatus
                ? 'Confirmar Ativação'
                : 'Confirmar Inativação'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
