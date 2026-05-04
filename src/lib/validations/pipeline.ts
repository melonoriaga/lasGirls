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

export const leadBudgetRecordStatusSchema = z.enum([
  "sent",
  "awaiting_response",
  "approved",
  "rejected",
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

export const leadBudgetCreateSchema = z.object({
  title: z.string().min(1),
  link: z.string().url(),
  amount: z.coerce.number().nonnegative().optional(),
  currency: currencySchema.default("USD"),
  sentAt: z.string().min(4),
  status: leadBudgetRecordStatusSchema.default("sent"),
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

export const clientInvoiceCreateSchema = z.object({
  periodLabel: z.string().min(1),
  invoiceNumber: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().nonnegative(),
  currency: currencySchema,
  status: clientInvoiceStatusSchema.default("draft"),
  sentAt: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  paidAt: z.string().optional().or(z.literal("")),
  invoiceLink: z.union([z.string().url(), z.literal("")]).optional(),
  notes: z.string().optional().or(z.literal("")),
  collectionEmailSent: z.boolean().optional().default(false),
  collectionEmailSentAt: z.string().optional().or(z.literal("")),
  invoiceEmailSent: z.boolean().optional().default(false),
  invoiceEmailSentAt: z.string().optional().or(z.literal("")),
  isPaid: z.boolean().optional().default(false),
  receivedByUserId: z.string().optional().or(z.literal("")),
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
