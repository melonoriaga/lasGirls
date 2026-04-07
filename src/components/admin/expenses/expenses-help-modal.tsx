"use client";

import { RiCloseLine, RiQuestionLine } from "@remixicon/react";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  /** Texto accesible junto al icono (opcional) */
  label?: string;
  className?: string;
};

export function ExpensesHelpTrigger({ label, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/expenses/help", { credentials: "include", cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; markdown?: string; error?: string };
      if (!json.ok || typeof json.markdown !== "string") {
        throw new Error(json.error ?? "No se pudo cargar la ayuda.");
      }
      setMarkdown(json.markdown);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onOpen = () => {
    setOpen(true);
    if (markdown === null && !loading) void load();
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={`inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 ${className}`}
        aria-label="Ayuda: cómo funcionan los gastos compartidos"
        title="Cómo funciona esta sección"
      >
        <RiQuestionLine className="h-5 w-5 shrink-0" aria-hidden />
        {label ? <span className="text-xs font-medium">{label}</span> : null}
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
            className="flex max-h-[min(88vh,720px)] w-full max-w-2xl cursor-default flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expenses-help-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/90 px-4 py-3">
              <h2 id="expenses-help-title" className="text-sm font-semibold text-zinc-900">
                Cómo funcionan los gastos compartidos
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
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {loading && !markdown ? (
                <p className="text-sm text-zinc-500">Cargando documentación…</p>
              ) : null}
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              {markdown ? (
                <div className="expenses-help-prose">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h3 className="mt-0 border-b border-zinc-100 pb-2 text-base font-semibold tracking-tight text-zinc-900 first:mt-0">
                          {children}
                        </h3>
                      ),
                      h2: ({ children }) => (
                        <h4 className="mt-5 text-sm font-semibold text-zinc-900 first:mt-3">{children}</h4>
                      ),
                      p: ({ children }) => <p className="mt-2 text-sm leading-relaxed text-zinc-700">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-zinc-700">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-zinc-700">{children}</ol>
                      ),
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        if (isBlock) {
                          return (
                            <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                              <code>{children}</code>
                            </pre>
                          );
                        }
                        return (
                          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.8em] text-zinc-800">
                            {children}
                          </code>
                        );
                      },
                      strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
                      blockquote: ({ children }) => (
                        <blockquote className="mt-3 border-l-4 border-rose-200 bg-rose-50/60 px-3 py-2 text-sm text-zinc-700">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
