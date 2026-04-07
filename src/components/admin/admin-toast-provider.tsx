"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { RiCheckLine, RiCloseLine, RiErrorWarningLine } from "@remixicon/react";

type ToastKind = "success" | "error";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type AdminToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const AdminToastContext = createContext<AdminToastApi | null>(null);

const AUTO_CLOSE_MS = 3600;

export function AdminToastProvider({ children }: PropsWithChildren) {
  const idRef = useRef(0);
  const [items, setItems] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => removeToast(id), AUTO_CLOSE_MS);
    },
    [removeToast],
  );

  const api = useMemo<AdminToastApi>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );

  return (
    <AdminToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2 shadow-lg backdrop-blur ${
              item.kind === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-900"
                : "border-red-200 bg-red-50/95 text-red-900"
            }`}
            role="status"
            aria-live="polite"
          >
            {item.kind === "success" ? (
              <RiCheckLine className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <p className="min-w-0 flex-1 text-sm leading-snug">{item.message}</p>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="rounded-md p-0.5 opacity-70 transition hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <RiCloseLine className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}
