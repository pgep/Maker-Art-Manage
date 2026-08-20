import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Produto } from '../../../core/types.ts';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  produto: Produto | null;
  isDeleting: boolean;
}

export const ProdutoDeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  produto,
  isDeleting,
}) => {
  if (!produto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Produto"
      description="Esta ação removerá permanentemente o produto e sua composição."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm text-rose-950">
              Tem certeza que deseja excluir "{produto.nome}"?
            </p>
            <p className="text-rose-800">
              O produto e todos os registros da sua composição de insumos associada serão excluídos do sistema em uma única transação.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer shadow-xs min-w-[120px]"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span>{isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
