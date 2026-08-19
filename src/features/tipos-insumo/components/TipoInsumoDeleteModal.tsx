import React from 'react';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { TipoInsumo } from '../../../core/types.ts';
import { AlertCircle } from 'lucide-react';

interface TipoInsumoDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tipoInsumo: TipoInsumo | null;
  isDeleting: boolean;
}

export const TipoInsumoDeleteModal: React.FC<TipoInsumoDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tipoInsumo,
  isDeleting,
}) => {
  if (!tipoInsumo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Tipo de Insumo"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
            <p>
              Deseja realmente excluir o tipo de insumo{' '}
              <strong className="text-slate-900 font-semibold">"{tipoInsumo.nome}"</strong>?
            </p>
            <p className="text-slate-500 text-[11px]">
              Esta ação removerá o registro permanentemente do banco de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
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
