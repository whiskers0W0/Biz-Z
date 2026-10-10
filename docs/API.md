# API reference

All paths include `/api`. Sessions use the HttpOnly `bizz_session` cookie. Send JSON for POST/PUT. Each sample is illustrative; IDs and dates vary. Lists return arrays of the indicated record shape. Successful creates use 201; reads/updates/deletes use 200. Missing records use 404, validation uses 400, signed-out requests use 401, disallowed origins use 403, unavailable service uses 503, and invalid AI responses use 502. Errors consistently use `{ "error": "explanation" }`.

Total: **35 method/path pairs**, including health/auth. Five computation endpoints are marked **Processing**.

| Method | Path | Purpose | Sample request body | Sample response |
| --- | --- | --- | --- | --- |
| GET | /api/health | Connection status | `—` | `{"database":true,"ai":true,"auth":true}` |
| POST | /api/auth/register | Account session | `{"email":"demo@example.test","password":"example-password","name":"Builder"}` | `{"id":"…","name":"Builder","email":"demo@example.test","profile":{}}` |
| POST | /api/auth/login | Account session | `{"email":"demo@example.test","password":"example-password","name":"Builder"}` | `{"id":"…","name":"Builder","email":"demo@example.test","profile":{}}` |
| POST | /api/auth/logout | Clear session | `—` | `{"ok":true}` |
| GET | /api/me | Profile/session information | `—` | `{"interests":[],"traits":[]}` |
| PUT | /api/profile | Update complete profile | `{"interests":["Food","Design","Pets","Technology","Crafts"],"traits":["Creative","Organized","Curious","Patient","Practical"],"skills":"Baking","hours":10,"capital":20000,"monthly":5000,"location":"Sample City","currency":"PHP"}` | `{"interests":["Food","Design","Pets","Technology","Crafts"],"traits":["…"]}` |
| GET | /api/plans | Manage owner-scoped plans | `—` | `{"_id":"…","name":"Sunny Bakery","sections":[],"messages":[]}` |
| POST | /api/plans | Manage owner-scoped plans | `{"name":"Sunny Bakery","description":"Small-batch bread"}` | `{"_id":"…","name":"Sunny Bakery","sections":[],"messages":[]}` |
| GET | /api/plans/:id | Manage owner-scoped plans | `—` | `{"_id":"…","name":"Sunny Bakery","sections":[],"messages":[]}` |
| DELETE | /api/plans/:id | Manage owner-scoped plans | `—` | `{"ok":true}` |
| PUT | /api/plans/:id/sections/:index | Save/review section with version history | `{"answers":[],"draft":"Our bakery…","status":"draft"}` | `{"_id":"…","sections":[]}` |
| POST | /api/ideas | Gemini idea generation from saved profile | `{}` | `[{"name":"…","description":"…","why":"…","needs":"…","challenge":"…"}]` |
| POST | /api/plans/:id/chat | Legacy contextual chat | `{"message":"Explain this section","section":0}` | `{"text":"…"}` |
| POST | /api/plans/:id/sections/:section/zee | Generate scoped interview/draft | `{"message":"Focus on families"}` | `{"text":"Here is your draft","options":[],"draft":"…","plan":{}}` |
| GET | /api/ideas | Catalog read/search (?q=food&tag=Food) | `—` | `{"_id":"…","name":"Home bakery","tags":["Food"],"capital":15000,"currency":"PHP"}` |
| GET | /api/ideas/:ideaId | Catalog read/search (?q=food&tag=Food) | `—` | `{"_id":"…","name":"Home bakery","tags":["Food"],"capital":15000,"currency":"PHP"}` |
| GET | /api/profiles/me/idea-matches | **Processing**: weighted profile matching | `—` | `[{"_id":"…","name":"Home bakery","score":60,"reasons":["1 matching interests"]}]` |
| GET | /api/profiles/me | Profile/session information | `—` | `{"interests":[],"traits":[]}` |
| PUT | /api/plans/:planId | Manage owner-scoped plans | `{"name":"Sunny Bakery","description":"Small-batch bread"}` | `{"_id":"…","name":"Sunny Bakery","sections":[],"messages":[]}` |
| GET | /api/plans/:planId/finance | Read/save financial assumptions | `—` | `{"currency":"PHP","capitalMinor":10000000,"priceMinor":15000,"variableMinor":6000,"units":100}` |
| PUT | /api/plans/:planId/finance | Read/save financial assumptions | `{"currency":"PHP","capitalMinor":10000000,"priceMinor":15000,"variableMinor":6000,"units":100}` | `{"currency":"PHP","capitalMinor":10000000,"priceMinor":15000,"variableMinor":6000,"units":100}` |
| GET | /api/plans/:planId/budget-items | Manage related cost records | `—` | `{"_id":"…","plan":"…","name":"Rent","category":"monthly","amountMinor":500000,"quantity":1}` |
| POST | /api/plans/:planId/budget-items | Manage related cost records | `{"name":"Rent","category":"monthly","amountMinor":500000,"quantity":1}` | `{"_id":"…","plan":"…","name":"Rent","category":"monthly","amountMinor":500000,"quantity":1}` |
| GET | /api/plans/:planId/budget-items/:itemId | Manage related cost records | `—` | `{"_id":"…","plan":"…","name":"Rent","category":"monthly","amountMinor":500000,"quantity":1}` |
| PUT | /api/plans/:planId/budget-items/:itemId | Manage related cost records | `{"name":"Rent","category":"monthly","amountMinor":500000,"quantity":1}` | `{"_id":"…","plan":"…","name":"Rent","category":"monthly","amountMinor":500000,"quantity":1}` |
| DELETE | /api/plans/:planId/budget-items/:itemId | Manage related cost records | `—` | `{"ok":true}` |
| GET | /api/plans/:planId/tasks | Manage launch tasks | `—` | `{"_id":"…","plan":"…","title":"Test a batch","dueDate":"2026-10-05","done":false}` |
| POST | /api/plans/:planId/tasks | Manage launch tasks | `{"title":"Test a batch","dueDate":"2026-10-05","done":false}` | `{"_id":"…","plan":"…","title":"Test a batch","dueDate":"2026-10-05","done":false}` |
| GET | /api/plans/:planId/tasks/:taskId | Manage launch tasks | `—` | `{"_id":"…","plan":"…","title":"Test a batch","dueDate":"2026-10-05","done":false}` |
| PUT | /api/plans/:planId/tasks/:taskId | Manage launch tasks | `{"title":"Test a batch","dueDate":"2026-10-05","done":false}` | `{"_id":"…","plan":"…","title":"Test a batch","dueDate":"2026-10-05","done":false}` |
| DELETE | /api/plans/:planId/tasks/:taskId | Manage launch tasks | `—` | `{"ok":true}` |
| GET | /api/plans/:planId/financial-summary | **Processing**: totals, funding gap, profit and runway | `—` | `{"startup":2000000,"fixed":500000,"profit":400000,"fundingGap":0,"margin":26.67,"runway":null}` |
| GET | /api/plans/:planId/break-even | **Processing**: contribution and minimum sales | `—` | `{"contribution":9000,"units":56,"reason":"…"}` |
| POST | /api/plans/:planId/scenario-comparisons | **Processing**: explicit volume scenarios | `{"units":[70,100,130]}` | `[{"units":70,"revenue":1050000,"profit":130000}]` |
| GET | /api/plans/:planId/task-summary | **Processing**: completion and overdue counts (optional ?today=YYYY-MM-DD) | `—` | `{"total":3,"completed":1,"percent":33,"overdue":1,"upcoming":[]}` |

