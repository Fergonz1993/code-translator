// ===== TOAST NOTIFICATIONS COMPONENT =====
// Lightweight toast notification system.

"use client";

import { useState, useCallback, createContext, useContext, useRef, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

// ===== TYPES =====
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// ===== CONTEXT =====
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// ===== STYLES =====
const typeStyles: Record<ToastType, { bg: string; icon: ReactNode }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
  },
};

// ===== PROVIDER =====
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;
      
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (duration > 0) {
        timeoutId = setTimeout(() => removeToast(id), duration);
      }
      
      setToasts((prev) => [...prev, { id, type, message, duration, timeoutId }]);
    },
    [removeToast]
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: (message) => addToast("success", message),
    error: (message) => addToast("error", message),
    info: (message) => addToast("info", message),
    warning: (message) => addToast("warning", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg border shadow-lg
              animate-in slide-in-from-right duration-200
              ${typeStyles[toast.type].bg}
            `}
          >
            <span className="flex-shrink-0">{typeStyles[toast.type].icon}</span>
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

