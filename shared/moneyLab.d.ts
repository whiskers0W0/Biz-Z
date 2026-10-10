import type { ZodType } from "zod";
export type CalculationInput = {
  title: string;
  kind: string;
  currency: string;
  inputs: Record<string, number>;
};
export const currencies: string[];
export const calculators: {
  id: string;
  name: string;
  description: string;
  fields: { key: string; label: string; help: string; unit: string }[];
  formula: string;
  note: string;
}[];
export const calculationSchema: ZodType<CalculationInput, CalculationInput>;
export function calculate(
  kind: string,
  inputs: Record<string, number>,
): { label: string; value: number | null; unit: string }[];
