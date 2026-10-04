# Biz-Z requirements audit

Updated 2 October 2026 against the supplied final-project rubric. Implemented means source exists; verified means the stated check passed. Isolated MongoDB tests are not proof of current Atlas availability.

## Remaining submission blockers

- Live Atlas recovered during the latest sign-in investigation: a direct connection succeeded and the running API reports database true. Earlier intermittent DNS/TLS failures are not fully explained. Repeat the user sign-in/save/reload walkthrough and live catalog seed before submission.
- Gemini generation succeeded on 29 September with the configured model. Current guided-flow regression tests use mocked Gemini responses; repeat the complete live flow once Atlas reconnects.
- The rubric conflicts: two client/server repositories versus one repository containing client/server folders. The professor has not clarified. The user has created a repository; no commits, pushes, or publication were performed in this completion pass. Authentic contributions from every member and final repository arrangement remain unverified.
- Group membership is confirmed in TEAM.md. Suggested responsibilities are not evidence of historical authorship. Each member must rehearse the defense and explain the actual code. Concept uniqueness among groups remains unverified.
- Document deadline is October 5 and defense October 5–6 in the A.Y. 2026–2027 rubric; confirm any instructor changes.

## Rubric coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| Original app with public landing page | Implemented | Bee-themed guided business planner; `/` includes purpose, steps, outputs and calls to action. |
| React/Vite/TypeScript and Tailwind | Verified build | Typed reusable components, shared theme, Vite/Tailwind integration. |
| 10+ distinct React Router pages | Implemented | 13 content page types below; section instances and 404 are not inflated counts. |
| React Hook Form, external Zod schemas, z.infer | Implemented | Account, onboarding, new-plan, chat, plan settings, financial assumptions, costs and tasks. Server validates independent of browser. Optional direct draft editing uses controlled state and server validation. |
| One axios instance and custom hook | Implemented | `src/services/api.ts`; `src/hooks/useWorkspaceNavigation.ts`. |
| Stable list keys and derived values | Implemented | Persisted message IDs, record IDs and stable topic values; draft text no longer uses paragraph-index keys. |
| Loading/error/empty/success states | Implemented; sampled in browser | Shared full-screen loading, error/success modals, empty states and retry paths. Routine Zee saves and login do not interrupt with success dialogs. |
| Delete confirmation | Implemented | Plans, budget items and launch tasks. |
| Five related MongoDB collections | Verified isolated database | User → Plan → BudgetItem/LaunchTask; optional Plan → BusinessIdea. All five have timestamps and Mongoose validation. Live Atlas remains blocked above. |
| Seed data | Implemented; QA verified | `server/seed.js` upserts six illustrative catalog ideas; `server/qa.js` seeds related disposable records in isolated MongoDB. Live seed has not succeeded. |
| 20+ endpoints and CRUD | Verified integration tests | 35 method/path pairs in API.md; plan updates, section edits, full budget/task CRUD, owner isolation. |
| Five genuine processing endpoints | Verified automated tests | Financial summary, break-even, sales scenarios, task summary, profile/idea matching; owned deterministic calculations independent of Gemini. |
| Router/routes/models/clean app.js | Implemented | `server/app.js`, bootstrap `index.js`, routes, models, middleware, services folders. |
| Logger/CORS/errors/validation | Verified integration tests | Request method/path/status/duration; credential-aware origin allowlist; JSON 400/401/403/404/409/503; unknown API route returns 404 independently of database/auth readiness. |
| Environment/secrets | Implemented | MONGO_URI with MONGODB_URI compatibility, PORT, JWT/Gemini configuration; ignored `.env`, `.env.example`, no client API key. |
| Responsive consistent interface | Partially verified | Desktop financial/editor checks; Money lab at 375px had no horizontal overflow. Exhaustive device/accessibility audit not claimed. |
| Revision history and restore | Verified API and browser | Earlier/later preview; restoration appends a version and requires review; three versions retained. After closing restore success, body/root overflow reset and actual scroll moved from 724 to 0. |
| README/setup/API/screenshots/member details | Implemented | README.md, API.md, TEAM.md, screenshots folder and DEFENSE.md. Screenshots use disposable test data. |
| Git history/repository compliance | Deferred / unverified | Instructor ambiguity and authentic member contribution evidence remain open. |
| Presentation/defense | Prepared, not performed | DEFENSE.md gives walkthrough, processing examples, validation/404 demo, and member preparation. |

## Distinct page inventory

1. `/` landing
2. `/start` starting path
3. `/onboarding` profiling
4. `/ideas` recommendations/catalog
5. `/plans` plan library
6. `/plans/new` creation
7. `/plans/:planId` journey
8. `/plans/:planId/sections/:sectionIndex` editor (one page type)
9. `/plans/:planId/review` review/export
10. `/profile` profile
11. `/help` guide
12. `/plans/:planId/money` financial workspace
13. `/plans/:planId/launch` launch checklist

## Verification record — 2 October 2026

- Production build and ESLint passed. Build reports a non-failing main-bundle size warning.
- Three automated test groups passed: account/ownership/CRUD/AI integration, financial arithmetic/edge cases, date/matching rules. Integration group includes multiple API workflows, not just one assertion.
- Browser login to isolated QA succeeded; Money lab displayed PHP 20,000 startup, PHP 5,000 fixed costs, PHP 15,000 revenue, PHP 4,000 profit and 56 break-even sales.
- Browser created two draft editions and restored the first as version 3; prior editions retained and scrolling recovered after dialogs closed.
- Prior browser QA checked cost creation, sales scenarios and 375px layout. PDF download was previously exercised; latest export error/loader handling is implemented.
- Current live health: auth and AI configuration present, database unavailable. Configuration presence does not prove a successful live AI request.

