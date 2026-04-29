import { z } from "zod";

export const createVipCodeSchema = z.object({
  code: z.string().min(4).max(40),
  maxUses: z.number().int().min(1).max(999_999),
  expiresAt: z.string().min(8),
  notes: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
});

export const patchVipCodeSchema = z.object({
  maxUses: z.number().int().min(1).max(999_999).optional(),
  expiresAt: z.string().min(8).optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});
