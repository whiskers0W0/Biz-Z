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
delete process.env.GEMINI_API_KEY;
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
    .set("Host", "127.0.0.1:5174")
    .set("Origin", "http://127.0.0.1:5174")
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
  const beforeRestore = await owner.get(`/api/plans/${planId}`).expect(200);
  const versions = beforeRestore.body.sections[0].revisions;
  assert.ok(versions.length >= 2);
  await owner
    .put(`/api/plans/${planId}/sections/0`)
    .send({ answers: [], draft: versions[0].draft, status: "draft" })
    .expect(200);
  const restored = await owner.get(`/api/plans/${planId}`).expect(200);
  assert.equal(restored.body.sections[0].draft, versions[0].draft);
  assert.equal(restored.body.sections[0].revisions.length, versions.length + 1);
  await request(app).get("/api/not-a-route").expect(404);
  await owner
    .put(`/api/plans/${planId}`)
    .send({ name: "Updated bakery", description: "Small-batch bread" })
    .expect(200);
  await owner
    .put(`/api/plans/${planId}/finance`)
    .send({
      currency: "PHP",
      capitalMinor: 100000,
      priceMinor: 1000,
      variableMinor: 400,
      units: 100,
    })
    .expect(200);
  const cost = await owner
    .post(`/api/plans/${planId}/budget-items`)
    .send({
      name: "Rent",
      category: "monthly",
      amountMinor: 10000,
      quantity: 1,
    })
    .expect(201);
  await other.get(`/api/plans/${planId}/budget-items`).expect(404);
  await owner
    .get(`/api/plans/${planId}/budget-items/${cost.body._id}`)
    .expect(200);
  await owner
    .put(`/api/plans/${planId}/budget-items/${cost.body._id}`)
    .send({
      name: "Rent",
      category: "monthly",
      amountMinor: 20000,
      quantity: 1,
    })
    .expect(200);
  const totals = await owner
    .get(`/api/plans/${planId}/financial-summary`)
    .expect(200);
  assert.equal(totals.body.profit, 40000);
  await owner.get(`/api/plans/${planId}/break-even`).expect(200);
  await owner
    .post(`/api/plans/${planId}/scenario-comparisons`)
    .send({ units: [0, 100, 200] })
    .expect(200);
  await owner
    .post(`/api/plans/${planId}/budget-items`)
    .send({
      name: "Invalid",
      category: "monthly",
      amountMinor: -1,
      quantity: 1,
    })
    .expect(400);
  const task = await owner
    .post(`/api/plans/${planId}/tasks`)
    .send({ title: "Launch", dueDate: "2026-09-30", done: false })
    .expect(201);
  const taskStats = await owner
    .get(`/api/plans/${planId}/task-summary?today=2026-10-01`)
    .expect(200);
  assert.equal(taskStats.body.overdue, 1);
  await owner
    .put(`/api/plans/${planId}/tasks/${task.body._id}`)
    .send({ title: "Launch", dueDate: "2026-09-30", done: true })
    .expect(200);
  await owner.get("/api/profiles/me/idea-matches").expect(200);
  await owner.get("/api/ideas").expect(200);
  await owner.get("/api/ideas/not-an-id").expect(404);
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  let prompt = "";
  globalThis.fetch = async (_url, options) => {
    prompt = JSON.parse(options.body).contents[0].parts[0].text;
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    text: "Here is your tailored draft.",
                    options: [],
                    draft: "A small bakery serving local families.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    };
  };
  try {
    const generated = await owner
      .post(`/api/plans/${planId}/sections/0/zee`)
      .send({ message: "Draft from my idea" })
      .expect(200);
    assert.equal(
      generated.body.plan.sections[0].draft,
      "A small bakery serving local families.",
    );
    assert.equal(generated.body.plan.sections[0].status, "draft");
    assert.equal(generated.body.plan.messages.at(-1).section, 0);
    assert.ok(generated.body.plan.messages.at(-1)._id);
    await owner.put(`/api/plans/${planId}/sections/0`).send({answers:[],draft:"A small bakery serving local families.",status:"reviewed"}).expect(200);
    await owner
      .post(`/api/plans/${planId}/sections/1/zee`)
      .send({ message: "Start this section" })
      .expect(200);
    assert.ok(!prompt.includes('"text":"Draft from my idea"'));
    await other
      .post(`/api/plans/${planId}/sections/0/zee`)
      .send({ message: "Change it" })
      .expect(404);
    const suggestion = {
      name: "Bakery",
      description: "Local bread",
      why: "Baking skills",
      needs: "Oven",
      challenge: "Test demand",
      tags: ["Food"],
      skills: ["Baking"],
      capital: 500,
      hours: 5,
      currency: "PHP",
      score: 999,
    };
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    suggestion,
                    {
                      ...suggestion,
                      name: "Big bakery",
                      capital: 50000,
                      hours: 80,
                    },
                  ]),
                },
              ],
            },
          },
        ],
      }),
    });
    const matches = await owner
      .post("/api/ideas")
      .send({ exclude: [] })
      .expect(200);
    assert.equal(matches.body[0].name, "Bakery");
    assert.equal(matches.body[0].score, 100);
    assert.equal(matches.body[1].score, 65);
    const more = await owner
      .post("/api/ideas")
      .send({ exclude: ["Bakery"] })
      .expect(200);
    assert.deepEqual(
      more.body.map((i) => i.name),
      ["Big bakery"],
    );
    await owner.post("/api/ideas").send({ exclude: "invalid" }).expect(400);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "invalid JSON" }] } }],
      }),
    });
    await owner
      .post(`/api/plans/${planId}/sections/0/zee`)
      .send({ message: "Make it shorter" })
      .expect(502);
    await owner.post("/api/ideas").send({}).expect(502);
    const unchanged = await owner.get(`/api/plans/${planId}`).expect(200);
    assert.equal(
      unchanged.body.sections[0].draft,
      "A small bakery serving local families.",
    );
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
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

