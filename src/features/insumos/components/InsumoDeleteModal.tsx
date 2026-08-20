import React from 'react';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { Insumo } from '../../../core/types.ts';
import { AlertCircle } from 'lucide-react';

interface InsumoDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  insumo: Insumo | null;
  isDeleting: boolean;
}

export const InsumoDeleteModal: React.FC<InsumoDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  insumo,
  isDeleting,
}) => {
  if (!insumo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Insumo"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p>
              Deseja realmente excluir o insumo{' '}
              <strong className="text-slate-900 font-semibold">"{insumo.nome}"</strong>?
            </p>
            <p className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
              Esta ação removerá permanentemente o cadastro do insumo, seus custos e seu registro de estoque do banco de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Confirmar Exclusão
          </Button>
        </div>
      </div>
    </Modal>
  );
};
