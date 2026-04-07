"use client";

import { RiCloseLine, RiQuestionLine } from "@remixicon/react";
import { useId, useState, type ReactNode } from "react";

type SectionHelpTriggerProps = {
  /** Título del diálogo (también se usa como aria-label del botón). */
  dialogTitle: string;
  /** Resumen breve al pasar el mouse sobre el ícono. */
  tooltip: string;
  children: ReactNode;
  /** Clases extra en el botón (ej. alinear con un título). */
  className?: string;
};

/**
 * Ayuda contextual estándar del admin: ícono discreto; hover muestra `tooltip`;
 * clic abre un modal con el contenido detallado (`children`).
 */
export function SectionHelpTrigger({ dialogTitle, tooltip, children, className = "" }: SectionHelpTriggerProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white p-1 text-zinc-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 ${className}`}
        aria-label={dialogTitle}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={tooltip}
      >
        <RiQuestionLine className="h-4 w-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[85] flex cursor-pointer items-center justify-center bg-black/45 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="flex max-h-[min(80vh,520px)] w-full max-w-md cursor-default flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/90 px-4 py-3">
              <h2 id={titleId} className="text-sm font-semibold text-zinc-900">
                {dialogTitle}
              </h2>
              <button
                type="button"
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-900"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <RiCloseLine className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
