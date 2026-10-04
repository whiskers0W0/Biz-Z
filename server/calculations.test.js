import assert from "node:assert/strict";
import { test } from "node:test";
import {
  financeSummary,
  breakEven,
  scenarios,
  taskSummary,
  matchIdeas,
} from "./services/calculations.js";
test("financial arithmetic and edge cases", () => {
  const p = {
    finance: {
      currency: "PHP",
      capitalMinor: 100000,
      priceMinor: 1000,
      variableMinor: 400,
      units: 100,
    },
  };
  const items = [
    { category: "startup", amountMinor: 20000, quantity: 2 },
    { category: "monthly", amountMinor: 10000, quantity: 1 },
  ];
  const s = financeSummary(p, items);
  assert.equal(s.startup, 40000);
  assert.equal(s.profit, 50000);
  assert.equal(s.margin, 50);
  assert.equal(s.runway, null);
  assert.equal(breakEven(p, items).units, 17);
  assert.equal(
    breakEven({ finance: { priceMinor: 400, variableMinor: 400 } }, items)
      .units,
    null,
  );
  assert.equal(financeSummary({ finance: {} }, []).margin, null);
  assert.equal(
    financeSummary({ finance: { capitalMinor: 0 } }, items).fundingGap,
    40000,
  );
  assert.equal(
    financeSummary({ ...p, finance: { ...p.finance, units: 0 } }, items).runway,
    6,
  );
  assert.equal(scenarios(p, items, [0, 100, 200])[2].profit, 110000);
});
test("dates and matching remain explainable", () => {
  const s = taskSummary(
    [
      { done: false, dueDate: "2026-09-30" },
      { done: false, dueDate: "2026-10-01" },
      { done: true, dueDate: "2026-09-29" },
    ],
    "2026-10-01",
  );
  assert.equal(s.overdue, 1);
  assert.equal(s.completed, 1);
  assert.equal(s.percent, 33);
  assert.equal(taskSummary([], "2026-10-01").percent, 0);
  const idea = {
    name: "Bakery",
    tags: ["Food"],
    skills: ["baking"],
    currency: "PHP",
    capital: 100,
    hours: 2,
  };
  assert.equal(matchIdeas({}, [idea])[0].score, 0);
  assert.equal(
    matchIdeas(
      {
        interests: ["Food"],
        skills: "baking",
        currency: "PHP",
        capital: 100,
        hours: 2,
      },
      [idea],
    )[0].score,
    100,
  );
});
