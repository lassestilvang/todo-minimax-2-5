"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

let toastId = 0;
function generateToastId() {
  return `toast-${++toastId}-${Date.now()}`;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast["type"], action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "error", action?: ToastAction) => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" 
        role="region" 
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            aria-live="polite"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right",
              toast.type === "error" && "bg-destructive text-destructive-foreground",
              toast.type === "success" && "bg-green-600 text-white",
              toast.type === "info" && "bg-muted text-foreground"
            )}
          >
            {toast.type === "error" && <AlertCircle className="h-4 w-4" />}
            <p className="text-sm font-medium">{toast.message}</p>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  removeToast(toast.id);
                }}
                className="ml-1 text-xs font-semibold uppercase tracking-wider underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-auto hover:opacity-70"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}