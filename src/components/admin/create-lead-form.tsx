"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-300 focus:ring-rose-300";

type CreateLeadFormProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  hideHeader?: boolean;
  className?: string;
};

export function CreateLeadForm({ onSuccess, onError, hideHeader = false, className = "" }: CreateLeadFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectStage, setProjectStage] = useState("solo_idea");
  const [budgetRange, setBudgetRange] = useState("");
  const [serviceInterest, setServiceInterest] = useState("");
  const [tags, setTags] = useState("");
  const [inquiryType, setInquiryType] = useState("consulta_general");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createLead = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          projectStage,
          budgetRange,
          tags: tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          serviceInterest: serviceInterest
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          inquiryType,
          message,
          source: "admin-manual",
          preferredContactMethod: "email",
        }),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        const message = json.error ?? "No pudimos crear el lead.";
        setError(message);
        onError?.(message);
        return;
      }
      setFullName("");
      setEmail("");
      setPhone("");
      setProjectStage("solo_idea");
      setBudgetRange("");
      setServiceInterest("");
      setTags("");
      setInquiryType("consulta_general");
      setMessage("");
      onSuccess?.();
      router.refresh();
    } catch {
      const message = "No pudimos crear el lead por un error de red o servidor.";
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={`rounded-2xl border border-zinc-200 bg-white p-4 ${className}`}>
      {!hideHeader ? (
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Cargar lead manual</p>
      ) : null}
      <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={createLead}>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Nombre completo</span>
          <input className={inputClassName} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Email</span>
          <input className={inputClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Teléfono / WhatsApp</span>
          <input className={inputClassName} value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Tipo de consulta</span>
          <select className={inputClassName} value={inquiryType} onChange={(event) => setInquiryType(event.target.value)}>
            <option value="consulta_general">Consulta general</option>
            <option value="cotizar_servicio">Cotizar servicio</option>
            <option value="definir_estrategia">Definir estrategia</option>
            <option value="branding">Branding</option>
            <option value="sitio_web">Sitio web</option>
            <option value="app">App</option>
            <option value="redes_contenido">Redes / contenido</option>
            <option value="marketing_seo">Marketing / SEO</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Etapa del proyecto</span>
          <select className={inputClassName} value={projectStage} onChange={(event) => setProjectStage(event.target.value)}>
            <option value="solo_idea">Solo idea</option>
            <option value="validando">Validando propuesta</option>
            <option value="listo_para_empezar">Lista para empezar</option>
            <option value="en_proceso">En proceso con otro equipo</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Presupuesto estimado</span>
          <input className={inputClassName} value={budgetRange} onChange={(event) => setBudgetRange(event.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Servicios (coma separada)</span>
          <input className={inputClassName} value={serviceInterest} onChange={(event) => setServiceInterest(event.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Tags (coma separada)</span>
          <input className={inputClassName} value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label className="grid gap-1 md:col-span-3">
          <span className="text-xs font-medium text-zinc-600">Mensaje</span>
          <textarea
            className={`${inputClassName} min-h-[96px]`}
            placeholder="Mensaje breve de contexto..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-700 md:col-span-3">{error}</p> : null}
        <div className="flex justify-end md:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-rose-400 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Crear lead"}
          </button>
        </div>
      </form>
    </article>
  );
}