## Scope notes

The stricter rubric thresholds (10 pages, five collections, five computations) were used. Inventory, payments, uploads and deployment are examples/optional extras, not automatically required scope. See FEATURE_PLAN.md for the original proposal and README.md for current limitations.

### Copy update

Shortened landing, onboarding, dashboard, editor, account, help and financial helper text. Removed static interface em dashes. Zee prompts now require brief replies, one question at a time, and no em dashes while retaining complete section drafts. Existing saved user content is preserved. Build and lint passed for the copy changes; live Gemini style compliance remains unverified.

### Sign-in outage recheck

User saw login HTTP 503 while MongoDB was unavailable. A fresh direct Atlas check outside the restricted sandbox succeeded; running API health then reported database/auth/AI configuration available. No password changes or access-list changes were made. A restricted diagnostic hit DNS timeout, which alone does not establish the cause of the user’s server outage. User sign-in retry remains to be confirmed.

### Decision confirmations
Added cancel/confirm dialogs before sign-out, draft restoration and marking a section reviewed. Existing plan/item deletion and unsaved-navigation confirmations remain. Sign-out shows loading and preserves the session on request failure. Build and lint passed; interactive checks for the added dialogs are pending.

### Unified AI suggestions
AI suggestions now form one searchable, sortable ranked list. Up to six ideas per batch; Show more appends with name deduplication and sends exclusions. Server computes profile-fit scores from validated AI requirements, never accepts AI scores. Existing catalog endpoints remain for stored reference ideas, but the separate catalog UI is removed from exploration. Costs/time are labeled estimates. Demo ideas remain explicitly unscored samples. Suggestions currently last only while this page remains mounted.

### Plan context and navigation
Added a shared current-plan header with name, review count, switch-plan and edit actions. Route links show active state with aria-current, hover, pressed and keyboard focus styling; mobile uses a wrapping grid. Added a Build plan link. Build/lint passed; desktop browser verified plan name and Overview aria-current. Mobile styling implemented but not rechecked in this pass.

### Zee typing indicator
Section AI requests now use inline animated typing dots, including draft revisions. The full-screen loader remains for saving and other system operations. Duplicate chat loader removed. Reduced-motion styling and screen-reader status included. Build/lint passed; live AI visual verification pending.

### Shared modal layout
Standardized shared modal headers, left-aligned content, right-aligned action rows, form submission buttons and responsive spacing. Direct actions are grouped in a shared footer. Build/lint passed; sign-in dialog opened successfully in browser. Full per-dialog mobile visual audit not claimed.

### Atlas outage — 3 October 2026
Direct connection outside sandbox failed with ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR from all three Atlas nodes. Exact cause is unconfirmed; current Atlas access list and cluster status need inspection. Startup retries now show credential-safe categorized hints and back off from 5 to 60 seconds. This improves diagnosis, not connectivity itself.

### Flexible profile choices
Added reusable tiles with custom entry for interests, working style and skills. Interests and traits retain exactly five selections; skills allow up to ten and remain optional. Custom entries reject case-insensitive duplicates and preserve selected custom values when reopening the profile. Skills retain the existing string storage format for API compatibility.

### Location research request — 3 October 2026
Google place search, optional map pin, competitor discovery and location-aware SWOT are requested but not implemented. No Maps key configured. Provider/billing setup is awaiting user input; this feature is not counted as rubric evidence. See FEATURE_PLAN.md for the agreed direction and validation needs.

### Suggestion card layout
Replaced decorative emoji headers with category/fit metadata, description, fit rationale, estimated startup/monthly costs, assumptions and actionable first step. Gemini prompt requests the new fields; missing estimates explicitly show Not estimated, not zero. Legacy/demo content falls back without inventing actions or costs.

### Folder organization
Frontend source/public/HTML moved to client/. Backend remains server/ with routes/models/middleware/services. Vite and TypeScript paths updated; root npm commands and dist output retained. Asset folders separate brand, mascot and illustrations. Repository publication decision remains open.

### Supplied brand assets
Installed user-supplied mascot.svg in client/src/assets/mascot and logomark.svg in client/src/assets/brand. Shared mascot component now renders the supplied SVG everywhere; navigation/landing logo icon and favicon use the logomark. Existing wordmark text retained because the supplied logomark is a square symbol. No separate happy pose was supplied.

Brand asset clarification: supplied biz-z.svg now replaces the CSS text wordmark beside logomark.svg. mascot.svg is used for Zee illustrations. Shared components maintain sizing and image alt text.

Brand replacement: user-supplied PNGs now replace the SVG versions. Active assets are brand/logo.png, brand/logomark.png and mascot/mascot.png; favicon uses public/logomark.png.

### Follow-up polish — 4 October 2026
Adjusted PNG mascot framing to compensate for transparent margins; reduced logomark scaling to avoid clipping. Added password show/hide to shared authentication form, removed registration hint from sign-in, and blocked field copy/cut/paste/drop as requested. Clipboard blocking is a UI restriction, not a security guarantee.

## Zee Adviser (4 October 2026)

Implemented `/adviser` as a separate saved-chat page with search, rename, delete confirmation, optional owned-plan context and inline typing feedback. The dashboard card and sidebar open this page. Advising never mutates plan drafts. Signed-in users have a sixth MongoDB collection, Conversation, with owner checks on every operation.

Verified: production build, ESLint and all four automated test groups pass. Adviser integration tests cover save/reopen, rename/delete, cross-account denial, unavailable AI preserving history and unchanged plan contents. Gemini replies in these tests are mocked. Current live Atlas/Gemini adviser use is not yet verified; earlier connectivity and submission blockers still apply.
