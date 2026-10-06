"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { classNames } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(92vw,380px)] flex-col gap-3" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={classNames(
              "pointer-events-auto animate-fade-up border bg-coal/95 px-5 py-4 font-sans text-sm text-cream shadow-book backdrop-blur",
              t.kind === "success" && "border-gold/50",
              t.kind === "error" && "border-ember/70",
              t.kind === "info" && "border-cream/20"
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span
                className={classNames(
                  "mt-1.5 h-2 w-2 shrink-0 rotate-45",
                  t.kind === "success" && "bg-gold",
                  t.kind === "error" && "bg-ember",
                  t.kind === "info" && "bg-sand"
                )}
              />
              <p className="leading-relaxed">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
