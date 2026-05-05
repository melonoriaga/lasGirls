import { z } from "zod";

/** Estados comerciales del lead (incluye legado para lectura/escritura). */
export const leadPipelineStatusSchema = z.enum([
  "new",
  "reviewed",
  "awaiting_response",
  "lost",
  "contacted",
  "brief_pending",
  "budget_pending",
  "budget_sent",
  "awaiting_approval",
  "changes_requested",
  "docs_pending",
  "approved",
  "rejected",
  "converted",
  "in_followup",
  "qualified",
  "archived",
]);

export const budgetStatusSchema = z.enum([
  "not_sent",
  "sent",
  "awaiting_response",
  "approved",
  "rejected",
  "needs_changes",
]);

/** Estado de cada fila del historial de presupuestos (valores estables en Firestore). */
export const leadBudgetRecordStatusSchema = z.enum([
  "not_sent",
  "ready_to_send",
  "team_review",
  "sent",
  "awaiting_response",
  "client_review",
  "rejected",
  /** legado */
  "approved",
]);

export const currencySchema = z.enum(["ARS", "USD"]);

export const clientStatusSchema = z.enum([
  "active",
  "paused",
  "pending_onboarding",
  "inactive",
  "archived",
  /** legado */
  "completed",
]);

export const clientOnboardingStatusSchema = z.enum(["pending", "in_progress", "completed"]);

export const billingTypeSchema = z.enum([
  "monthly",
  "one_time",
  "hourly",
  "custom",
  /** legado */
  "monthly_retainer",
  "hybrid",
]);

export const invoiceStatusSchema = z.enum([
  "not_sent",
  "sent",
  "pending_payment",
  "partially_paid",
  "paid",
  "overdue",
  "draft",
  "cancelled",
]);

export const clientLinkCategorySchema = z.enum([
  "drive",
  "slides",
  "sheets",
  "figma",
  "invoice",
  "brief",
  "assets",
  "other",
]);

export const clientNoteTypeSchema = z.enum(["general", "meeting", "billing", "onboarding", "warning"]);

export const clientInvoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "pending_payment",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
]);

export const paymentTypeSchema = z.enum([
  "full_to_one_person",
  "split_between_people",
  "custom_split",
]);

export const paymentSplitSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  percentage: z.coerce.number().min(0).max(100).optional(),
});

export const clientPaymentCreateSchema = z
  .object({
    periodLabel: z.string().optional().or(z.literal("")),
    totalAmount: z.coerce.number().positive(),
    currency: currencySchema,
    receivedAt: z.string().min(4),
    paymentType: paymentTypeSchema,
    receivedByUserId: z.string().optional().or(z.literal("")),
    splits: z.array(paymentSplitSchema).default([]),
    relatedInvoiceId: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    if (data.paymentType === "full_to_one_person") {
      if (!data.receivedByUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá quién recibió el pago.",
          path: ["receivedByUserId"],
        });
      }
      return;
    }
    const sum = round2(data.splits.reduce((acc, s) => acc + s.amount, 0));
    const total = round2(data.totalAmount);
    if (data.splits.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agregá al menos un reparto en splits.",
        path: ["splits"],
      });
      return;
    }
    if (sum !== total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La suma de splits (${sum}) debe ser igual al total (${total}).`,
        path: ["splits"],
      });
    }
  });

const budgetLinkSchema = z
  .string()
  .min(1)
  .transform((s) => {
    const t = s.trim();
    if (!t) return t;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  })
  .pipe(z.string().url());

export const leadBudgetCreateSchema = z.object({
  link: budgetLinkSchema,
  status: leadBudgetRecordStatusSchema.default("sent"),
  /** Opcional; si no se envía, el servidor usa un título por defecto. */
  title: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().nonnegative().optional(),
  currency: currencySchema.default("USD"),
  sentAt: z.string().min(4).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export const clientLinkCreateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: clientLinkCategorySchema,
  description: z.string().optional().or(z.literal("")),
});

export const clientLinkPatchSchema = clientLinkCreateSchema.partial().extend({
  active: z.boolean().optional(),
});

const optionalInvoiceAmount = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = typeof v === "string" ? Number(String(v).replace(",", ".")) : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}, z.number().positive().finite().optional());

const clientInvoiceUpsertBaseSchema = z.object({
  periodLabel: z.string().min(1),
  invoiceLink: z.union([z.string().url(), z.literal("")]).optional(),
  collectionEmailSent: z.boolean().optional().default(false),
  collectionEmailSentAt: z.string().optional().or(z.literal("")),
  amount: optionalInvoiceAmount,
  currency: currencySchema.optional(),
});

/** Alta de factura (título obligatorio; moneda obligatoria si hay monto). */
export const clientInvoiceUpsertSchema = clientInvoiceUpsertBaseSchema.superRefine((data, ctx) => {
  if (data.amount !== undefined && data.amount > 0 && !data.currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Elegí una moneda si cargás monto.",
      path: ["currency"],
    });
  }
});

/** PATCH parcial; la moneda puede omitirse si el servidor ya tiene una o usa USD por defecto. */
export const clientInvoicePatchSchema = clientInvoiceUpsertBaseSchema.partial();

export const invoiceRecordPaymentSchema = z
  .object({
    kind: z.enum(["full", "partial"]),
    paidAt: z.string().min(4),
    amount: optionalInvoiceAmount,
    currency: currencySchema.optional(),
    note: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "partial" && data.amount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indicá el monto del pago parcial.",
        path: ["amount"],
      });
    }
  });

export const clientNoteCreateSchema = z.object({
  content: z.string().min(1),
  type: clientNoteTypeSchema.default("general"),
});

export const clientTypeSchema = z.enum(["one_time", "recurring", "vip", "internal"]);
export const billingFrequencySchema = z.enum(["monthly", "biweekly", "per_project", "per_milestone", "custom"]);
export const clientHealthSchema = z.enum(["healthy", "at_risk", "delayed", "inactive"]);

export const clientPatchSchema = z.object({
  fullName: z.string().min(2).optional(),
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  brandName: z.string().optional().or(z.literal("")),
  status: clientStatusSchema.optional(),
  serviceType: z.array(z.string()).optional(),
  onboardingStatus: clientOnboardingStatusSchema.optional(),
  billingType: billingTypeSchema.optional(),
  monthlyFee: z.coerce.number().nonnegative().optional(),
  currency: currencySchema.optional(),
  invoiceStatus: invoiceStatusSchema.optional(),
  lastInvoiceSentAt: z.string().optional().or(z.literal("")),
  lastInvoiceLink: z.string().optional().or(z.literal("")),
  nextInvoiceDate: z.string().optional().or(z.literal("")),
  accountManagerUserId: z.string().optional().or(z.literal("")),
  clientType: clientTypeSchema.optional(),
  billingFrequency: billingFrequencySchema.optional(),
  health: clientHealthSchema.optional(),
  tags: z.array(z.string()).optional(),
  emails: z
    .array(
      z.object({
        email: z.string().email(),
        reference: z.string().optional(),
        type: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }),
    )
    .optional(),
  phones: z
    .array(
      z.object({
        number: z.string().min(3),
        reference: z.string().optional(),
        type: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }),
    )
    .optional(),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().optional(),
        email: z.string().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  internalNotes: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});