test("adviser chats persist, isolate owners and never edit plans", async () => {
  const plan = (
    await owner
      .post("/api/plans")
      .send({ name: "Adviser context", description: "A small shop" })
      .expect(201)
  ).body;
  await request(app).get("/api/conversations").expect(401);
  await other.post("/api/conversations").send({ plan: plan._id }).expect(404);
  const chat = (
    await owner.post("/api/conversations").send({ plan: plan._id }).expect(201)
  ).body;
  const url = `/api/conversations/${chat._id}`;
  await other.get(url).expect(404);
  await other.put(url).send({ title: "Stolen" }).expect(404);
  await other.delete(url).expect(404);
  await other
    .post(url + "/messages")
    .send({ message: "Hello" })
    .expect(404);
  await owner.put(url).send({ title: "" }).expect(400);
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "Try speaking with five potential customers." }],
            },
          },
        ],
      }),
    });
    const reply = (
      await owner
        .post(url + "/messages")
        .send({ message: "How can I find customers?" })
        .expect(200)
    ).body;
    assert.equal(reply.messages.length, 2);
    assert.equal(reply.title, "How can I find customers?");
    assert.equal(
      (await owner.get(url).expect(200)).body.messages[1].text,
      "Try speaking with five potential customers.",
    );
    assert.deepEqual(
      (await owner.get(`/api/plans/${plan._id}`).expect(200)).body,
      plan,
    );
    delete process.env.GEMINI_API_KEY;
    await owner
      .post(url + "/messages")
      .send({ message: "More advice" })
      .expect(503);
    assert.equal((await owner.get(url)).body.messages.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
  await owner.put(url).send({ title: "Finding customers" }).expect(200);
  assert.equal(
    (await owner.get("/api/conversations")).body[0].title,
    "Finding customers",
  );
  assert.equal((await other.get("/api/conversations")).body.length, 0);
  await owner.delete(url).expect(200);
  await owner.get(url).expect(404);
  await owner.delete(`/api/plans/${plan._id}`).expect(200);
});

