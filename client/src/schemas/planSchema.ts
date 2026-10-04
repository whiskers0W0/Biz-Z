import { z } from "zod";
export const planSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give your business a name with at least 2 characters.")
    .max(120, "Keep the name under 120 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Keep your idea under 2,000 characters."),
});
export type PlanFormValues = z.infer<typeof planSchema>;
