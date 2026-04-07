import { z } from "zod";

export const expenseCategorySchema = z.enum([
  "dominio",
  "hosting",
  "suscripcion",
  "diseno",
  "publicidad",
  "otros",
]);

const participantSchema = z.object({
  memberId: z.string().min(1),
  shareType: z.enum(["percentage", "fixed"]),
  shareValue: z.number(),
});

export const createExpenseMovementSchema = z
  .object({
    periodId: z.string().regex(/^\d{4}-\d{2}$/),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    category: expenseCategorySchema.optional(),
    amount: z.number().positive(),
    currency: z.string().min(1).max(12).toUpperCase(),
    date: z.string().min(1),
    paidByMemberId: z.string().min(1),
    splitMode: z.enum(["equal", "custom"]),
    participants: z.array(participantSchema).min(1),
  })
  .strict();

export const updateExpenseMovementSchema = createExpenseMovementSchema
  .partial()
  .extend({
    periodId: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  })
  .strict();

export const createSettlementMovementSchema = z
  .object({
    periodId: z.string().regex(/^\d{4}-\d{2}$/),
    fromMemberId: z.string().min(1),
    toMemberId: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(1).max(12).toUpperCase(),
    date: z.string().min(1),
    note: z.string().max(2000).optional(),
  })
  .strict()
  .refine((b) => b.fromMemberId !== b.toMemberId, {
    message: "Quién paga y quién recibe no puede ser la misma persona.",
    path: ["toMemberId"],
  });

export const postExpenseMovementSchema = createExpenseMovementSchema.extend({
  kind: z.literal("expense"),
});

export const postSettlementMovementSchema = createSettlementMovementSchema.extend({
  kind: z.literal("settlement"),
});

export const postMovementSchema = z.discriminatedUnion("kind", [
  postExpenseMovementSchema,
  postSettlementMovementSchema,
]);

export const createRecurrenceSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    category: expenseCategorySchema.optional(),
    amount: z.number().positive(),
    currency: z.string().min(1).max(12).toUpperCase(),
    paidByMemberId: z.string().min(1),
    splitMode: z.enum(["equal", "custom"]),
    participants: z.array(participantSchema).min(1),
    frequency: z.literal("monthly"),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/),
    endMonth: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.null()]).optional(),
    dayOfMonth: z.union([z.number().int().min(1).max(31), z.null()]).optional(),
  })
  .strict();

export const updateRecurrenceSchema = createRecurrenceSchema.partial().strict();

export const deactivateRecurrenceBodySchema = z
  .object({
    endMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  })
  .strict();
