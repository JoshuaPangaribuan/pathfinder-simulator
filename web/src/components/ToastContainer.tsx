import { useToast } from "@/hooks/useToast";

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 shadow-lg min-w-[300px] max-w-[500px] ${
            toast.type === "error"
              ? "border-rose-500 bg-rose-500/10 text-rose-200"
              : toast.type === "success"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
              : toast.type === "warning"
              ? "border-amber-500 bg-amber-500/10 text-amber-200"
              : "border-slate-500 bg-slate-500/10 text-slate-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-sm opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
