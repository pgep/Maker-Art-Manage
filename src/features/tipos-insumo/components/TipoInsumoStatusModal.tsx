import React from 'react';
import { Modal } from '../../../shared/components/Modal.tsx';
import { Button } from '../../../shared/components/Button.tsx';
import { TipoInsumo } from '../../../core/types.ts';
import { PowerOff, CheckCircle2 } from 'lucide-react';

interface TipoInsumoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tipoInsumo: TipoInsumo | null;
  isUpdating: boolean;
}

export const TipoInsumoStatusModal: React.FC<TipoInsumoStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tipoInsumo,
  isUpdating,
}) => {
  if (!tipoInsumo) return null;

  const isCurrentlyActive = tipoInsumo.ativo;
  const nextAction = isCurrentlyActive ? 'inativar' : 'ativar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentlyActive ? 'Inativar Tipo de Insumo' : 'Ativar Tipo de Insumo'}
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
              Deseja realmente {nextAction} o tipo de insumo{' '}
              <strong className="text-slate-900 font-semibold">"{tipoInsumo.nome}"</strong>?
            </p>
            {isCurrentlyActive ? (
              <p className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-semibold text-slate-700">Nota:</span> Ao inativar, o registro não será excluído e seu histórico permanecerá seguro no banco.
              </p>
            ) : (
              <p className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-semibold text-slate-700">Nota:</span> Ao ativar, este tipo de insumo voltará a ficar disponível na listagem padrão de ativos.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
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
