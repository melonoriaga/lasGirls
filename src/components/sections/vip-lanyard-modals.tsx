"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

type ModalKind = "redeem" | "want" | null;

export function VipLanyardCTAs() {
  const [open, setOpen] = useState<ModalKind>(null);

  return (
    <>
      <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => setOpen("redeem")}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#ff3ea5] bg-[#ff3ea5] px-7 py-3.5 font-display text-sm font-extrabold uppercase tracking-widest text-black shadow-[0_10px_28px_-6px_rgba(255,62,165,0.45)] transition hover:brightness-110 active:scale-[0.99] sm:w-auto"
        >
          Usar mi VIP code
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen("want")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/35 bg-transparent px-7 py-3.5 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:border-white/55 hover:bg-white/10 sm:w-auto"
        >
          Quiero mi VIP code
        </button>
      </div>

      {open === "redeem" ? <RedeemVipModal onClose={() => setOpen(null)} /> : null}
      {open === "want" ? <WantVipModal onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] px-5 py-6 text-left text-white shadow-2xl sm:px-7 sm:py-8"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-xl font-black uppercase tracking-wide text-[#f4ede6] sm:text-2xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SuccessBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#ff3ea5]/35 bg-[#ff3ea5]/10 px-4 py-4 text-sm leading-relaxed text-[#f4ede6]">
      {children}
    </div>
  );
}

function RedeemVipModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [code, setCode] = useState("");
  const [validatedCode, setValidatedCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);

  const validateCode = useCallback(async () => {
    setError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/vip/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Código no disponible.");
        return;
      }
      setValidatedCode(code.trim());
      setStep(2);
    } catch {
      setError("Sin conexión. Intentá de nuevo.");
    } finally {
      setChecking(false);
    }
  }, [code]);

  const submit = useCallback(async () => {
    setError(null);
    if (!acceptsPrivacy) {
      setError("Aceptá el uso de tus datos para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vip/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: validatedCode,
          fullName,
          email,
          phone,
          message,
          acceptsPrivacy: true as const,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No pudimos registrar tu pedido.");
        return;
      }
      setStep("done");
    } catch {
      setError("Sin conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [validatedCode, fullName, email, phone, message, acceptsPrivacy]);

  return (
    <ModalShell title={step === "done" ? "¡Recibimos tu mensaje!" : "Usar mi VIP code"} onClose={onClose}>
      {step === "done" ? (
        <SuccessBlock>
          <p className="font-display text-base uppercase tracking-wide text-[#ff3ea5]">Gracias por confiar en Las Girls+</p>
          <p className="mt-3 text-white/85">
            Pronto nos vamos a contactar para coordinar tu descuento y armar el presupuesto según lo que nos contaste.
          </p>
        </SuccessBlock>
      ) : step === 1 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-white/65">
            Ingresá tu código VIP. Si es válido, te pedimos tus datos y un resumen del proyecto para presupuestar.
          </p>
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Código</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. JEAN20OFF"
            autoComplete="off"
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 font-mono text-sm uppercase tracking-wide text-white outline-none placeholder:text-white/25 focus:border-[#ff3ea5]"
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="button"
            disabled={checking || !code.trim()}
            onClick={() => void validateCode()}
            className="mt-2 inline-flex w-full items-center justify-center bg-[#ff3ea5] px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-opacity disabled:opacity-40"
          >
            {checking ? "Validando…" : "Validar código"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs uppercase tracking-wide text-[#ff3ea5]">
            Código: {validatedCode}
          </p>
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Nombre completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-[#ff3ea5]"
          />
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-[#ff3ea5]"
          />
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Teléfono / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-[#ff3ea5]"
          />
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
            ¿Qué querés hacer con Las Girls+?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Contanos brevemente el proyecto, plazos y cualquier referencia útil."
            className="w-full resize-y rounded border border-white/20 bg-black/40 px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-[#ff3ea5]"
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-white/75">
            <input
              type="checkbox"
              checked={acceptsPrivacy}
              onChange={(e) => setAcceptsPrivacy(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#ff3ea5]"
            />
            <span>
              Acepto que Las Girls+ use estos datos para contactarme según la{" "}
              <Link href="/privacy-policy" className="font-semibold text-[#ff3ea5] underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="order-2 border border-white/25 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white/80 hover:bg-white/10 sm:order-1"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={
                submitting ||
                !fullName.trim() ||
                !email.trim() ||
                !phone.trim() ||
                message.trim().length < 15 ||
                !acceptsPrivacy
              }
              onClick={() => void submit()}
              className="order-1 bg-[#ff3ea5] px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-opacity disabled:opacity-40 sm:order-2 sm:min-w-[200px]"
            >
              {submitting ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function WantVipModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    if (!acceptsPrivacy) {
      setError("Aceptá el uso de tus datos para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vip/discount-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          acceptsPrivacy: true as const,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No pudimos guardar tu pedido.");
        return;
      }
      setDone(true);
    } catch {
      setError("Sin conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [fullName, email, phone, acceptsPrivacy]);

  return (
    <ModalShell title={done ? "¡Listo!" : "Quiero mi VIP code"} onClose={onClose}>
      {done ? (
        <SuccessBlock>
          <p className="font-display text-base uppercase tracking-wide text-[#ff3ea5]">Te anotamos en la lista</p>
          <p className="mt-3 text-white/85">
            Pronto te vamos a contactar para darte tu descuento VIP y los próximos pasos.
          </p>
        </SuccessBlock>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-white/65">
            Dejános tus datos. Te registramos como lead que quiere un código de descuento; el equipo te escribe cuando esté
            activo tu beneficio.
          </p>
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Nombre completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-[#ff3ea5]"
          />
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-[#ff3ea5]"
          />
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Teléfono / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-[#ff3ea5]"
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-white/75">
            <input
              type="checkbox"
              checked={acceptsPrivacy}
              onChange={(e) => setAcceptsPrivacy(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#ff3ea5]"
            />
            <span>
              Acepto que Las Girls+ use estos datos para contactarme según la{" "}
              <Link href="/privacy-policy" className="font-semibold text-[#ff3ea5] underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="button"
            disabled={submitting || !fullName.trim() || !email.trim() || !phone.trim() || !acceptsPrivacy}
            onClick={() => void submit()}
            className="mt-2 bg-[#ff3ea5] px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-opacity disabled:opacity-40"
          >
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      )}
    </ModalShell>
  );
}
