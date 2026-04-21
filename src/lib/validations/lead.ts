import { z } from "zod";
import { leadPipelineStatusSchema } from "@/lib/validations/pipeline";

/** Estados del lead en admin (pipeline + legado). */
export const leadStatusSchema = leadPipelineStatusSchema;

/** Valores válidos para tipo de consulta (formulario + API). */
export const INQUIRY_TYPES = [
  "consulta_general",
  "cotizar_servicio",
  "definir_estrategia",
  "branding",
  "sitio_web",
  "app",
  "redes_contenido",
  "marketing_seo",
  "otro",
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

export const leadSchema = z.object({
  fullName: z
    .string()
    .min(2, "Contanos tu nombre completo."),
  email: z
    .string()
    .email("Revisá el email, parece incompleto."),
  phone: z.string().min(6, "Sumá un teléfono o WhatsApp para agilizar."),
  company: z.string().optional().or(z.literal("")),
  inquiryType: z
    .string()
    .min(1, "Seleccioná tipo de consulta.")
    .refine(
      (val): val is InquiryType =>
        (INQUIRY_TYPES as readonly string[]).includes(val),
      { message: "Seleccioná un tipo de consulta válido." },
    ),
  serviceInterest: z.array(z.string()).optional(),
  budgetRange: z.string().optional().or(z.literal("")),
  projectStage: z.enum([
    "solo_idea",
    "empezando",
    "marca_necesita_crecer",
    "web_app_necesita_mejorar",
    "acompanamiento_integral",
  ]),
  message: z
    .string()
    .min(15, "Contanos un poco más para orientarte mejor."),
  source: z.string().min(2),
  preferredContactMethod: z.enum(["email", "whatsapp", "telefono"]),
  acceptsPrivacy: z.boolean().refine((value) => value, {
    message: "Necesitamos tu aceptación para guardar tus datos de contacto.",
  }),
});

/** Payload validado (API + envíos exitosos). */
export type LeadParsed = z.infer<typeof leadSchema>;

/** Estado del formulario (incluye placeholders como `inquiryType: ""`). */
export type LeadFormValues = z.input<typeof leadSchema>;