Numeric financial response fields are minor currency units except percentages, unit counts and months. Budget line totals are amountMinor × quantity. Null break-even means no positive contribution; null runway must be read with runwayReason. Catalog estimates are illustrative and must not be presented as market research.

Plan deletion removes its related budget items/tasks. Every child lookup includes both its own ID and the owner-authorized plan. No request may supply its own owner field.

### Updated POST /api/ideas
Accepts optional `{ "exclude": ["Earlier idea name"] }` (up to 60 names). Returns up to six AI suggestions with name, description, why, needs, challenge, tags, skills, capital, hours, currency, server-calculated score and reasons. Exact-name duplicates/exclusions are removed; fewer results are possible. Bad input returns 400; invalid AI output returns 502. Scores compare interests (40), skills (25), affordable budget (20), and weekly availability (15). Estimates are not market research or success probabilities.

## Zee Adviser

All routes require a signed-in account and only access its conversations.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/conversations | List saved chat titles, context and update dates |
| POST | /api/conversations | Create chat with optional owned plan ID |
| GET | /api/conversations/:conversationId | Read saved messages |
| PUT | /api/conversations/:conversationId | Rename with a 1–100 character title |
| DELETE | /api/conversations/:conversationId | Permanently delete chat |
| POST | /api/conversations/:conversationId/messages | Generate and save a user/adviser exchange |

