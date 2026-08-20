import React from 'react';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { Markup } from '../../../core/types.ts';
import { PowerOff, CheckCircle2 } from 'lucide-react';

interface MarkupStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  markup: Markup | null;
  isUpdating: boolean;
}

export const MarkupStatusModal: React.FC<MarkupStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  markup,
  isUpdating,
}) => {
  if (!markup) return null;

  const isCurrentlyActive = markup.ativo;
  const nextAction = isCurrentlyActive ? 'inativar' : 'ativar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentlyActive ? 'Inativar Markup' : 'Ativar Markup'}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isCurrentlyActive
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {isCurrentlyActive ? (
              <PowerOff className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p>
              Deseja realmente {nextAction} o markup{' '}
              <strong className="text-slate-900 font-semibold">"{markup.nome}"</strong>?
            </p>
            {isCurrentlyActive ? (
              <p className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-semibold text-slate-700">Nota:</span> Ao inativar, o markup não é excluído, mas deixará de aparecer como opção ativa para novos cálculos de preço sugerido.
              </p>
            ) : (
              <p className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-semibold text-slate-700">Nota:</span> Ao ativar, este markup voltará a ficar disponível para seleção.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={isCurrentlyActive ? 'warning' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isUpdating}
          >
            {isCurrentlyActive ? 'Confirmar Inativação' : 'Confirmar Ativação'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
