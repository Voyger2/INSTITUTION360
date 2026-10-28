"use client";

import * as React from "react";
import { Toast } from "@/components/ui/toast";

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastState {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

const TOAST_CONTEXT = React.createContext<{
  toasts: ToastState[];
  addToast: (toast: Omit<ToastState, "id">) => void;
  removeToast: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastState, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <TOAST_CONTEXT.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              id={t.id}
              type={t.type}
              title={t.title}
              message={t.message}
              duration={t.duration}
              onDismiss={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>
    </TOAST_CONTEXT.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(TOAST_CONTEXT);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}