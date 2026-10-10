import { z } from "zod";
export const currencies = [
  "PHP",
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "AUD",
  "CAD",
  "NZD",
  "HKD",
  "CNY",
  "JPY",
  "KRW",
  "INR",
  "MYR",
  "THB",
  "IDR",
  "VND",
  "AED",
  "SAR",
  "CHF",
];
const field = (key, label, help, unit = "money") => ({
  key,
  label,
  help,
  unit,
});
export const calculators = [
  {
    id: "profit",
    name: "Monthly profit",
    description: "See what is left after operating costs.",
    fields: [
      field("price", "Selling price", "Amount charged for one sale."),
      field(
        "cost",
        "Cost per sale",
        "Materials, packaging and other costs for each sale.",
      ),
      field(
        "units",
        "Monthly sales",
        "Number of units or services sold in one month.",
        "number",
      ),
      field(
        "fixed",
        "Monthly fixed costs",
        "Rent, subscriptions and other monthly overhead.",
      ),
    ],
    formula:
      "Revenue = price × sales. Operating profit = revenue − variable costs − fixed costs.",
    note: "Excludes taxes, financing costs and cash-flow timing.",
  },
  {
    id: "pricing",
    name: "Pricing & margin",
    description: "Find a price for your target margin.",
    fields: [
      field(
        "cost",
        "Cost per sale",
        "Your total direct cost for one item or service.",
      ),
      field(
        "margin",
        "Target margin",
        "Share of the selling price you want to keep before overhead.",
        "percent",
      ),
    ],
    formula:
      "Price = cost ÷ (1 − margin ÷ 100). Markup = profit per sale ÷ cost × 100.",
    note: "Margin is based on selling price; markup is based on cost. Overhead and taxes are excluded.",
  },
  {
    id: "break-even",
    name: "Break-even",
    description: "Find the sales needed to cover your costs.",
    fields: [
      field("price", "Selling price", "Amount charged for one sale."),
      field("cost", "Cost per sale", "Variable cost for each sale."),
      field(
        "fixed",
        "Monthly fixed costs",
        "Costs that stay the same regardless of sales volume.",
      ),
    ],
    formula: "Break-even units = fixed costs ÷ (price − cost), rounded up.",
    note: "Assumes one product or a consistent average sales mix.",
  },
  {
    id: "runway",
    name: "Cash runway",
    description: "Estimate how long your cash will last.",
    fields: [
      field(
        "cash",
        "Available cash",
        "Cash currently available for the business.",
      ),
      field("inflow", "Monthly cash in", "Actual cash collected each month."),
      field(
        "outflow",
        "Monthly cash out",
        "Actual payments each month, including loan payments.",
      ),
    ],
    formula:
      "Monthly cash burn = cash out − cash in. Runway = available cash ÷ burn.",
    note: "Assumes the same monthly cash flow. Profit and cash are different.",
  },
  {
    id: "loan",
    name: "Loan payments",
    description: "Estimate a fixed monthly repayment.",
    fields: [
      field("principal", "Loan amount", "Amount borrowed, excluding fees."),
      field(
        "rate",
        "Annual interest rate",
        "Nominal annual rate, compounded monthly.",
        "percent",
      ),
      field(
        "months",
        "Repayment months",
        "Number of equal monthly payments.",
        "number",
      ),
    ],
    formula:
      "Payment = P × r ÷ [1 − (1 + r)⁻ⁿ], where r is the annual rate ÷ 1200.",
    note: "Fixed-rate estimate with month-end payments. Excludes fees, insurance and lender-specific rules.",
  },
  {
    id: "roi",
    name: "Return on investment",
    description: "Compare a return against what you invested.",
    fields: [
      field("investment", "Initial investment", "Total amount invested."),
      field(
        "returned",
        "Total returned",
        "Total proceeds including recovered capital, after other costs.",
      ),
    ],
    formula:
      "Net gain = total returned − investment. ROI = net gain ÷ investment × 100.",
    note: "For the period you choose. Not annualized and does not account for timing.",
  },
];
export const calculationSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    kind: z.enum(calculators.map((c) => c.id)),
    currency: z.enum(currencies),
    inputs: z.record(z.string(), z.number().finite().min(0).max(1e12)),
  })
  .superRefine((v, ctx) => {
    const c = calculators.find((c) => c.id === v.kind);
    for (const f of c.fields)
      if (v.inputs[f.key] === undefined)
        ctx.addIssue({
          code: "custom",
          path: ["inputs", f.key],
          message: "Enter " + f.label.toLowerCase(),
        });
    if (Object.keys(v.inputs).some((k) => !c.fields.some((f) => f.key === k)))
      ctx.addIssue({ code: "custom", message: "Unexpected calculator field" });
    if (v.kind === "pricing" && v.inputs.margin >= 100)
      ctx.addIssue({
        code: "custom",
        path: ["inputs", "margin"],
        message: "Margin must be below 100%",
      });
    for (const k of v.kind === "loan"
      ? ["principal", "months"]
      : v.kind === "roi"
        ? ["investment"]
        : [])
      if (!(v.inputs[k] > 0))
        ctx.addIssue({
          code: "custom",
          path: ["inputs", k],
          message: "Enter a value above zero",
        });
    if (
      v.kind === "loan" &&
      (!Number.isInteger(v.inputs.months) || v.inputs.months > 600)
    )
      ctx.addIssue({
        code: "custom",
        path: ["inputs", "months"],
        message: "Use 1 to 600 whole months",
      });
    if (v.kind === "loan" && v.inputs.rate > 100)
      ctx.addIssue({
        code: "custom",
        path: ["inputs", "rate"],
        message: "Use a rate from 0 to 100%",
      });
    if (v.kind === "profit" && !Number.isInteger(v.inputs.units))
      ctx.addIssue({
        code: "custom",
        path: ["inputs", "units"],
        message: "Use whole sales units",
      });
  });
