"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Noise } from "@/components/Noise";
import {
  leadSchema,
  type LeadFormValues,
  type LeadParsed,
} from "@/lib/validations/lead";
import { useDictionary } from "@/i18n/locale-provider";

type Panel = "whatsapp" | "email";

/** Solo línea inferior (sin caja completa): inputs, email, select y textarea alineados. */
const fieldBase =
  "w-full rounded-none border-0 border-b-2 border-black/35 bg-transparent px-0 py-2.5 font-display text-base uppercase tracking-[0.02em] text-black shadow-none outline-none ring-0 transition-colors placeholder:text-black/45 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:border-black";

const inputClassName = `${fieldBase}`;

const selectClassName = `${fieldBase} cursor-pointer appearance-none bg-transparent pr-8`;

const textareaClassName = `${fieldBase} min-h-[120px] resize-y`;

const labelClassName =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-black/60";

const submitClassName =
  "group inline-flex min-h-[52px] min-w-[180px] items-center justify-center gap-2 border-2 border-black bg-black px-6 font-display text-sm font-bold uppercase tracking-widest text-[#F3EEE8] transition-colors hover:bg-[#ff3ea5] hover:text-black disabled:cursor-not-allowed disabled:opacity-60";

const CARD_BG = "#F3EEE8";
const PANEL_BG = "#EFE7DD";

