import { z } from "zod";

export const paymentMethodEnum = z.enum(["CASH", "DEBIT_CARD", "CREDIT_CARD", "BANK_TRANSFER", "UPI", "OTHER"]);

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  date: z.string().datetime().or(z.string().min(1)),
  userId: z.string().min(1, "Person is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategory: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required").max(500),
  paymentMethod: paymentMethodEnum,
  notes: z.string().max(2000).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  userId: z.string().optional(),
  categoryId: z.string().optional(),
  paymentMethod: paymentMethodEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(200).optional().default(50),
});

export const createIncomeSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().positive("Amount must be greater than zero"),
  source: z.string().min(1, "Source is required").max(200),
  userId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().positive("Amount must be greater than zero"),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  initials: z.string().min(1).max(4).optional(),
  isActive: z.boolean().optional(),
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  password: passwordSchema.optional(),
  color: z.string().optional(),
});

export const loginSchema = z.object({
  name: z.string().min(1, "Please select who you are"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const updateSettingsSchema = z.object({
  warningThresholdPercent: z.number().int().min(1).max(100).optional(),
  criticalThresholdPercent: z.number().int().min(1).max(200).optional(),
  creditCardWarningPaise: z.number().int().min(0).optional(),
  budgetWarningPercent: z.number().int().min(1).max(100).optional(),
  budgetCriticalPercent: z.number().int().min(1).max(200).optional(),
});

export const budgetPlanRequestSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  income: z.number().nonnegative(),
  fixedExpenses: z
    .array(
      z.object({
        label: z.string().min(1, "Label is required").max(100),
        amount: z.number().positive("Amount must be greater than zero"),
        categoryId: z.string().optional().nullable(),
      })
    )
    .max(30),
});

export const applyBudgetPlanSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  allocations: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        amount: z.number().positive("Amount must be greater than zero"),
      })
    )
    .min(1),
});

export const periodQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
