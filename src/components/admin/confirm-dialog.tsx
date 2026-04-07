"use client";

import { RiAlertLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Estilo rojo para acciones destructivas */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal de confirmación estándar para eliminar o acciones irreversibles.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        className="w-full max-w-md cursor-default rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          {danger ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
              <RiAlertLine className="size-5" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-zinc-900">
              {title}
            </h2>
            {description ? (
              <p id="confirm-dialog-desc" className="mt-2 text-sm leading-relaxed text-zinc-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800",
            )}
          >
            {loading ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
