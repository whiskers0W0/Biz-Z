export const titles = [
  "Company overview",
  "Market & competition",
  "Products & services",
  "Marketing & sales",
  "Operations & management",
  "Financial plan & funding",
  "Executive summary",
  "Legal compliance",
];
export function newSections() {
  return titles.map((title) => ({
    title,
    answers: ["", ""],
    draft: "",
    status: "not-started",
  }));
}
export function invalidateSummary(sections, index) {
  if (index < 6)
    sections[6].status = sections[6].draft ? "draft" : "not-started";
}

export const sectionCoverage = [
 "Company background, location, mission, vision and measurable objectives. Describe branding only if supplied.",
 "Target customer needs and location, known competitors and differentiation, plus strengths, weaknesses, opportunities and threats. Never invent competitor names or research.",
 "Products or services, features, customer benefits, distinctive value and delivery experience.",
 "Marketing mix: product positioning, pricing, sales/distribution channels and promotion. Include customer retention.",
 "Ownership, team responsibilities, production or service workflow, suppliers, equipment and tools. Mark unconfirmed partners and suppliers clearly.",
 "Funding sources, startup costs, per-unit costing, monthly sales, cost of goods and operating expenses. Explain estimated profit as sales minus costs; identify missing figures rather than inventing them.",
 "Concise summary of business purpose, market opportunity, distinctive offer, operations and financial highlights drawn from the reviewed sections.",
 "Registrations, permits and relevant compliance questions for the business location. Identify what needs official verification; do not assert unverified legal requirements."
];
