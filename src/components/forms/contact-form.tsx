"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { leadSchema, type LeadFormInput } from "@/lib/validations/lead";

type Panel = "whatsapp" | "email";

export function ContactForm() {
  const [panel, setPanel] = useState<Panel>("whatsapp");
  const [successMessage, setSuccessMessage] = useState("");
  const [whatsappSubmitted, setWhatsappSubmitted] = useState(false);
  const [waError, setWaError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [waName, setWaName] = useState("");
  const [waPhone, setWaPhone] = useState("");

  const form = useForm<LeadFormInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      inquiryType: "consulta_general",
      projectStage: "solo_idea",
      preferredContactMethod: "email",
      serviceInterest: [],
      acceptsPrivacy: false,
      source: "sitio-web",
    },
  });

  const submitLead = async (payload: LeadFormInput) => {
    return fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  };

  const onEmailSubmit = form.handleSubmit(async (values) => {
    setIsSending(true);
    setSuccessMessage("");
    const response = await submitLead({ ...values, acceptsPrivacy: true });

    if (!response.ok) {
      form.setError("root", {
        message:
          "No pudimos enviar tu consulta ahora. Probá nuevamente en unos minutos o escribinos por WhatsApp.",
      });
      setIsSending(false);
      return;
    }

    form.reset();
    setSuccessMessage(
      "Gracias por escribirnos. Vamos a revisar tu consulta y responderte lo antes posible. Si tu idea todavía está verde, no pasa nada: también acompañamos esa etapa.",
    );
    setIsSending(false);
  });

  const onWhatsAppSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!waName || !waPhone) return;
    setIsSending(true);
    setWaError("");

    const response = await submitLead({
      fullName: waName,
      email: "pendiente@lasgirls.local",
      phone: waPhone,
      company: "",
      inquiryType: "consulta_general",
      serviceInterest: [],
      budgetRange: "",
      projectStage: "solo_idea",
      message: "Solicita contacto inicial por WhatsApp.",
      source: "form-whatsapp",
      preferredContactMethod: "whatsapp",
      acceptsPrivacy: true,
    });

    if (!response.ok) {
      setWaError("No pudimos guardar tu solicitud. Probá de nuevo en un momento.");
      setIsSending(false);
      return;
    }

    setWhatsappSubmitted(true);
    setWaName("");
    setWaPhone("");
    setIsSending(false);
  };

  const inputClassName =
    "w-full border-b border-black/40 bg-transparent px-0 py-2 text-sm text-black placeholder:text-black/45 focus:border-[#ff2f9d] focus:outline-none";
  const labelClassName = "mb-1 block text-[11px] uppercase tracking-[0.16em] text-black/65";
  const tabBaseClassName =
    "w-full flex items-center gap-3 border-b border-black/20 px-4 py-4 text-left transition md:px-6 md:py-5";
  const tabTitleClassName = "font-display text-4xl uppercase leading-[0.88] text-black md:text-6xl";

  return (
    <div className="overflow-hidden rounded-[22px] border border-black/20 bg-[#f2ece5]">
      <button
        type="button"
        onClick={() => setPanel("whatsapp")}
        className={`${tabBaseClassName} ${panel === "whatsapp" ? "bg-[#ffd6e8]" : "bg-[#f8d4de] hover:bg-[#f4c9d6]"}`}
      >
        <span className="text-[11px] uppercase tracking-[0.2em] text-black/60">01.</span>
        <span className="grid gap-1">
          <span className={tabTitleClassName}>WhatsApp</span>
          <span className="text-xs text-black/65 md:text-[13px]">Quiero que me contacten por WhatsApp.</span>
        </span>
        <span className="ml-auto hidden text-[11px] uppercase tracking-[0.12em] text-black/55 md:block">
          [click para usar]
        </span>
      </button>

      {panel === "whatsapp" &&
        (whatsappSubmitted ? (
          <div className="bg-[#ff8fc8] px-6 py-10 md:px-8 md:py-12">
            <h3 className="text-center font-display text-4xl uppercase leading-[0.9] text-black md:text-5xl">
              Solicitud de contacto enviada
            </h3>
            <p className="mx-auto mt-3 max-w-[55ch] text-center text-sm text-black/80 md:text-base">
              Te vamos a escribir por WhatsApp en breve para entender bien tu proyecto y acompañarte desde
              esta etapa.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="border-2 border-black bg-[#ffd6e8] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#111]"
                onClick={() => setWhatsappSubmitted(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="border-2 border-black bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffd6e8] transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#111]"
                onClick={() => {
                  setWhatsappSubmitted(false);
                  setWaError("");
                  setWaName("");
                  setWaPhone("");
                }}
              >
                Enviar otro numero
              </button>
            </div>
          </div>
        ) : (
          <form className="grid gap-5 p-6 md:grid-cols-2 md:gap-6 md:p-10" onSubmit={onWhatsAppSubmit}>
            <div>
              <label className={labelClassName}>Nombre</label>
              <input className={inputClassName} placeholder="Tu nombre" value={waName} onChange={(event) => setWaName(event.target.value)} />
            </div>
            <div>
              <label className={labelClassName}>WhatsApp</label>
              <input className={inputClassName} placeholder="+54..." value={waPhone} onChange={(event) => setWaPhone(event.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSending || !waName || !waPhone}
                className={`min-h-[48px] min-w-[160px] rounded-full border px-5 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
                  waName && waPhone
                    ? "border-[#ff6faf] bg-[#ff6faf] text-white hover:border-[#ff5ea6] hover:bg-[#ff5ea6]"
                    : "border-black/35 bg-transparent text-black/45"
                } disabled:cursor-not-allowed disabled:opacity-85`}
              >
                {isSending ? "Enviando..." : "Submit"}
              </button>
            </div>
            {waError && <p className="text-sm text-red-700 md:col-span-2">{waError}</p>}
          </form>
        ))}

      <button
        type="button"
        onClick={() => setPanel("email")}
        className={`${tabBaseClassName} ${panel === "email" ? "bg-[#ffd6e8]" : "bg-[#f8d4de] hover:bg-[#f4c9d6]"}`}
      >
        <span className="text-[11px] uppercase tracking-[0.2em] text-black/60">02.</span>
        <span className="grid gap-1">
          <span className={tabTitleClassName}>Email</span>
          <span className="text-xs text-black/65 md:text-[13px]">Quiero que me contacten por email.</span>
        </span>
        <span className="ml-auto hidden text-[11px] uppercase tracking-[0.12em] text-black/55 md:block">
          [click para usar]
        </span>
      </button>

      {panel === "email" && (
        <form className="grid gap-5 p-6 md:grid-cols-2 md:gap-6 md:p-10" onSubmit={onEmailSubmit}>
          <div>
            <label className={labelClassName}>Nombre completo</label>
            <input className={inputClassName} {...form.register("fullName")} />
          </div>
          <div>
            <label className={labelClassName}>Email</label>
            <input className={inputClassName} type="email" {...form.register("email")} />
          </div>
          <div>
            <label className={labelClassName}>Tipo de consulta</label>
            <select className={inputClassName} {...form.register("inquiryType")}>
              <option value="consulta_general">Consulta general</option>
              <option value="cotizar_servicio">Quiero cotizar un servicio</option>
              <option value="definir_estrategia">Necesito ayuda para definir qué hacer</option>
              <option value="branding">Branding</option>
              <option value="sitio_web">Sitio web</option>
              <option value="app">App</option>
              <option value="redes_contenido">Redes / contenido</option>
              <option value="marketing_seo">Marketing / pauta / SEO</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className={labelClassName}>Teléfono</label>
            <input className={inputClassName} {...form.register("phone")} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Mensaje</label>
            <textarea className={`${inputClassName} min-h-[120px] resize-y`} {...form.register("message")} />
          </div>
          <input type="hidden" value="solo_idea" {...form.register("projectStage")} />
          <input type="hidden" value="email" {...form.register("preferredContactMethod")} />
          <input type="hidden" value="sitio-web" {...form.register("source")} />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="min-h-[48px] min-w-[160px] rounded-full border border-[#ff6faf] bg-[#ff6faf] px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:border-[#ff5ea6] hover:bg-[#ff5ea6] disabled:cursor-not-allowed disabled:opacity-85"
            >
              {isSending ? "Enviando..." : "Submit"}
            </button>
          </div>
          {form.formState.errors.root?.message && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
              {form.formState.errors.root.message}
            </p>
          )}
          {successMessage && (
            <p className="inline-block border-2 border-black bg-[#ff6faf] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-black shadow-[6px_6px_0_#111] md:col-span-2">
              {successMessage}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
