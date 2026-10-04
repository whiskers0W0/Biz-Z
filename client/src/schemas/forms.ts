import { z } from "zod";
export const accountSchema = z.object({
  name: z.string().trim().max(60),
  email: z.string().email("Enter a valid email").max(254),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});
export type AccountValues = z.infer<typeof accountSchema>;
export const profileFormSchema = z.object({
  interests: z
    .array(z.string())
    .length(5, "Select exactly five interests")
    .refine((a) => new Set(a).size === 5),
  traits: z
    .array(z.string())
    .length(5, "Select exactly five traits")
    .refine((a) => new Set(a).size === 5),
  skills: z.string().max(2000),
  hours: z.number().min(1).max(168),
  capital: z.number().min(0).max(1e12),
  monthly: z.number().min(0).max(1e12),
  location: z.string().trim().min(1, "Enter your city and country").max(200),
  currency: z
    .string()
    .refine((c) => ["PHP", "USD", "EUR", "GBP", "SGD"].includes(c)),
});
export type ProfileValues = z.infer<typeof profileFormSchema>;
export const messageSchema = z.object({
  message: z.string().trim().min(1, "Enter a short answer").max(4000),
});
export type MessageValues = z.infer<typeof messageSchema>;
export const draftSchema = z.object({
  draft: z.string().max(30000, "Drafts can contain up to 30,000 characters"),
});