Messages accept 1–4000 characters. Chats hold up to 200 messages; Gemini receives the latest 20 messages and optional current plan drafts as context. A failed generation does not append an exchange. Concurrent updates return 409. Plan contents are never changed by these endpoints.

### Sequential planning and export

Section update and section Zee requests require every preceding section to be reviewed (400 otherwise). GET /api/plans/:id/export returns the owned plan only when all eight sections have nonempty reviewed drafts, otherwise 400. Another account receives 404. The PDF interface uses this validated snapshot for signed-in users.

### Plan-based tool suggestions

POST /api/plans/:planId/tool-suggestions accepts mode money, launch or template. Money returns values with exact supporting draft quotes; launch returns AI task titles and reasons; template creates suggestions from existing drafted sections without AI. Suggestions do not persist changes. Missing drafts return 400 for AI modes, malformed/unsupported output returns 502, and another owner's plan returns 404. Users review and save through existing finance/task endpoints.

### Automatic completed-plan tools

`POST /api/plans/:planId/prepare-tools` requires the owned plan to have all eight nonempty drafts reviewed. Prepares financial assumptions, costs and phased launch tasks using Gemini and verified source quotes; subsequent calls reuse results until draft content changes. On change, untouched generated data can refresh while manual edits/deletions are preserved. Returns preparation metadata including missing financial fields and missing cost breakdown. Final section review also starts this preparation asynchronously.

Launch task inputs additionally accept optional `phase` and `details`, and an empty `dueDate` for unscheduled tasks. Automatically generated tasks include agency `links`. Budget-item updates invalidate financial and summary reviews. Currency enums support PHP, USD, EUR, GBP, SGD, AUD, CAD, NZD, HKD, CNY, JPY, KRW, INR, MYR, THB, IDR, VND, AED, SAR and CHF; changing the currency does not convert amounts.

### Standalone Money Lab (9 October 2026)

Authenticated endpoints independent of business plans:
- `GET /api/calculations`: list the current user's saved scenarios (newest first).
- `POST /api/calculations`: create, up to 200 per user.
- `PUT /api/calculations/:calculationId`: update an owned scenario.
- `DELETE /api/calculations/:calculationId`: delete an owned scenario.

Body: `{title, kind, currency, inputs}`. Kinds: `profit`, `pricing`, `break-even`, `runway`, `loan`, `roi`. Required numeric fields and formulas are defined in `shared/moneyLab.js`; all values must be finite and nonnegative, with additional calculator-specific validation. Responses recompute `results` from validated inputs. Inaccessible IDs return 404. Device-only demo saves do not call these endpoints. Existing plan-finance endpoints remain for compatibility and do not back standalone calculator records.

### Preparation cleanup (10 October 2026)

`POST /api/plans/:planId/prepare-tools` now prepares only launch checklist tasks. Its response identifies `scope: "launch"`; no financial values, cost extraction, missing-finance metadata, or budget writes are performed. Existing cached checklists remain valid. The earlier automatic-financial-preparation description is superseded. Legacy financial CRUD endpoints and stored data remain for compatibility; standalone `/calculations` remains independent.