export function calculate(kind, v) {
  const out = (label, value, unit = "money") => ({ label, value, unit });
  switch (kind) {
    case "profit": {
      const revenue = v.price * v.units,
        profit = revenue - v.cost * v.units - v.fixed;
      return [
        out("Revenue", revenue),
        out("Operating profit", profit),
        out(
          "Operating margin",
          revenue ? (profit / revenue) * 100 : null,
          "percent",
        ),
      ];
    }
    case "pricing": {
      const price = v.cost / (1 - v.margin / 100);
      return [
        out("Suggested price", Math.ceil((price - 1e-9) * 100) / 100),
        out("Profit per sale", price - v.cost),
        out(
          "Markup",
          v.cost ? ((price - v.cost) / v.cost) * 100 : null,
          "percent",
        ),
      ];
    }
    case "break-even": {
      const contribution = v.price - v.cost,
        units = contribution > 0 ? Math.ceil(v.fixed / contribution) : null;
      return [
        out("Contribution per sale", contribution),
        out("Break-even sales", units, "number"),
        out("Revenue at break-even", units === null ? null : units * v.price),
      ];
    }
    case "runway": {
      const burn = v.outflow - v.inflow;
      return [
        out("Monthly cash burn", burn),
        out("Cash runway", burn > 0 ? v.cash / burn : null, "months"),
      ];
    }
    case "loan": {
      const r = v.rate / 1200,
        payment = r
          ? (v.principal * r) / -Math.expm1(-v.months * Math.log1p(r))
          : v.principal / v.months;
      return [
        out("Monthly payment", payment),
        out("Total repayment", payment * v.months),
        out("Total interest", payment * v.months - v.principal),
      ];
    }
    case "roi":
      return [
        out("Net gain", v.returned - v.investment),
        out(
          "ROI",
          ((v.returned - v.investment) / v.investment) * 100,
          "percent",
        ),
      ];
    default:
      throw new Error("Unknown calculator");
  }
}
