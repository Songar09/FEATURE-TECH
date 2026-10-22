import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };
const STYLES = {
  success: 'border-emerald-400/30 text-emerald-200',
  error: 'border-rose-400/30 text-rose-200',
  info: 'border-neon-cyan/30 text-cyan-100',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map(({ id, message, type }) => {
          const Icon = ICONS[type];
          return (
            <div key={id} role="status"
              className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border bg-ink-900/95 p-4 shadow-soft backdrop-blur ${STYLES[type]}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm">{message}</p>
              <button onClick={() => dismiss(id)} aria-label="Cerrar" className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
