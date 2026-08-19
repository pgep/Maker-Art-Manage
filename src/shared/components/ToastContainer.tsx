import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../core/types.ts';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-emerald-900/95 text-white border-emerald-700'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-700'
                : isWarning
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-xs">
              {toast.title && <p className="font-semibold text-white mb-0.5">{toast.title}</p>}
              <p className="text-slate-200 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
