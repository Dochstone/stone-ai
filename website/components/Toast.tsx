"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

let nextId = 0;

const typeStyles: Record<ToastType, string> = {
  success: "bg-[#0E9A83] text-white",
  error: "bg-red-600 text-white",
  info: "bg-[#C4623D] text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const api: ToastAPI = {
    success: useCallback((m: string) => addToast(m, "success"), [addToast]),
    error: useCallback((m: string) => addToast(m, "error"), [addToast]),
    info: useCallback((m: string) => addToast(m, "info"), [addToast]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container — fixed bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3 rounded-xl text-sm font-semibold shadow-lg animate-slide-up ${typeStyles[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Inline keyframes for slide-up animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
