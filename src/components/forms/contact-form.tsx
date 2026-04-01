"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { leadSchema, type LeadFormInput } from "@/lib/validations/lead";

type Panel = "whatsapp" | "email";

export function ContactForm() {
  const [panel, setPanel] = useState<Panel>("whatsapp");
  const [successMessage, setSuccessMessage] = useState("");
  const [waSuccess, setWaSuccess] = useState("");
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
    setWaSuccess("");

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
      setWaSuccess("No pudimos guardar tu solicitud. Probá de nuevo en un momento.");
      setIsSending(false);
      return;
    }

    setWaSuccess("Perfecto. Te escribimos por WhatsApp en breve.");
    setWaName("");
    setWaPhone("");
    setIsSending(false);
  };

  return (
    <section className="flex min-h-screen items-center bg-[#f4ede6] px-4 py-16 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="font-display text-6xl uppercase leading-[0.84] md:text-8xl">Contact</h2>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-black/20 bg-[#f2ece5]">
          <button
            type="button"
            className={`lg-contact-tab ${panel === "whatsapp" ? "is-active bg-[#ffd6e8]" : "bg-[#f8d4de]"}`}
            onClick={() => setPanel("whatsapp")}
          >
            <span>01.</span>
            <span className="font-display text-5xl uppercase leading-[0.84] md:text-6xl">Whatsapp</span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.18em]">[click para usar]</span>
          </button>

          {panel === "whatsapp" && (
            <form className="grid gap-4 p-6 md:grid-cols-2 md:p-10" onSubmit={onWhatsAppSubmit}>
              <div>
                <label className="lg-contact-label">First Name</label>
                <input className="lg-paper-input" placeholder="Tu nombre" value={waName} onChange={(event) => setWaName(event.target.value)} />
              </div>
              <div>
                <label className="lg-contact-label">Phone Number</label>
                <input className="lg-paper-input" placeholder="Tu WhatsApp" value={waPhone} onChange={(event) => setWaPhone(event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSending || !waName || !waPhone}
                  className={`lg-contact-submit ${waName && waPhone ? "is-ready" : ""}`}
                >
                  {isSending ? "Enviando..." : "Submit"}
                </button>
              </div>
              {waSuccess && <p className="text-sm text-black/70 md:col-span-2">{waSuccess}</p>}
            </form>
          )}

          <button
            type="button"
            className={`lg-contact-tab ${panel === "email" ? "is-active bg-[#ffd6e8]" : "bg-[#f8d4de]"}`}
            onClick={() => setPanel("email")}
          >
            <span>02.</span>
            <span className="font-display text-5xl uppercase leading-[0.84] md:text-6xl">Email</span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.18em]">[click para usar]</span>
          </button>

          {panel === "email" && (
            <form className="grid gap-4 p-6 md:grid-cols-2 md:p-10" onSubmit={onEmailSubmit}>
              <div>
                <label className="lg-contact-label">First Name</label>
                <input className="lg-paper-input" {...form.register("fullName")} />
              </div>
              <div>
                <label className="lg-contact-label">Email Address</label>
                <input className="lg-paper-input" type="email" {...form.register("email")} />
              </div>
              <div>
                <label className="lg-contact-label">Project Type</label>
                <select className="lg-paper-input" {...form.register("inquiryType")}>
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
                <label className="lg-contact-label">Phone</label>
                <input className="lg-paper-input" {...form.register("phone")} />
              </div>
              <div className="md:col-span-2">
                <label className="lg-contact-label">Tell us about your project</label>
                <textarea className="lg-paper-input min-h-[88px]" {...form.register("message")} />
              </div>
              <input type="hidden" value="solo_idea" {...form.register("projectStage")} />
              <input type="hidden" value="email" {...form.register("preferredContactMethod")} />
              <input type="hidden" value="sitio-web" {...form.register("source")} />
              <div className="md:col-span-2">
                <button type="submit" disabled={isSending} className="lg-contact-submit is-ready">
                  {isSending ? "Enviando..." : "Submit"}
                </button>
              </div>
              {form.formState.errors.root?.message && (
                <p className="text-sm text-red-700 md:col-span-2">{form.formState.errors.root.message}</p>
              )}
              {successMessage && <p className="text-sm text-emerald-700 md:col-span-2">{successMessage}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