export function ContactForm() {
  const f = useDictionary().contactForm;
  const iq = f.inquiries;

  const [panel, setPanel] = useState<Panel>("whatsapp");
  const [successMessage, setSuccessMessage] = useState("");
  const [whatsappSubmitted, setWhatsappSubmitted] = useState(false);
  const [waError, setWaError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [waName, setWaName] = useState("");
  const [waPhone, setWaPhone] = useState("");

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      inquiryType: "",
      projectStage: "solo_idea",
      preferredContactMethod: "email",
      serviceInterest: [],
      acceptsPrivacy: false,
      source: "sitio-web",
    },
  });

  const submitLead = async (payload: LeadParsed) => {
    return fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  };

  const onEmailSubmit = form.handleSubmit(async (values) => {
    setIsSending(true);
    setSuccessMessage("");
    const response = await submitLead({
      ...values,
      acceptsPrivacy: true,
    } as LeadParsed);

    if (!response.ok) {
      form.setError("root", {
        message: f.errorSend,
      });
      setIsSending(false);
      return;
    }

    form.reset();
    setSuccessMessage(f.thankYou);
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
      message: f.whatsappInternalNote,
      source: "form-whatsapp",
      preferredContactMethod: "whatsapp",
      acceptsPrivacy: true,
    });

    if (!response.ok) {
      setWaError(f.errorWa);
      setIsSending(false);
      return;
    }

    setWhatsappSubmitted(true);
    setWaName("");
    setWaPhone("");
    setIsSending(false);
  };

  const renderTab = (
    target: Panel,
    number: string,
    title: string,
    subtitle: string,
  ) => {
    const active = panel === target;
    return (
      <button
        type="button"
        onClick={() => setPanel(target)}
        className={`group relative z-20 flex w-full items-center gap-4 border-b-2 border-black/25 px-5 py-5 text-left transition-colors md:px-8 md:py-7 ${
          active
            ? "bg-[#ff3ea5] text-black shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]"
            : "bg-[#fde4f2] text-black hover:bg-[#fbcfe8] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.07)] active:bg-[#f9b9dd]"
        }`}
        aria-expanded={active}
      >
        <span
          className={`font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${
            active ? "text-black/70" : "text-black/55"
          }`}
        >
          {number}
        </span>
        <span className="grid flex-1 gap-1">
          <span
            className={`font-display text-2xl uppercase leading-none tracking-tight md:text-4xl ${
              active ? "text-black" : "text-black"
            }`}
          >
            {title}
          </span>
          <span
            className={`text-xs md:text-sm ${
              active ? "text-black/70" : "text-black/60"
            }`}
          >
            {subtitle}
          </span>
        </span>
        <span
          aria-hidden
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] transition-transform md:text-[11px] ${
            active
              ? "translate-x-1 text-black"
              : "text-black/55 group-hover:translate-x-1 group-hover:text-black"
          }`}
        >
          {active ? f.tabActive : f.tabInactive}
        </span>
      </button>
    );
  };

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border-2 border-black/80 shadow-[0_10px_24px_rgba(17,17,17,0.14)]"
      style={{ backgroundColor: CARD_BG }}
    >
      {/* Noise overlay (same recipe as methodology cards) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-50 mix-blend-multiply"
        aria-hidden
      >
        <Noise
          patternSize={220}
          patternRefreshInterval={3}
          patternAlpha={28}
        />
      </div>

      {/* Floating spec label */}
      <span
        className="absolute -top-3 left-6 z-20 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-black/60"
        style={{ backgroundColor: CARD_BG }}
      >
        {f.formEyebrow}
      </span>

      {/* ─── TAB 01 — WHATSAPP ─── */}
      {renderTab(
        "whatsapp",
        "01",
        f.tab01Title,
        f.tab01Sub,
      )}

      {panel === "whatsapp" &&
        (whatsappSubmitted ? (
          <div
            className="relative z-10 px-6 py-12 md:px-10 md:py-16"
            style={{ backgroundColor: PANEL_BG }}
          >
            <div className="mx-auto max-w-xl text-center">
              <span className="inline-flex bg-[#ff3ea5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">
                {f.requestReceived}
              </span>
              <h3 className="mt-5 font-display text-3xl font-black uppercase leading-tight text-black md:text-5xl">
                {f.waSuccessTitleTe}
                <span className="text-[#ff3ea5]">.</span>
              </h3>
              <p className="mx-auto mt-4 max-w-[55ch] text-sm text-black/75 md:text-base">
                {f.waSuccessBody}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  className="border-2 border-black/60 bg-transparent px-5 py-3 font-display text-xs font-bold uppercase tracking-widest text-black transition-colors hover:border-black hover:bg-black hover:text-[#F3EEE8]"
                  onClick={() => setWhatsappSubmitted(false)}
                >
                  {f.btnClose}
                </button>
                <button
                  type="button"
                  className="bg-[#ff3ea5] px-5 py-3 font-display text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-[#F3EEE8]"
                  onClick={() => {
                    setWhatsappSubmitted(false);
                    setWaError("");
                    setWaName("");
                    setWaPhone("");
                  }}
                >
                  {f.btnAnother}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form
            className="relative z-10 grid gap-6 p-6 md:grid-cols-2 md:gap-8 md:p-10"
            style={{ backgroundColor: PANEL_BG }}
            onSubmit={onWhatsAppSubmit}
          >
            <div>
              <label className={labelClassName}>{f.labelName}</label>
              <input
                className={inputClassName}
                placeholder={f.phName}
                value={waName}
                onChange={(event) => setWaName(event.target.value)}
              />
            </div>
            <div>
              <label className={labelClassName}>{f.labelWhatsapp}</label>
              <input
                className={inputClassName}
                placeholder="+54 9 11 2345-6789"
                value={waPhone}
                onChange={(event) => setWaPhone(event.target.value)}
              />
            </div>
            <div className="flex justify-end md:col-span-2">
              <button
                type="submit"
                disabled={isSending || !waName || !waPhone}
                className={submitClassName}
              >
                {isSending ? f.btnSending : f.btnSendWa}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
            {waError && (
              <p className="border-l-2 border-red-600 bg-red-500/15 px-3 py-2 text-sm text-red-800 md:col-span-2">
                {waError}
              </p>
            )}
          </form>
        ))}

      {/* ─── TAB 02 — EMAIL ─── */}
      {renderTab("email", "02", f.tab02Title, f.tab02Sub)}

      {panel === "email" && (
        <form
          className="relative z-10 grid gap-6 p-6 md:grid-cols-2 md:gap-8 md:p-10"
          style={{ backgroundColor: PANEL_BG }}
          onSubmit={onEmailSubmit}
        >
          <div>
            <label className={labelClassName}>{f.fullNameLabel}</label>
            <input
              className={inputClassName}
              placeholder={f.phFullName}
              autoComplete="name"
              {...form.register("fullName")}
            />
          </div>
          <div>
            <label className={labelClassName}>{f.emailLabel}</label>
            <input
              className={inputClassName}
              type="email"
              placeholder={f.phEmail}
              autoComplete="email"
              {...form.register("email")}
            />
          </div>
          <div>
            <label className={labelClassName}>{f.inquiryLabel}</label>
            <select className={selectClassName} {...form.register("inquiryType")}>
              <option value="" disabled className="text-black/40">
                {f.inquiryPlaceholder}
              </option>
              <option className="bg-[#F3EEE8]" value="consulta_general">
                {iq.general}
              </option>
              <option className="bg-[#F3EEE8]" value="cotizar_servicio">
                {iq.quote}
              </option>
              <option className="bg-[#F3EEE8]" value="definir_estrategia">
                {iq.strategy}
              </option>
              <option className="bg-[#F3EEE8]" value="branding">
                {iq.branding}
              </option>
              <option className="bg-[#F3EEE8]" value="sitio_web">
                {iq.web}
              </option>
              <option className="bg-[#F3EEE8]" value="app">
                {iq.app}
              </option>
              <option className="bg-[#F3EEE8]" value="redes_contenido">
                {iq.socials}
              </option>
              <option className="bg-[#F3EEE8]" value="marketing_seo">
                {iq.marketing}
              </option>
              <option className="bg-[#F3EEE8]" value="otro">
                {iq.other}
              </option>
            </select>
          </div>
          <div>
            <label className={labelClassName}>{f.phoneLabel}</label>
            <input
              className={inputClassName}
              placeholder={f.phPhone}
              autoComplete="tel"
              {...form.register("phone")}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>{f.msgLabel}</label>
            <textarea
              className={textareaClassName}
              placeholder={f.msgPlaceholder}
              {...form.register("message")}
            />
          </div>
          <input
            type="hidden"
            value="solo_idea"
            {...form.register("projectStage")}
          />
          <input
            type="hidden"
            value="email"
            {...form.register("preferredContactMethod")}
          />
          <input
            type="hidden"
            value="sitio-web"
            {...form.register("source")}
          />
          <div className="flex justify-end md:col-span-2">
            <button
              type="submit"
              disabled={isSending}
              className={submitClassName}
            >
              {isSending ? f.sendingEmail : f.btnSendEmail}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
          {form.formState.errors.root?.message && (
            <p className="border-l-2 border-red-600 bg-red-500/15 px-3 py-2 text-sm text-red-800 md:col-span-2">
              {form.formState.errors.root.message}
            </p>
          )}
          {successMessage && (
            <div className="border-l-2 border-[#ff3ea5] bg-[#ff3ea5]/15 px-4 py-3 text-sm text-black md:col-span-2">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-black">
                {f.recvBadge}
              </span>
              {successMessage}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