test('sections unlock in order and export requires every review', async () => {
 const plan=(await owner.post('/api/plans').send({name:'Sequential plan'}).expect(201)).body;
 const base=`/api/plans/${plan._id}`;
 await owner.get(base+'/export').expect(400);
 for(let i=1;i<8;i++) {
  await owner.put(base+`/sections/${i}`).send({answers:[],draft:'Skipped',status:'reviewed'}).expect(400);
 }
 for(let i=0;i<8;i++) {
  await owner.put(base+`/sections/${i}`).send({answers:[],draft:`Completed section ${i}`,status:'reviewed'}).expect(200);
  await owner.get(base+'/export').expect(i===7?200:400);
 }
 await other.get(base+'/export').expect(404);
 await owner.put(base+'/sections/0').send({answers:[],draft:'Changed overview',status:'draft'}).expect(200);
 await owner.get(base+'/export').expect(400);
 await owner.put(base+'/sections/7').send({answers:[],draft:'Blocked again',status:'reviewed'}).expect(400);
 await owner.delete(base).expect(200);
});

test('work preferences persist separately from legacy skills', async () => {
 const profile=(await owner.get('/api/me').expect(200)).body.profile;
 await owner.put('/api/profile').send({...profile,workStyles:['From home','Working solo']}).expect(200);
 const saved=(await owner.get('/api/me').expect(200)).body.profile;
 assert.deepEqual(saved.workStyles,['From home','Working solo']);
 assert.equal(saved.skills,profile.skills);
 await owner.put('/api/profile').send({...profile,workStyles:Array(6).fill('From home')}).expect(400);
});

test('business detail revisions update drafts atomically and retain history', async () => {
 const plan=(await owner.post('/api/plans').send({name:'Old bakery',description:'Bread shop'}).expect(201)).body;
 const base=`/api/plans/${plan._id}`;
 await owner.put(base+'/sections/0').send({answers:[],draft:'Old bakery sells bread.',status:'reviewed'}).expect(200);
 await owner.put(base).send({name:'New bakery',description:'Bread shop'}).expect(200);
 let updated=(await owner.get(base)).body;
 assert.equal(updated.sections[0].draft,'New bakery sells bread.');
 assert.equal(updated.sections[0].status,'reviewed');
 assert.equal(updated.sections[0].revisions[0].draft,'Old bakery sells bread.');
 const oldFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';
 try {
  globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'[]'}]}}]})});
  await owner.put(base).send({name:'New cafe',description:'Coffee shop'}).expect(502);
  assert.equal((await owner.get(base)).body.description,'Bread shop');
  globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify([{index:0,draft:'New cafe serves coffee.'}])}]}}]})});
  await owner.put(base).send({name:'New cafe',description:'Coffee shop'}).expect(200);
  updated=(await owner.get(base)).body;
  assert.equal(updated.sections[0].draft,'New cafe serves coffee.');
  assert.equal(updated.sections[0].status,'draft');
  assert.equal(updated.sections[0].revisions.at(-1).source,'Business details updated');
 } finally {globalThis.fetch=oldFetch;delete process.env.GEMINI_API_KEY;}
 await owner.delete(base).expect(200);
});

test('plan tool suggestions use owned drafts without saving assumptions or tasks', async () => {
 const p=(await owner.post('/api/plans').send({name:'Coffee corner',description:'Coffee takeaway'}).expect(201)).body;
 const base=`/api/plans/${p._id}`;
 await other.post(base+'/tool-suggestions').send({mode:'template'}).expect(404);
 await owner.post(base+'/tool-suggestions').send({mode:'money'}).expect(400);
 const draft='We sell coffee for PHP 80 per cup.';
 await owner.put(base+'/sections/0').send({answers:[],draft,status:'reviewed'}).expect(200);
 const template=(await owner.post(base+'/tool-suggestions').send({mode:'template'}).expect(200)).body;
 assert.equal(template.tasks.length,1);
 assert.ok(template.tasks[0].title.includes('Coffee corner'));
 const original=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';
 const mock=result=>{globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]})});};
 try {
  mock({values:[{field:'price',value:80,source:draft}]});
  assert.equal((await owner.post(base+'/tool-suggestions').send({mode:'money'}).expect(200)).body.values[0].value,80);
  mock({values:[{field:'price',value:80,source:'Fabricated source'}]});
  await owner.post(base+'/tool-suggestions').send({mode:'money'}).expect(502);
  mock({tasks:[{title:'Test coffee recipes',reason:'Products for Coffee corner'}]});
  await owner.post(base+'/tool-suggestions').send({mode:'launch'}).expect(200);
  assert.equal((await owner.get(base+'/tasks')).body.length,0);
  assert.equal((await owner.get(base+'/finance')).body.priceMinor,0);
 } finally {globalThis.fetch=original;delete process.env.GEMINI_API_KEY;}
 await owner.delete(base).expect(200);
});

 test('map coordinates persist, validate bounds and clear on manual location changes', async () => {
 const profile=(await owner.get('/api/me').expect(200)).body.profile;
 const locationPoint={lat:14.65,lng:121.03,placeId:'test-place'};
 await owner.put('/api/profile').send({...profile,location:'Quezon City, Philippines',locationPoint}).expect(200);
 assert.deepEqual((await owner.get('/api/me')).body.profile.locationPoint,locationPoint);
 await owner.put('/api/profile').send({...profile,locationPoint:{lat:91,lng:121}}).expect(400);
 await owner.put('/api/profile').send({...profile,location:'Manila',locationPoint:undefined}).expect(200);
 assert.equal((await owner.get('/api/me')).body.profile.locationPoint,undefined);
 });

