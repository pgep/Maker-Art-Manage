import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { UnidadeMedida } from '../../../core/types.ts';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { TipoBadge } from '../../../shared/components/Badge.tsx';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  unidade: UnidadeMedida | null;
  isDeleting: boolean;
}

export const UnidadeMedidaDeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unidade,
  isDeleting,
}) => {
  if (!unidade) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isDeleting && onClose()}
      title="Excluir Unidade de Medida"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              Deseja realmente excluir esta unidade de medida?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Esta ação removerá permanentemente a unidade do catálogo do sistema.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Identificador (ID):</span>
            <span className="font-semibold text-slate-700">#{unidade.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Nome:</span>
            <span className="font-semibold text-slate-900">{unidade.nome}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Tipo:</span>
            <TipoBadge tipo={unidade.tipo} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Fator de Conversão:</span>
            <span className="font-mono text-slate-700">{unidade.fatorConversao}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Excluir Unidade
          </Button>
        </div>
      </div>
    </Modal>
  );
};
