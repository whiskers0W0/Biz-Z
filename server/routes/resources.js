import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Plan } from "../models/index.js";
import { BudgetItem, LaunchTask, BusinessIdea } from "../models/resources.js";
import {
  financeSummary,
  breakEven,
  scenarios,
  taskSummary,
  matchIdeas,
} from "../services/calculations.js";
export const resources = Router();
const minor = z.number().int().min(0).max(1e8);
const finance = z.object({
  currency: z.enum(["PHP", "USD", "EUR", "GBP", "SGD"]),
  capitalMinor: minor,
  priceMinor: minor,
  variableMinor: minor,
  units: z.number().int().min(0).max(1e6),
});
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Use a valid date",
  );
resources.get("/ideas", async (req, res) => {
  const q = z
    .object({
      q: z.string().max(100).default(""),
      tag: z.string().max(60).default(""),
    })
    .parse(req.query);
  const list = await BusinessIdea.find().lean();
  res.json(
    list
      .filter(
        (i) =>
          (i.name + " " + i.description)
            .toLowerCase()
            .includes(q.q.toLowerCase()) &&
          (!q.tag || i.tags.includes(q.tag)),
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
});
resources.get("/ideas/:ideaId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.ideaId))
    return res.status(404).json({ error: "Idea not found." });
  const item = await BusinessIdea.findById(req.params.ideaId);
  return item
    ? res.json(item)
    : res.status(404).json({ error: "Idea not found." });
});
resources.get("/profiles/me/idea-matches", async (req, res) =>
  res.json(
    matchIdeas(req.user.profile || {}, await BusinessIdea.find().lean()),
  ),
);
resources.get("/profiles/me", (req, res) => res.json(req.user.profile));
resources.param("planId", async (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id))
    return res.status(404).json({ error: "Plan not found." });
  req.plan = await Plan.findOne({ _id: id, owner: req.user.id });
  if (!req.plan) return res.status(404).json({ error: "Plan not found." });
  next();
});
resources.put("/plans/:planId", async (req, res) => {
  const data = z
    .object({
      name: z.string().trim().min(2).max(120),
      description: z.string().max(2000),
    })
    .parse(req.body);
  Object.assign(req.plan, data);
  await req.plan.save();
  res.json(req.plan);
});
resources.get("/plans/:planId/finance", (req, res) =>
  res.json(req.plan.finance),
);
resources.put("/plans/:planId/finance", async (req, res) => {
  req.plan.finance = finance.parse(req.body);
  if (req.plan.sections[5]) req.plan.sections[5].status = "draft";
  if (req.plan.sections[6]) req.plan.sections[6].status = "draft";
  await req.plan.save();
  res.json(req.plan.finance);
});
for (const [resource, Model, schema, param] of [
  [
    "budget-items",
    BudgetItem,
    z.object({
      name: z.string().trim().min(1).max(120),
      category: z.enum(["startup", "monthly"]),
      amountMinor: minor,
      quantity: z.number().int().min(1).max(10000),
    }),
    "itemId",
  ],
  [
    "tasks",
    LaunchTask,
    z.object({
      title: z.string().trim().min(1).max(160),
      dueDate: date,
      done: z.boolean().default(false),
    }),
    "taskId",
  ],
]) {
  const base = "/plans/:planId/" + resource;
  async function invalidate(plan) {
    if (resource === "budget-items") {
      for (const index of [5, 6]) {
        if (plan.sections[index]?.draft) plan.sections[index].status = "draft";
      }
      await plan.save();
    }
  }
  resources.get(base, async (req, res) =>
    res.json(await Model.find({ plan: req.plan.id }).sort({ createdAt: 1 })),
  );
  resources.post(base, async (req, res) => {
    const data = schema.parse(req.body);
    if(await Model.countDocuments({plan:req.plan.id})>=200)return res.status(400).json({error:"This plan supports up to 200 items of this type."});
    const item = await Model.create({ ...data, plan: req.plan.id });
    await invalidate(req.plan);
    res.status(201).json(item);
  });
  resources.get(base + "/:" + param, async (req, res) => {
    const id = req.params[param];
    const item = mongoose.isValidObjectId(id)
      ? await Model.findOne({ _id: id, plan: req.plan.id })
      : null;
    if (item && req.method !== "GET") await invalidate(req.plan);
    return item
      ? res.json(item)
      : res.status(404).json({ error: "Record not found." });
  });
  resources.put(base + "/:" + param, async (req, res) => {
    const id = req.params[param];
    const data = schema.parse(req.body);
    const item = mongoose.isValidObjectId(id)
      ? await Model.findOneAndUpdate({ _id: id, plan: req.plan.id }, data, {
          returnDocument: "after",
          runValidators: true,
        })
      : null;
    return item
      ? res.json(item)
      : res.status(404).json({ error: "Record not found." });
  });
  resources.delete(base + "/:" + param, async (req, res) => {
    const id = req.params[param];
    const item = mongoose.isValidObjectId(id)
      ? await Model.findOneAndDelete({ _id: id, plan: req.plan.id })
      : null;
    if (item) await invalidate(req.plan);
    return item
      ? res.json({ ok: true })
      : res.status(404).json({ error: "Record not found." });
  });
}
resources.get("/plans/:planId/financial-summary", async (req, res) =>
  res.json(
    financeSummary(req.plan, await BudgetItem.find({ plan: req.plan.id })),
  ),
);
resources.get("/plans/:planId/break-even", async (req, res) =>
  res.json(breakEven(req.plan, await BudgetItem.find({ plan: req.plan.id }))),
);
resources.post("/plans/:planId/scenario-comparisons", async (req, res) => {
  const { units } = z
    .object({ units: z.array(z.number().int().min(0).max(1e6)).min(1).max(5) })
    .parse(req.body);
  res.json(
    scenarios(req.plan, await BudgetItem.find({ plan: req.plan.id }), units),
  );
});
resources.get("/plans/:planId/task-summary", async (req, res) => {
  const today = date.parse(
    req.query.today || new Date().toISOString().slice(0, 10),
  );
  res.json(taskSummary(await LaunchTask.find({ plan: req.plan.id }), today));
});
