import { z } from "zod";
const money = z
  .number()
  .min(0)
  .max(1000000)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001,
    "Use at most two decimal places",
  );
export const financialSchema = z.object({
  currency: z.enum(["PHP", "USD", "EUR", "GBP", "SGD"]),
  capital: money,
  price: money,
  variable: money,
  units: z.number().int().min(0).max(1000000),
});
export type FinancialValues = z.infer<typeof financialSchema>;
export const budgetSchema = z.object({
  name: z.string().trim().min(1, "Enter a cost name").max(120),
  category: z.enum(["startup", "monthly"]),
  amount: money,
  quantity: z.number().int().min(1).max(10000),
});
export type BudgetValues = z.infer<typeof budgetSchema>;
export const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task").max(160),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  done: z.boolean(),
});
export type TaskValues = z.infer<typeof taskSchema>;
