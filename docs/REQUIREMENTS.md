# Biz-Z requirements audit

Reviewed 29 September 2026 against `Bautista_CTADWEBL_Final_Project_Instructions_and_Rubric.docx` supplied by the user. The user requested proposals for missing data-processing features, a clearer flow, continuous gap reporting, and deferred Git setup.

Status meanings: **Implemented** = present in source; **Partial** = some evidence exists but the complete criterion is not satisfied; **Missing** = not implemented; **Deferred** = intentionally postponed; **Unverified** = requires credentials, external confirmation, or presentation evidence. A successful build alone is not full compliance.

## Important requirements and conflicts

- Core requirements say **at least 10 React Router pages**; a scoring row says **4+**. Use the stricter 10-page requirement. Auth dialogs and eight instances of one section page should not be used to inflate the count.
- Core requirements say **at least 2 related collections**; the Excellent tier awards full database points for **5 or more well-related collections**. Target five meaningful collections.
- Core requirements say **3–5 processing endpoints**; the Excellent tier requires **5 or more genuine computations**. Target at least five deterministic, server-side processing endpoints. Calling Gemini is not a substitute for explainable business logic.
- Repository requirements say **two GitHub repositories, client and server**; final submission says **one repository with client and server folders**. Ask the instructor to resolve this before submission. No repository setup or publication has been authorized in the current request.
- Meaningful commits from **every member throughout development** are graded. Deferring all Git history until the project is finished risks losing authentic contribution evidence. User preference to defer Git is preserved; do not invent history later.
- Exactly **2 or 3 members** are required. Group membership and uniqueness of the concept among other groups remain unverified.
- Document deadline: **October 5**; presentation/defense: **October 5–6**, in the A.Y. 2026–2027 document. No separate year is printed alongside the deadline; confirm any schedule changes with the instructor.
- Authentication, payments, deployment, and uploads are optional extra credit. Prioritize mandatory functionality before adding more of these.

## Current implementation checklist

| Requirement | Status | Evidence and remaining work |
| --- | --- | --- |
| Original application that processes data | Partial | Original business-planning theme. Section completion and summary invalidation exist. The financial calculator currently computes in React; it does not establish the required server processing coverage. |
| Public landing page | Implemented | `/` describes the product, its benefits, three-step process, eight outputs, and clear starting actions. |
| React + Vite + TypeScript | Implemented | Typed components, state, props, hooks, Vite build. |
| Tailwind CSS with custom theme | Implemented | Vite plugin, Tailwind utilities, named honey/leaf/cream/ink/lilac/sky tokens in `src/index.css`; existing component CSS needs ongoing consistency review. |
| React Router with 10+ pages | Implemented | 11 distinct content views in `src/router.tsx`, plus a workspace alias and not-found route. Deep links identify plan and section. See route inventory below. |
| React Hook Form + Zod, external schema, z.infer, field errors | Partial | New-plan form uses all four in `src/FlowPages.tsx` and `src/schemas/planSchema.ts`. Onboarding, section editing, account forms, and future finance/task forms still need conversion. |
| One configured axios instance | Implemented | `src/services/api.ts`: axios.create, baseURL, credentials, timeout, normalized errors. All frontend API requests use this service. Server-to-Gemini fetch is separate by design. |
| Custom hook in hooks folder | Implemented | `useWorkspaceNavigation` handles route context, document title, scroll position, and unsaved-navigation blocking. |
| Stable keys, no array-index keys | Partial | Plan and topic lists use stable values. Chat messages still use array indexes; give every message a persistent ID. Audit future editable lists. |
| Derived values computed during render | Implemented | Completion counts, percentages, revenue, expenses, and profit are derived, not separately stored in state. |
| Visible loading/error/empty/success states | Partial | Initial workspace loading and connection failures are visible; create/edit/delete feedback and empty plan state exist. Finish per-screen retry and network-failure coverage, including exports. |
| Delete confirmation | Implemented | Plan deletion requires explicit confirmation. Add the same pattern to new resources. |
| MongoDB Atlas/Mongoose persistence | Partial / Unverified | User and Plan models, owner references, CRUD and timestamps exist. Integration tests use isolated MongoDB. Real Atlas credentials and persistence demo remain outstanding. Local storage is demo-only. |
| Five related collections for Excellent | Missing | Current: 2 collections (User, Plan). Sections and messages are embedded documents, not extra collections. Proposed: add BusinessIdea, BudgetItem, LaunchTask. |
| Meaningful Mongoose validation | Partial | Some required/ref/unique/enum/default rules exist. Many fields remain bare String or Mixed. Add schema-level required/min/max/enums and structured profile validation. |
| Seeded MongoDB sample data | Missing | Browser demo templates are not a seed script. Add deterministic seed data with meaningful related examples and edge cases. |
| 20+ endpoints | Missing | Current: 13 explicit API method/path pairs, including health and auth. Do not count static-file fallback routes or multiple IDs as additional endpoints. |
| Full CRUD on main resource | Partial | Plans have list/get/create/delete and section updates. Add plan-level update for name, description, and other editable fields. |
| Five real processing endpoints | Missing | Existing review rules are useful but not five endpoints. AI requests are not credited as owned deterministic financial/matching logic. See feature proposal. |
| REST conventions | Partial | `/plans` is plural; existing `/profile` and `/me` can be justified as singleton/session resources, but rubric prefers plural nouns. Standardize new resources. |
| Status codes and consistent JSON errors | Partial | Most expected codes exist and JSON errors use `{error}` (a consistent alternative to the example `{message}`). Explicitly map Mongoose ValidationError/CastError to 400, malformed JSON to 400, and provide consistent rate-limit errors. |
| Invalid IDs and 404 handling | Partial | Invalid plan IDs return JSON 404. Unknown API routes must return JSON 404 independently of authentication/database availability; current middleware can return 401/503 first. |
| express.Router, routes/models folders, clean app.js | Missing | Routes live in `server/index.js`; models share `server/models.js`. Refactor into app configuration, server bootstrap, routers, models, middleware, and services. |
| Custom request logger | Missing | Startup messages are not a request logger. Add method, URL, status, and duration logging without secrets. |
| CORS configured for frontend | Missing | Current development uses Vite same-origin proxy and an origin check. Explicit credential-aware CORS allowlist is needed for the separate client/server setup. |
| .env, PORT, MONGO_URI, ignored secrets, .env.example | Partial | Example and ignores exist; code uses MONGODB_URI. Align to rubric's MONGO_URI (a compatibility alias is acceptable). Actual secret values remain user-configured. |
| Modern consistent original responsive design | Partial | Original Zee mascot, shared components, deliberate palette. Previous dashboard tested near phone width. Updated public/routed flow needs checks at exactly 375px and desktop; continue contrast/focus/overflow review. |
| Git/GitHub and authentic member history | Deferred | Explicit user request. Record the timing risk above. No Git actions taken in this update. |
| README with all required content | Partial | Setup, concept, features, limitations and basic API table exist. Missing member names/contributions, screenshots, request/response examples, final repository structure, seed/demo instructions. |
| Presentation and defense | Missing / Unverified | Prepare walkthrough of React → axios → Express → Mongoose → MongoDB; show processing, validation error, not-found case, and persisted data. Every member must explain any component, including AI-assisted code. |

