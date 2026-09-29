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
