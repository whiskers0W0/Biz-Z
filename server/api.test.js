import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import path from "node:path";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-at-least-thirty-two-characters";
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".test-output/mongodb");
delete process.env.GEMINI_API_KEY;
const { app } = await import("./index.js");
let mongo;
let owner;
let other;
let planId;
before(
  async () => {
    mongo = await MongoMemoryServer.create({
      binary: { downloadDir: process.env.MONGOMS_DOWNLOAD_DIR },
      instance: { dbName: "bizz_test" },
    });
    await mongoose.connect(mongo.getUri());
    owner = request.agent(app);
    other = request.agent(app);
  },
  { timeout: 180000 },
);
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test("accounts, validation, ownership, complete CRUD, summary invalidation, and AI fallback", async () => {
  await request(app).get("/api/plans").expect(401);
  await owner
    .post("/api/auth/register")
    .send({
      name: "Test Builder",
      email: "builder@example.test",
      password: "test-password-123",
    })
    .expect(201);
  await owner
    .get("/api/me")
    .expect(200)
    .then((r) => assert.equal(r.body.name, "Test Builder"));
  await other
    .post("/api/auth/register")
    .send({
      name: "Other Builder",
      email: "other@example.test",
      password: "test-password-123",
    })
    .expect(201);
  await owner
    .put("/api/profile")
    .send({ interests: ["Only one"] })
    .expect(400);
  const profile = {
    interests: ["Food", "Design", "Pets", "Technology", "Crafts"],
    traits: ["Creative", "Organized", "Curious", "Patient", "Practical"],
    skills: "Baking",
    hours: 10,
    capital: 1000,
    monthly: 100,
    location: "Test City",
    currency: "PHP",
  };
  await owner.put("/api/profile").send(profile).expect(200);
  await owner
    .put("/api/profile")
    .send({
      ...profile,
      interests: ["Food", "Food", "Pets", "Technology", "Crafts"],
    })
    .expect(400);
  await owner
    .post("/api/plans")
    .send({ name: " ", description: "" })
    .expect(400);
  const created = await owner
    .post("/api/plans")
    .send({ name: "Test bakery", description: "Small-batch bread" })
    .expect(201);
  planId = created.body._id;
  assert.equal(created.body.sections.length, 8);
  await owner
    .get("/api/plans")
    .expect(200)
    .then((r) => assert.equal(r.body.length, 1));
  await owner.get(`/api/plans/${planId}`).expect(200);
  await other.get(`/api/plans/${planId}`).expect(404);
  await other.delete(`/api/plans/${planId}`).expect(404);
  await other
    .put(`/api/plans/${planId}/sections/0`)
    .send({ answers: [], draft: "Unauthorized", status: "draft" })
    .expect(404);
  await owner
    .put(`/api/plans/${planId}/sections/6`)
    .send({ answers: [], draft: "Too soon", status: "reviewed" })
    .expect(400);
  await owner
    .put(`/api/plans/${planId}/sections/0`)
    .send({ answers: [], draft: "", status: "reviewed" })
    .expect(400);
  for (let i = 0; i < 6; i++)
    await owner
      .put(`/api/plans/${planId}/sections/${i}`)
      .send({
        answers: ["Answer"],
        draft: `Reviewed section ${i}`,
        status: "reviewed",
      })
      .expect(200);
  await owner
    .put(`/api/plans/${planId}/sections/6`)
    .send({
      answers: [],
      draft: "Summary of reviewed plan",
      status: "reviewed",
    })
    .expect(200);
  await owner
    .put(`/api/plans/${planId}/sections/0`)
    .send({ answers: ["Changed"], draft: "Revised overview", status: "draft" })
    .expect(200)
    .then((r) => assert.equal(r.body.sections[6].status, "draft"));
  await owner
    .post(`/api/plans/${planId}/chat`)
    .send({ message: "Help me brainstorm", section: 0 })
    .expect(503);
  await owner
    .post("/api/plans")
    .set("Origin", "https://untrusted.example")
    .send({ name: "Blocked" })
    .expect(403);
  await owner.delete(`/api/plans/${planId}`).expect(200);
  await owner.get(`/api/plans/${planId}`).expect(404);
  await owner
    .get("/api/plans")
    .expect(200)
    .then((r) => assert.equal(r.body.length, 0));
  await owner.post("/api/auth/logout").expect(200);
  await owner.get("/api/me").expect(401);
  await owner
    .post("/api/auth/login")
    .send({ email: "builder@example.test", password: "wrong-password" })
    .expect(401);
  await owner
    .post("/api/auth/login")
    .send({ email: "builder@example.test", password: "test-password-123" })
    .expect(200);
});
