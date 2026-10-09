const sum = (items, category) =>
  items
    .filter((i) => i.category === category)
    .reduce((n, i) => n + i.amountMinor * i.quantity, 0);
export function financeSummary(plan, items) {
  const f = plan.finance || {},
    capital = f.capitalMinor || 0,
    startup = sum(items, "startup"),
    fixed = sum(items, "monthly"),
    price = f.priceMinor || 0,
    variable = f.variableMinor || 0,
    units = f.units || 0;
  const revenue = price * units,
    expenses = variable * units + fixed,
    profit = revenue - expenses,
    opening = capital - startup,
    burn = -profit;
  return {
    currency: f.currency || "PHP",
    startup,
    fixed,
    capital,
    fundingGap: Math.max(-opening, 0),
    opening,
    revenue,
    expenses,
    profit,
    margin: revenue ? Math.round((profit / revenue) * 10000) / 100 : null,
    runway:
      opening >= 0 && burn > 0
        ? Math.round((opening / burn) * 100) / 100
        : null,
    runwayReason:
      opening < 0
        ? "Insufficient startup capital"
        : burn <= 0
          ? "No cash depletion under these assumptions"
          : "Months until opening cash is depleted",
  };
}
export function breakEven(plan, items) {
  const s = financeSummary(plan, items);
  const contribution =
    (plan.finance?.priceMinor || 0) - (plan.finance?.variableMinor || 0);
  return {
    contribution,
    units: contribution > 0 ? Math.ceil(s.fixed / contribution) : null,
    reason:
      contribution > 0
        ? "Fixed monthly costs divided by contribution per sale"
        : "No finite break-even point with non-positive contribution",
  };
}
export function scenarios(plan, items, units) {
  return units.map((n) => ({
    units: n,
    ...financeSummary(
      {
        finance: { ...(plan.finance?.toObject?.() || plan.finance), units: n },
      },
      items,
    ),
  }));
}
export function taskSummary(tasks, today) {
  const completed = tasks.filter((t) => t.done).length;
  return {
    total: tasks.length,
    completed,
    percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    overdue: tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length,
    upcoming: tasks
      .filter((t) => !t.done && t.dueDate && t.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5),
  };
}
export function matchIdeas(profile, ideas) {
  return ideas
    .map((idea) => {
      const tags = idea.tags.filter((t) =>
        (profile.interests || []).some(
          (x) => x.toLowerCase() === t.toLowerCase(),
        ),
      );
      const skills = idea.skills.filter((s) =>
        (profile.skills || "").toLowerCase().includes(s.toLowerCase()),
      );
      const preferences = (idea.workStyles || []).filter(s => (profile.workStyles || []).includes(s));
      const usePreferences = !!profile.workStyles?.length;
      const fit = usePreferences ? preferences.length / Math.max((idea.workStyles || []).length, 1) : skills.length / Math.max(idea.skills.length, 1);
      const budget =
        profile.currency === idea.currency &&
        Number.isFinite(profile.capital) &&
        profile.capital >= idea.capital;
      const time =
        Number.isFinite(profile.hours) && profile.hours >= idea.hours;
      const score = Math.round(
        (40 * tags.length) / Math.max(idea.tags.length, 1) +
          25 * fit +
          (budget ? 20 : 0) +
          (time ? 15 : 0),
      );
      return {
        ...idea,
        score,
        reasons: [
          `${tags.length} matching interests`,
          usePreferences ? `${preferences.length} matching work preferences` : `${skills.length} matching skills`,
          budget
            ? "Within your stated capital"
            : "Budget needs checking (same currency required)",
          time ? "Fits your weekly hours" : "Time commitment needs checking",
        ],
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
