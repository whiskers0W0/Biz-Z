import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import { BusinessIdea } from "./models/resources.js";
import { catalog } from "./services/catalog.js";
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(","));
try {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  for (const item of catalog)
    await BusinessIdea.updateOne(
      { slug: item.slug },
      { $set: { ...item, currency: "PHP" } },
      { upsert: true, runValidators: true },
    );
  console.log(
    `Seeded ${catalog.length} illustrative business ideas. Existing user plans were not changed.`,
  );
} catch {
  console.error("Seed failed. Check database connection settings.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
