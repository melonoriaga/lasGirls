import { z } from "zod";

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "in_followup",
  "qualified",
  "archived",
  "converted",
]);

export const leadSchema = z.object({
  fullName: z
    .string()
    .min(2, "Contanos tu nombre completo."),
  email: z
    .string()
    .email("Revisá el email, parece incompleto."),
  phone: z.string().min(6, "Sumá un teléfono o WhatsApp para agilizar."),
  company: z.string().optional().or(z.literal("")),
  inquiryType: z.enum([
    "consulta_general",
    "cotizar_servicio",
    "definir_estrategia",
    "branding",
    "sitio_web",
    "app",
    "redes_contenido",
    "marketing_seo",
    "otro",
  ]),
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

export type LeadFormInput = z.infer<typeof leadSchema>;
