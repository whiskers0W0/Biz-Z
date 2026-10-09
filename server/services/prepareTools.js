import { z } from "zod";
import { gemini } from "./gemini.js";
import { Plan } from "../models/index.js";
import { BudgetItem, LaunchTask } from "../models/resources.js";
import { createHash } from "node:crypto";
const running = new Map();
export const planFingerprint = (plan) =>
  createHash("sha256")
    .update(JSON.stringify(plan.sections.map((s) => s.draft)))
    .digest("hex");
export const registrationTasks = [
  {
    title: "Confirm legal structure and register the business",
    phase: "1. Registration & compliance",
    details:
      "Choose the applicable route: DTI for sole proprietorship (business-name application and government ID); SEC for partnership/corporation (Articles of Partnership or Incorporation, and other structure-specific documents); CDA for cooperatives (Articles of Cooperation, bylaws and registration documents). Follow only the route matching your chosen structure. Confirm owner details and business address before applying.",
    links: [
      "https://bnrs.dti.gov.ph/",
      "https://esparc.sec.gov.ph/",
      "https://cda.gov.ph/services/regulatory-services/registration/",
    ],
  },
  {
    title: "Confirm local permits and premises requirements",
    phase: "1. Registration & compliance",
    details:
      "Contact the business location’s barangay and city/municipal BPLO. Prepare the applicable DTI/SEC/CDA registration, application, ID/authorization and proof of premises such as lease or ownership. Ask about integrated barangay clearance, zoning, occupancy, fire safety and sanitary requirements for this activity. Requirements vary by LGU; the linked QC guide is an example, not a nationwide checklist.",
    links: [
      "https://quezoncity.gov.ph/qcitizen-guides/opening-a-business-in-qc/",
    ],
  },
  {
    title: "Register taxes, books and compliant invoices with BIR",
    phase: "1. Registration & compliance",
    details:
      "Confirm the appropriate RDO and taxpayer classification. Prepare Form 1901 for individual businesses or 1903 for entities, identity and registration documents, and applicable address/authorization records. Arrange registered books and BIR-printed invoices or Authority to Print (Form 1906) as applicable. Use the current documentary checklist. The annual registration fee ceased in January 2024.",
    links: [
      "https://web-services.bir.gov.ph/newbizreg/",
      "https://bir-cdn.bir.gov.ph/BIR/pdf/CDR%20-%202025.pdf",
    ],
  },
  {
    title: "Verify sector permits and employer obligations",
    phase: "1. Registration & compliance",
    details:
      "Check the legal and operations sections for regulated products, premises and hiring. Confirm sector licenses with the responsible agency before operating. If hiring, verify employer registration and employee reporting with SSS, PhilHealth and Pag-IBIG; prepare entity registration, employer details and employee records. Check privacy and consumer obligations if collecting customer data or selling online.",
    links: [
      "https://www.sss.gov.ph/employer-er/",
      "https://www.philhealth.gov.ph/",
      "https://www.pagibigfund.gov.ph/",
      "https://privacy.gov.ph/",
    ],
  },
];
export function prepareTools(plan) {
  if (running.has(String(plan._id))) return running.get(String(plan._id));
  const promise = prepare(plan).finally(() => running.delete(String(plan._id)));
  running.set(String(plan._id), promise);
  return promise;
}
async function prepare(plan) {
  if (
    plan.sections.length !== 8 ||
    !plan.sections.every((s) => s.status === "reviewed" && s.draft.trim())
  ) {
    const e = new Error("Review all sections first.");
    e.status = 400;
    throw e;
  }
  if (
    plan.toolPreparation?.status === "ready" &&
    plan.toolPreparation.fingerprint === planFingerprint(plan)
  )
    return plan.toolPreparation;
  const fingerprint = planFingerprint(plan);
  const sections = plan.sections.map((s, index) => ({
    index,
    title: s.title,
    draft: s.draft,
  }));
  const raw = await gemini(
    `Extract financial inputs and practical launch tasks from this completed business plan. Return JSON {values:[{field,value,source}],costs:[{name,category,amount,source}],tasks:[{title,phase,details}]}. values fields: capital,price,variable,units. Costs categories startup (one-time), monthly (fixed recurring only, excluding per-unit variable costs). Monetary amounts are major units in ${plan.finance.currency}. Include only explicit figures with exact supporting source quotes from drafts. Do not invent, double count totals plus components, convert currencies, or infer missing numbers. Use one consistent product/service sales model; omit incompatible multi-product assumptions. Max 4 values, 15 costs. Max 8 tailored tasks from plan content, phase one of '2. Operations & funding','3. Market launch','4. Monitor & improve'. Do not generate legal tasks (added separately). No invented dates. Context: ${JSON.stringify(sections)}`,
  );
  const source = z.string().min(1).max(2000);
  const amount = z.number().min(0).max(1e6);
  const result = z
    .object({
      values: z
        .array(
          z.object({
            field: z.enum(["capital", "price", "variable", "units"]),
            value: amount,
            source,
          }),
        )
        .max(4),
      costs: z
        .array(
          z.object({
            name: z.string().min(1).max(120),
            category: z.enum(["startup", "monthly"]),
            amount,
            source,
          }),
        )
        .max(15),
      tasks: z
        .array(
          z.object({
            title: z.string().min(1).max(160),
            phase: z.enum([
              "2. Operations & funding",
              "3. Market launch",
              "4. Monitor & improve",
            ]),
            details: z.string().max(1500),
          }),
        )
        .max(8),
    })
    .parse(JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")));
  if (
    new Set(result.values.map((v) => v.field)).size !== result.values.length ||
    [...result.values, ...result.costs].some(
      (v) => !sections.some((s) => s.draft.includes(v.source)),
    ) ||
    result.values.some((v) => v.field === "units" && !Number.isInteger(v.value))
  )
    throw new Error(
      "Could not verify derived figures. Your saved data is unchanged.",
    );
  const fresh = await Plan.findById(plan._id);
  if (
    planFingerprint(fresh) !== fingerprint ||
    !fresh.sections.every((s) => s.status === "reviewed")
  )
    throw new Error(
      "The plan changed during preparation. Try again after review.",
    );

  const previous = fresh.toolPreparation;
  const financeIsEmpty = [
    "capitalMinor",
    "priceMinor",
    "variableMinor",
    "units",
  ].every((k) => !fresh.finance[k]);
  const missing = [];
  for (const field of ["capital", "price", "variable", "units"]) {
    const key = field === "units" ? "units" : field + "Minor";
    const old = previous?.sources?.find((v) => v.field === field);
    const next = result.values.find((v) => v.field === field);
    const untouched =
      !previous?.manuallyEdited &&
      (financeIsEmpty ||
        (old &&
          fresh.finance[key] ===
            (field === "units" ? old.value : Math.round(old.value * 100))) ||
        previous?.missing?.includes(field));
    if (untouched) {
      fresh.finance[key] = next
        ? field === "units"
          ? next.value
          : Math.round(next.value * 100)
        : 0;
      if (!next) missing.push(field);
    } else if (!previous && !fresh.finance[key]) missing.push(field);
  }
  async function sync(Model, entries, prefix) {
    const existing = await Model.find({ plan: plan._id });
    const snapshots = {};
    for (const [i, data] of entries.entries()) {
      const key = prefix + "-" + i;
      const current = existing.find((x) => x.generatedKey === key);
      const old = previous?.snapshots?.[key];
      if (current && old) {
        const filter = { _id: current._id, ...old };
        await Model.updateOne(filter, { $set: data });
      } else if (
        !current &&
        !(previous?.snapshots && key in previous.snapshots) &&
        (!existing.length ||
          (prefix === "task" && i < registrationTasks.length) ||
          previous)
      ) {
        await Model.updateOne(
          { plan: plan._id, generatedKey: key },
          { $setOnInsert: { ...data, plan: plan._id, generatedKey: key } },
          { upsert: true },
        );
      }
      snapshots[key] = data;
    }
    for (const current of existing) {
      const old = previous?.snapshots?.[current.generatedKey];
      if (old && !(current.generatedKey in snapshots))
        await Model.deleteOne({ _id: current._id, ...old });
    }
    return snapshots;
  }
  const costSnapshots = await sync(
    BudgetItem,
    result.costs.map((c) => ({
      name: c.name,
      category: c.category,
      amountMinor: Math.round(c.amount * 100),
      quantity: 1,
    })),
    "cost",
  );
  const taskSnapshots = await sync(
    LaunchTask,
    [...registrationTasks, ...result.tasks].map((t) => ({
      ...t,
      done: false,
      dueDate: "",
    })),
    "task",
  );
  const metadata = {
    status: "ready",
    fingerprint,
    preparedAt: new Date().toISOString(),
    sources: result.values,
    missing,
    costsMissing: !(await BudgetItem.countDocuments({ plan: plan._id })),
    snapshots: { ...previous?.snapshots, ...costSnapshots, ...taskSnapshots },
    manuallyEdited: previous?.manuallyEdited || false,
  };
  const updated = await Plan.updateOne(
    { _id: plan._id, updatedAt: fresh.updatedAt },
    { $set: { finance: fresh.finance, toolPreparation: metadata } },
  );
  if (!updated.matchedCount)
    throw new Error("Your plan changed. Reopen this tool after reviewing it.");
  return metadata;
}