test('completed plans automatically derive tools once, protect ownership and retain edits', async () => {
 const {Plan}=await import('./models/index.js');
 const p=(await owner.post('/api/plans').send({name:'Prepared coffee',description:'Coffee takeaway'}).expect(201)).body;
 const base=`/api/plans/${p._id}`;
 await owner.post(base+'/prepare-tools').expect(400);
 const draft='Capital PHP 20000. Price PHP 80. Variable cost PHP 30. Monthly sales 100. Rent PHP 2000.';
 await Plan.updateOne({_id:p._id},{$set:{sections:p.sections.map(s=>({...s,draft,status:'reviewed'}))}});
 const original=globalThis.fetch;
 let calls=0;
 process.env.GEMINI_API_KEY='test-key';
 const result={values:[{field:'capital',value:20000,source:draft},{field:'price',value:80,source:draft},{field:'variable',value:30,source:draft},{field:'units',value:100,source:draft}],costs:[{name:'Rent',category:'monthly',amount:2000,source:draft}],tasks:[{title:'Test coffee recipes',phase:'2. Operations & funding',details:'Prepare coffee for the first sales trial.'}]};
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]})};};
 try {
  await other.post(base+'/prepare-tools').expect(404);
  const prepared=(await owner.post(base+'/prepare-tools').expect(200)).body;
  assert.deepEqual(prepared.missing,[]);
  assert.equal((await owner.get(base+'/finance')).body.priceMinor,8000);
  assert.equal((await owner.get(base+'/budget-items')).body.length,1);
  const tasks=(await owner.get(base+'/tasks')).body;
  assert.equal(tasks.length,5);
  assert.equal(tasks[0].phase,'1. Registration & compliance');
  assert.equal(tasks[0].dueDate,'');
  await owner.put(base+'/tasks/'+tasks[0]._id).send({...tasks[0],title:'My registration task'}).expect(200);
  await owner.post(base+'/prepare-tools').expect(200);
  assert.equal(calls,1);
  assert.equal((await owner.get(base+'/tasks')).body[0].title,'My registration task');
  const changed=draft+' Monthly sales now 120.';
  result.values.find(v=>v.field==='units').value=120;
  result.values.find(v=>v.field==='units').source='Monthly sales now 120.';
  await Plan.updateOne({_id:p._id},{$set:{'sections.0.draft':changed}});
  await owner.post(base+'/prepare-tools').expect(200);
  assert.equal(calls,2);
  assert.equal((await owner.get(base+'/finance')).body.units,120);
  assert.equal((await owner.get(base+'/tasks')).body[0].title,'My registration task');
  const cost=(await owner.get(base+'/budget-items')).body[0];
  await owner.put(base+'/budget-items/'+cost._id).send({...cost,amountMinor:250000}).expect(200);
  assert.equal((await owner.get(base)).body.sections[5].status,'draft');
  await owner.post(base+'/prepare-tools').expect(400);

 } finally {globalThis.fetch=original;delete process.env.GEMINI_API_KEY;}
 await owner.delete(base).expect(200);
});
