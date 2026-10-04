# Biz-Z

Biz-Z helps first-time founders build a business plan in eight manageable sections. Zee, the Gemini assistant, leads short interviews, drafts prose, and revises it on request. Money lab calculates from saved inputs; AI does not perform the authoritative arithmetic.

## Team

User-reported focus areas (not a claim of commit ownership):

| Member | Focus |
| --- | --- |
| Ann Nicole P. Adraneda | Database and backend |
| Rhianna Mikaella Gomez | Backend |
| Lorenzo Carlos R. Tan | Frontend |

See [team responsibilities](docs/TEAM.md) for proposed review/defense assignments. Every member must understand and verify the code they present. Do not fabricate contribution history.

## Setup

1. Install Node.js 22.12 or newer and run `npm install`.
2. Copy `.env.example` to `.env` if no local configuration exists. Do not overwrite an existing file containing credentials.
3. Set `MONGO_URI` to your MongoDB Atlas connection string, with database `bizz`. Legacy `MONGODB_URI` remains supported.
4. Set `JWT_SECRET` to a random secret of at least 32 characters. Generate one locally with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
5. Optionally set `GEMINI_API_KEY` and `GEMINI_MODEL` (the local configuration uses `gemini-flash-latest`). Keys are used only by Express.
6. Run `npm run seed` to upsert six illustrative catalog ideas. This does not delete user records or create accounts.
7. Run `npm run dev` and open the address Vite prints, normally `http://127.0.0.1:5173`.

Atlas requires a running cluster, valid database credentials and the connecting machine's public IP in its access list. Optional `DNS_SERVERS` changes DNS for the Node process only. It cannot fix blocked TLS or Atlas access restrictions. Never disable TLS verification.

`CLIENT_ORIGINS` is a comma-separated allowlist for direct browser API access. The Vite proxy preserves the browser Host for same-origin checks. `PORT` defaults to 3001. `API_TARGET` optionally overrides the Vite proxy target for isolated testing. Do not put secrets in `VITE_` variables.

Build: `npm run build`. Check: `npm run lint` and `npm test`. Production: set `NODE_ENV=production`, run `npm start`; Express serves `dist` and the API on the configured loopback port. External deployment is not configured by this project.

## Features and data processing

- Public landing page and 13 routed content views, plus not-found handling.
- Exactly five interests and five traits; RHF/Zod forms and a saved profile.
- Account sessions in HttpOnly cookies, bcrypt password hashing and owner-scoped plans.
- Full plan CRUD, separate section interviews, generated draft revisions and restoration history.
- Automatic Zee introduction for empty sections; short answers, suggested buttons, essay generation and revisions.
- Money lab: startup/monthly line totals, funding gap, revenue, expenses, operating profit, margin, runway and break-even.
- Sales scenarios at 70%, 100% and 130% of saved sales volume, holding saved unit costs/prices constant.
- Catalog matching: interest overlap 40 points, skills 25, affordable capital 20, available time 15; missing inputs earn no points. Scores are not success probabilities.
- Launch tasks with CRUD, completion percentage, overdue calculation and valid calendar dates.
- Loading screens, operation modals, deletion confirmations, unsaved editor navigation protection, shared modal scroll locking.
- Review/export as PDF. Executive summary unlocks after sections 1–6 are reviewed; changing those sections invalidates summary review.

Money is stored as integer minor units (100 minor units = one displayed currency unit). Per-unit amounts are bounded to 1,000,000 currency units, quantities to 10,000, monthly sales to 1,000,000 and nested resources to 200 per type/plan. Arithmetic assumes a single currency and one primary product/service. Changing currency relabels values; it does not convert them. No taxes, debt payments, exchange-rate feeds, stock management or verified legal research are included.

## Structure

- `client/src/`: React components, routed views, `schemas/`, `hooks/`, and one Axios service.
- `server/index.js`: environment, DNS, database connection/retry and server startup.
- `server/app.js`: Express configuration, middleware, API mounting and static hosting.
- `server/routes/`: authenticated API and related-resource routers.
- `server/models/`: five Mongoose collections, embedded section/version schemas.
- `server/services/`: deterministic computations and catalog fixtures.
- `server/middleware/`: request logging, origin/CORS handling and JSON error mapping.
- `docs/`: rubric audit, API examples, defense walkthrough and team assignments.

Database relationships: User → Plan; Plan → BudgetItem and LaunchTask; Plan optionally references BusinessIdea when chosen from the catalog. Sections, messages and draft versions are embedded in Plan.

## API and demonstration

See [all 35 endpoints with example requests/responses](docs/API.md), [defense walkthrough](docs/DEFENSE.md), and [requirements audit](docs/REQUIREMENTS.md).

For a disposable local demonstration without Atlas:

1. Run `node server/qa.js` (ephemeral MongoDB on a temporary local port, API at 3002).
2. In a second PowerShell terminal run `$env:API_TARGET='http://127.0.0.1:3002'; npx vite --port 5175 --strictPort`.
3. Open `http://127.0.0.1:5175`. Use `demo@bizz.test` / `Demo-only-123!` (test-only credentials).
4. Stop both processes afterward. This database is disposable; it is not Atlas and does not prove persistence across restarting QA.

The QA fixture includes an account, bakery plan, two costs, a launch task and catalog ideas. Gemini is disabled in QA. API tests mock Gemini responses and use a separate ephemeral MongoDB; no live user data is read or modified.

## Limitations and submission checks

- Live Atlas was previously verified but the latest connection attempt failed during TLS negotiation. Reverify the user's network/Atlas access before presenting live persistence; do not claim the isolated QA run is Atlas.
- Live Gemini worked earlier; current feature tests use mocked responses. Check the configured model and quota before the defense.
- Browser-only demo plans are separate from authenticated plans. Money lab and tasks require an account.
- AI may make mistakes; generated assumptions and legal details require human review. It does not verify market facts.
- Concurrent edits in multiple tabs are not conflict-merged. Version history starts when a draft is first changed with revision support enabled.
- PDF's built-in font targets Latin text; non-Latin scripts need an embedded font.
- The course document conflicts between one repository and separate client/server repositories. Instructor clarification remains pending. No commits or publication were performed by this implementation pass.

## Asset organization

Frontend entry: `client/index.html`. Public assets: `client/public/`. Imported artwork: `client/src/assets/brand/`, `mascot/`, and `illustrations/`. Root package/config files run both client and server; existing npm commands are unchanged. See `docs/STRUCTURE.md`.

## Screenshots

Captured in the isolated QA workspace with disposable sample data; these do not prove live Atlas availability.

![Money lab with saved inputs and computed results](docs/screenshots/money-lab.png)

![Restored section draft with three retained versions](docs/screenshots/restored-draft.png)
