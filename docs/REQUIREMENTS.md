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

## Sequential review and export gates (4 October 2026)

Each section now requires all earlier sections to be reviewed. Dashboard cards, direct editor routes, section navigation and review-page edit links follow this rule. Both manual section saves and plan-related Zee endpoints enforce it on the server. PDF export requires eight reviewed, nonempty drafts; signed-in export fetches a freshly validated plan through GET /api/plans/:id/export. Saving manual draft edits removes that section's reviewed status. Existing later drafts are retained while locked.

Validation: regression tests exercise all seven locked sections, sequential unlocking, export before and after all eight reviews, owner isolation and relocking after an earlier edit. Live Atlas/Gemini verification remains separate.

## Preset profile choices (4 October 2026)

Removed custom-entry controls from interests, personality and work preferences. Each group has 24 preset tiles with shared dimensions and responsive columns. Skills input is replaced by “How do you like to work?” with up to five preferences saved in a separate workStyles field; earlier skills and custom selections are preserved rather than reinterpreted. AI suggestions receive work preferences, and matching uses them when present, with legacy skills retained for older profiles. Build and lint pass. Integration coverage checks preference persistence, legacy skill preservation and the five-choice limit. Live AI output is not newly verified.

## Visible revisions and business context updates (4 October 2026)

Draft previews now compare against the latest different saved version, highlight the changed passage and strike through replaced text, with a hide/show toggle. Reviewed sections with no unsaved changes allow Back/Previous without confirmation; forward navigation retains confirmation.

Business name edits replace the old name in existing drafts and retain revisions. Description changes regenerate all existing drafts together through Gemini before saving the details; malformed/incomplete AI responses leave the existing plan unchanged. Affected sections require review again and export remains gated. Local demo supports name changes; rewriting existing drafts after a description change requires sign-in. Automated tests use mocked Gemini; live generation remains unverified.

## Concise captions and sign-in splash (4 October 2026)

Removed decorative workspace footer text, dashboard bottom motto and repeated loader reassurance. Demo status now uses a shorter notice with a readable 14px size. Sign-in uses the supplied bee portrait and animated progress bar, with a brief 900ms minimum after successful authentication while plans load. Reduced-motion users receive a static indicator without the artificial delay. Build and lint pass; live sign-in was not reverified for this cosmetic update.

## Compact shared dialogs (4 October 2026)

Replaced accumulating label margins inside modal flex forms with a consistent 16px form gap. Standardized dialog padding, field heights, readable text and action spacing. Password visibility is now an accessible icon inside the field. Dialogs retain scrolling on short viewports, with smaller mobile padding. Build and lint pass; exact browser zoom/device appearance is not yet visually reverified.

## Connected planning tools (4 October 2026)

Plan navigation now follows Overview, Build plan, Review & export, Money lab, Launch checklist. Each section includes purpose/output guidance, and the Zee prompt requests business-specific questions that reuse known facts. Existing-draft chat starts collapsed and can be expanded without losing conversation state.

Money lab can extract explicit values from owned draft content, show source quotes and fill the form for review before saving. It does not invent missing values or automatically overwrite saved assumptions. Launch supports AI task suggestions, deterministic templates from drafted sections, and manual tasks, with date selection before saving. Checklist action rows wrap responsively, checkboxes retain appropriate dimensions, and tasks offer Mark done/Reopen. POST /api/plans/:planId/tool-suggestions is owner-scoped and makes no plan/task mutations. Automated checks use mocked Gemini; live extraction accuracy and full visual/device verification remain outstanding.

## Locked post-plan pages (4 October 2026)

Review & export, Money lab and Launch checklist now remain disabled in navigation until all eight sections have nonempty reviewed drafts. Lock icons and a reviewed-count explanation identify unavailable tools. Direct page URLs render a locked screen with Continue my plan rather than mounting the tool. Dashboard and planning-stage review controls use the same completion rule. Editing that removes reviewed status relocks these pages while retaining saved tool data. This is a page-access rule; existing authenticated money/task API endpoints remain available, while export already has server validation. Build and lint pass.

## Build-plan copy reduction (4 October 2026)

