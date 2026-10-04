// Disposable QA database. No Atlas credentials or user records are used.
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "disposable-qa-session-secret-at-least-32-characters";
const { app } = await import("./app.js");
delete process.env.GEMINI_API_KEY;
const { User, Plan } = await import("./models/index.js");
const { BudgetItem, LaunchTask, BusinessIdea } =
  await import("./models/resources.js");
const { catalog } = await import("./services/catalog.js");
const { newSections } = await import("./domain.js");
const mongo = await MongoMemoryServer.create({
  binary: { downloadDir: ".test-output/mongodb" },
});
await mongoose.connect(mongo.getUri());
await BusinessIdea.insertMany(catalog);
const user = await User.create({
  name: "Demo Builder",
  email: "demo@bizz.test",
  passwordHash: await bcrypt.hash("Demo-only-123!", 12),
  profile: {
    interests: ["Food", "Design", "Pets", "Technology", "Crafts"],
    traits: ["Creative", "Organized", "Curious", "Patient", "Practical"],
    skills: "baking and design",
    hours: 12,
    capital: 20000,
    monthly: 5000,
    location: "Sample City",
    currency: "PHP",
  },
});
const plan = await Plan.create({
  owner: user.id,
  name: "Sunny Bakery",
  description: "Small-batch bread for local households.",
  sections: newSections(),
  finance: {
    currency: "PHP",
    capitalMinor: 10000000,
    priceMinor: 15000,
    variableMinor: 6000,
    units: 100,
  },
});
await BudgetItem.create([
  {
    plan: plan.id,
    name: "Oven",
    category: "startup",
    amountMinor: 2000000,
    quantity: 1,
  },
  {
    plan: plan.id,
    name: "Rent",
    category: "monthly",
    amountMinor: 500000,
    quantity: 1,
  },
]);
await LaunchTask.create({
  plan: plan.id,
  title: "Test a small product batch",
  dueDate: "2026-10-05",
  done: false,
});
const server = app.listen(3002, "127.0.0.1", () =>
  console.log(
    "Disposable QA API ready on 3002. Sign in as demo@bizz.test with Demo-only-123!",
  ),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
