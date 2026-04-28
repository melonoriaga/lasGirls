import { z } from "zod";

export const validateCodeBodySchema = z.object({
  code: z.string().min(4).max(40),
});

export const redeemVipBodySchema = z.object({
  code: z.string().min(4).max(40),
  fullName: z.string().min(2, "Nombre demasiado corto."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(6, "Teléfono demasiado corto."),
  message: z.string().min(15, "Contanos un poco más sobre el proyecto."),
  acceptsPrivacy: z
    .boolean()
    .refine((v) => v === true, { message: "Tenés que aceptar para continuar." }),
});

export const discountInterestBodySchema = z.object({
  fullName: z.string().min(2, "Nombre demasiado corto."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(6, "Teléfono demasiado corto."),
  acceptsPrivacy: z
    .boolean()
    .refine((v) => v === true, { message: "Tenés que aceptar para continuar." }),
});