## Current route inventory

The following are distinct content views; `/workspace` is an alias for the journey view and is not counted separately. The 404 fallback is not counted toward the minimum.

1. `/` — public landing.
2. `/start` — choose discover-an-idea or bring-an-idea path.
3. `/onboarding` — profile collection wizard.
4. `/ideas` — recommendation exploration.
5. `/plans` — saved-plan library.
6. `/plans/new` — validated plan creation.
7. `/plans/:planId` — selected business journey.
8. `/plans/:planId/sections/:sectionIndex` — section editor (one page type, not eight).
9. `/plans/:planId/review` — complete plan preview/export.
10. `/profile` — builder profile.
11. `/help` — user guide.

## Verification record

- Existing API integration test passed against isolated MongoDB: registration/login, owner isolation, profile validation, plan CRUD, section review rules, summary invalidation, missing Gemini key, cross-origin write rejection.
- Previous UI checks: exactly five interests/traits, plan creation, section save/review, persisted browser demo after reopening, PDF file downloaded.
- The new routing/landing/form changes require final build, lint, and browser checks before this entry can be marked verified.
- Real Gemini responses and a real Atlas deployment are **not verified** without user credentials. No secrets should appear in browser code, screenshots, README, or Git.

## Next priority order

1. Finish verifying the new flow and move remaining create/edit forms to React Hook Form + Zod.
2. Refactor server structure, complete validation/errors/CORS/logger, and add the three related collections.
3. Implement persistent financial inputs and at least five tested server computations; connect results to real UI pages.
4. Add sample seeds, complete endpoint count and CRUD, and finish all API loading/error states.
5. Complete screenshots, API examples, team contribution documentation, and a rehearsal script.
6. Resolve repository instructions, then perform Git setup only when the user requests it; authentic contributions must be made by actual members.

### Atlas configuration checkpoint — 29 September 2026
- Created ignored local .env from user-supplied Atlas credentials, selected bizz database, and generated a random session secret. No credentials are recorded here.
- Reloaded backend: health confirms auth configuration loaded. Atlas remains disconnected. Direct connection attempts returned DNS/network ETIMEOUT and ECONNREFUSED, including an attempt outside the restricted sandbox; persistence is not verified.
- Gemini key was absent from the supplied file and environment; AI remains unconfigured.


### Gemini connection checkpoint — 29 September 2026
- User added the Gemini key to local .env. Model listing succeeded. A minimal generation request succeeded with gemini-flash-latest; local model setting updated after gemini-2.5-flash returned HTTP 404.
- Backend detects AI configuration. Full authenticated idea/chat workflows remain unverified because Atlas is still disconnected. No key recorded in documentation.