Consolidated repeated section guidance into one short subtitle. Removed repeated chat introductions and decorative draft captions; shortened action labels, placeholders, save status and lock guidance. Revision controls are tucked under Revise with Zee. Dashboard copy is more direct. Full business drafts, conversation history, validation and essential review confirmations are preserved. Build and lint pass.

## Business-plan reference adaptation (5 October 2026)

Read the supplied DOCX and mapped its useful business headings into Zee's eight-section drafting guidance. University/course/instructor/student details, academic cover wording and sample figures are excluded. Export adds a business cover, contents, executive-summary-first reading order, section page breaks and page numbers while retaining the existing build sequence. See PLAN_REFERENCE.md for adopted coverage and excluded optional features. Existing drafts are preserved. Next steps adds four topic-based search links after full review; these are not verified resource recommendations. PDF layout and live AI coverage still require visual/live verification.

## Continuous Zee revision experience (5 October 2026)

Idea cards align to the top rather than stretching to the expanded neighbor's height. The section chat now has a Zee portrait, stays open by default, and retains one composer for both initial answers and revisions. A visible Ask Zee to revise action focuses that composer from the draft. Conversation height is bounded and remains collapsible. Business-name replacement covers case and whitespace variations and literal special characters in all current drafts, including AI-regenerated content; historical revisions remain unchanged. Build and lint pass; automated rename regression added. Full visual browser verification remains outstanding.

## Section-specific choice buttons (5 October 2026)

Zee choices use 16px text and at least 52px touch targets. Revision shortcuts now vary by section purpose; generated choices request the latest question/draft and business context. Previously selected choices and duplicate generated labels are filtered. Build/lint and regression checks cover code validity; live AI relevance remains unverified.

## Name-first setup and progress-preserving rename (5 October 2026)

Name-only edits now retain section review statuses in account and demo plans while updating name mentions and recording revision history. Description changes still require review. Generated ideas use descriptive business concepts, and choosing one creates Untitled business instead of assigning an AI brand. The initial company chat asks for a name or confirmation of an existing name. Subsequent guidance asks owner count and setup one at a time, permits requested name suggestions and carries a confirmed name into plan metadata/current drafts. These follow-up choices depend on Gemini; live conversational verification remains pending. Rename regression now expects preserved review progress.

## Adaptive section interviews (5 October 2026)

Removed the two-question drafting limit. Zee now prioritizes missing business-specific facts and contradictions, uses each section's coverage as a non-exhaustive guide, and skips irrelevant or already answered questions. Uncertainty can lead to helpful choices instead of prematurely ending the conversation. Explicit draft-now requests still work with labeled assumptions. Revision requests can ask a clarifying question without replacing the existing draft. Recent section context increased to 40 messages. Live conversational quality remains unverified; automated checks validate route behavior using mocked output.

## Direct discovery flow (5 October 2026)

Discover ideas routes incomplete profiles to inputs; completed profiles automatically generate suggestions on entering the ideas page, eliminating the extra Find ideas click. The yellow mascot banner stays as the results header and inline generation state. Retry and Show more remain available. Build and lint pass; live generation was not rechecked.

## Business location before discovery (5 October 2026)

The banner now lists all five selected interests. Discovery waits for users to choose their profile location or enter another city/country. The request passes that location as generation context without changing the profile, and the chosen idea carries its location into the new plan description. Location assumptions must be labeled; there is no Maps lookup or verified local market research. Demo ideas remain illustrative. Build/lint pass; live recommendation quality is unverified.

## Location prompt reverted (5 October 2026)

Removed the optional business-location selection from discovery at the user's request. Automatic generation is restored; new plans no longer append the selected location. The existing profile location field and display of all five interests are retained. Existing saved plans are not modified.

## Commit verification (8 October 2026)

At the user's request, pending work is grouped into database/backend and connected frontend/documentation commits using the configured Adraneda identity. This grouping records the actual changed areas, not proof of exclusive authorship or completion of other members' assignments. Production build, ESLint, all nine automated tests and git diff --check passed. The existing bundle-size warning remains. Live Atlas/Gemini and full visual/PDF verification remain outstanding.
