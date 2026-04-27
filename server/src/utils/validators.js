import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(10).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
});

export const accountSchema = z.object({
  ownerId: z.string().min(1).optional().nullable(),
  accountName: z.string().min(2).max(80),
  gmailEmail: z.string().email(),
  location: z.string().min(2).max(120),
  monthlyCost: z.coerce.number().positive().max(100000),
  currency: z.enum(["USD", "SGD", "MYR", "MMK"]).optional().default("MYR"),
  billingDate: z.coerce.date().optional().nullable(),
  billingDay: z.coerce.number().int().min(1).max(31).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BACKUP", "CANCELLED"]),
  notes: z.string().max(1000).optional().nullable()
});

export const ownerSchema = z.object({
  name: z.string().min(2).max(100),
  contact: z.string().max(160).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(60).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const paymentSchema = z.object({
  accountId: z.string().min(1),
  date: z.coerce.date().optional(),
  amount: z.coerce.number().positive().max(100000),
  method: z.enum(["CARD", "BANK_TRANSFER", "CASH", "PAYPAL", "OTHER"]).default("CARD"),
  reference: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const receivableSchema = z.object({
  accountId: z.string().min(1).optional().nullable(),
  paymentId: z.string().min(1).optional().nullable(),
  debtorName: z.string().min(2).max(100),
  debtorContact: z.string().max(160).optional().nullable(),
  description: z.string().min(2).max(200),
  amount: z.coerce.number().positive().max(100000),
  amountReceived: z.coerce.number().min(0).max(100000).optional().default(0),
  dueDate: z.coerce.date().optional().nullable(),
  status: z.enum(["OPEN", "PARTIAL", "PAID", "WAIVED"]).optional(),
  notes: z.string().max(1000).optional().nullable()
});

export const receivableReceiveSchema = z.object({
  amount: z.coerce.number().positive().max(100000),
  notes: z.string().max(1000).optional().nullable()
});

export const settingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  currency: z.enum(["USD", "SGD", "MYR", "MMK"]).optional(),
  inactivityMs: z.coerce.number().int().min(300000).max(86400000).optional(),
  appName: z.string().min(2).max(80).optional()
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({ message: "Validation failed", errors: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}
