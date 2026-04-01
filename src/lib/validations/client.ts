import { z } from "zod";

export const clientSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  status: z.enum(["active", "paused", "completed", "archived"]),
  billingModel: z.enum(["one_time", "monthly_retainer", "hybrid"]),
  paymentStatus: z.enum(["pending", "partial", "paid", "overdue", "recurring"]),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().default("USD"),
});

export type ClientInput = z.infer<typeof clientSchema>;
