"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { leadSchema, type LeadFormInput } from "@/lib/validations/lead";

const inquiryOptions = [
  { value: "consulta_general", label: "Consulta general" },
  { value: "cotizar_servicio", label: "Quiero cotizar un servicio" },
  { value: "definir_estrategia", label: "Necesito ayuda para definir qué hacer" },
  { value: "branding", label: "Branding" },
  { value: "sitio_web", label: "Sitio web" },
  { value: "app", label: "App" },
  { value: "redes_contenido", label: "Redes / contenido" },
  { value: "marketing_seo", label: "Marketing / pauta / SEO" },
  { value: "otro", label: "Otro" },
] as const;

export function ContactForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
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

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSending(true);
    setSuccessMessage("");

    const response = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
    });

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

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2 md:grid-cols-2">
        <input placeholder="Nombre completo" className="field" {...form.register("fullName")} />
        <input placeholder="Email" className="field" {...form.register("email")} />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input placeholder="Teléfono / WhatsApp" className="field" {...form.register("phone")} />
        <input placeholder="Empresa / marca (opcional)" className="field" {...form.register("company")} />
      </div>
      <select className="field" {...form.register("inquiryType")}>
        {inquiryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select className="field" {...form.register("projectStage")}>
        <option value="solo_idea">Solo tengo una idea</option>
        <option value="empezando">Estoy empezando</option>
        <option value="marca_necesita_crecer">Ya tengo marca pero necesito crecer</option>
        <option value="web_app_necesita_mejorar">Ya tengo web/app pero necesito mejorar</option>
        <option value="acompanamiento_integral">Necesito acompañamiento integral</option>
      </select>
      <textarea
        className="field min-h-32"
        placeholder="Contanos qué necesitás, en qué etapa estás y qué te gustaría lograr."
        {...form.register("message")}
      />
      <div className="grid gap-2 md:grid-cols-2">
        <input placeholder="¿Cómo nos conociste?" className="field" {...form.register("source")} />
        <select className="field" {...form.register("preferredContactMethod")}>
          <option value="email">Prefiero email</option>
          <option value="whatsapp">Prefiero WhatsApp</option>
          <option value="telefono">Prefiero llamada</option>
        </select>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" {...form.register("acceptsPrivacy")} />
        <span>Acepto la política de privacidad y el tratamiento de datos para esta consulta.</span>
      </label>
      {form.formState.errors.root?.message && (
        <p className="text-sm text-red-700">{form.formState.errors.root.message}</p>
      )}
      {successMessage && <p className="text-sm text-emerald-700">{successMessage}</p>}
      <Button disabled={isSending} type="submit" className="w-full md:w-fit">
        {isSending ? "Enviando..." : "Enviar consulta"}
      </Button>
    </form>
  );
}
