# Proposed Biz-Z features and cohesive user flow

These are design recommendations, not claims of implemented functionality. They extend the business-planning purpose while covering the course's processing requirements. The examples in the rubric are alternatives; the project is not required to implement every category (such as inventory or double-booking).

## User journey

Landing → choose a starting point → discover an idea OR enter an existing idea → selected business journey → build sections and validate numbers → review plan → export and work through launch tasks.

- Discover path: exactly five interests, five working-style traits, skills, time, capital, location → recommendations with reasons → choose an idea.
- Existing-idea path: name and description → plan immediately. Profiling can be completed later; it is not a prerequisite for manual writing.
- Returning path: open a saved plan → next unfinished section. Browser back, forward, and refresh should preserve the actual route and selected plan.
- Within a plan, use a persistent navigation group: Overview, Build plan, Money lab, Launch checklist, Review/export. Keep account/profile settings outside the planning sequence.
- Use a single clear primary action per page. Show what will happen next before forms are submitted.
- Save/discard protection applies to internal links and browser navigation. Never silently replace a missing plan with a different one.
- Zee is contextual help. Financial arithmetic and matching rules belong to application code; users may complete the planning workflow without Gemini.

## Recommended feature set

### 1. Money lab with an itemized startup budget

Let users create, edit and delete budget rows (equipment, registration estimates, materials, subscriptions, rent) and sales assumptions. Store inputs in MongoDB; compute summary values from records on the server. Display categories, totals, the largest cost, available capital, and funding gap.

- Line total = quantity × unit amount.
- Startup total = sum of one-time startup line totals.
- Monthly fixed costs = sum of monthly recurring fixed line totals.
- Funding gap = max(startup total − available capital, 0).
- Remaining startup cash = available capital − startup total, with a negative result identified as insufficient capital.
- Keep currency explicit and consistent within a plan. Reject negative amounts and invalid quantities. Use integer minor currency units for financial arithmetic, and define rounding at display boundaries.

This is more useful than the existing temporary four-number calculator because every total can be traced to saved records.

### 2. Pricing and break-even analysis

Start with a single primary product/service to keep the defense explanation clear.

- Contribution per sale = selling price − variable cost per sale.
- Break-even monthly sales = ceil(monthly fixed costs ÷ contribution per sale), when contribution is positive.
- Monthly revenue = price × projected units.
- Monthly operating profit = revenue − variable expenses − fixed expenses.
- Margin percentage = operating profit ÷ revenue × 100, when revenue is positive.

Edge cases: zero price/revenue produces no margin percentage; zero or negative contribution must not produce a misleading finite break-even point. Zero fixed costs with a positive contribution gives a zero-unit cost-coverage threshold. Operating profit excludes tax/financing unless those are modeled explicitly.

### 3. Cash runway and scenario comparison

Compare cautious, expected, and optimistic sales assumptions using the same saved costs. Users set or review every assumption; these are scenarios, not predicted success.

- Monthly net cash burn = monthly cash outflows − monthly cash inflows.
- Available opening cash = capital − startup spending.
- Runway = opening cash ÷ net burn only when opening cash is nonnegative and burn is positive.
- If startup spending exceeds capital, show the funding gap and do not claim a viable runway.
- If burn is zero or negative, show "no cash depletion under these assumptions", not an infinite number or a guarantee.

A side-by-side chart/table makes sensitivity visible. Require saved inputs; changes should update the corresponding financial-plan draft for user review, not silently overwrite it.

### 4. Explainable idea matching

Seed a BusinessIdea collection with interest tags, relevant skills, indicative capital ranges, and weekly time needs. Match profile records to idea records with transparent rules.

Proposed weights (product decisions, not scientific validation): interests 40%, skills 25%, budget 20%, time 15%. Show the factor breakdown and what is missing. Use simple working-style preferences only as optional explanations; do not claim a scientifically validated personality assessment or a probability of business success.

For missing information, request input or display incomplete scoring rather than treating it as a perfect match. Use a stable tie-breaker. Let users filter by budget and time and sort by fit/capital. Gemini can explain these calculated matches or suggest variants.

### 5. Launch checklist with due dates and rule-based readiness

Users add tasks such as customer interviews, supplier quotations, pricing trials, or registration research. Each task belongs to a plan and has a stable ID, due date, status, and priority.

- Overdue = due date is earlier than today's date in the chosen plan timezone AND task is not completed.
- Days remaining = calendar-day difference; due today is not overdue.
- Completion percentage = completed tasks ÷ total tasks, with an explicit empty-state result when there are no tasks.
- Suggested plan status: Draft → Ready for review → Reviewed. Require all necessary sections and financial inputs before transition; return a list of blockers on failure.
- Call the score "planning completeness" or "readiness to review", not "business success". Verified launch/legal requirements remain user-owned evidence.

## Database design for the Excellent tier

Five meaningful collections, with timestamps and explicit required/min/max/enum/default rules:

1. **User** — account and structured builder profile.
2. **Plan** — owner ref, optional chosen BusinessIdea ref, concept, section content, plan status and currency.
3. **BusinessIdea** — seeded recommendation catalog and matching attributes; referenced by chosen plans.
4. **BudgetItem** — plan ref, category, kind, recurrence, quantity and amount; kinds distinguish startup costs, recurring costs, and sales assumptions.
5. **LaunchTask** — plan ref, title, status, priority and due date.

Deleting a plan must handle its budget items and tasks predictably. Use owner-scoped queries for every nested resource; verify that a child resource belongs to the requested plan. Do not add empty collections just to reach five.

## Proposed endpoint coverage

The following 25 business endpoints are a target, not current API inventory. Existing health/auth routes are additional and should not carry the project requirement by themselves.

| Group | Method and path | Purpose |
| --- | --- | --- |
| Plans (5) | GET /plans; GET /plans/:id; POST /plans; PUT /plans/:id; DELETE /plans/:id | Full CRUD on the main resource |
| Budget items (5) | GET /plans/:id/budget-items; GET /plans/:id/budget-items/:itemId; POST /plans/:id/budget-items; PUT /plans/:id/budget-items/:itemId; DELETE /plans/:id/budget-items/:itemId | Persistent financial input CRUD |
| Launch tasks (5) | GET /plans/:id/tasks; GET /plans/:id/tasks/:taskId; POST /plans/:id/tasks; PUT /plans/:id/tasks/:taskId; DELETE /plans/:id/tasks/:taskId | Related task CRUD |
| Ideas (2) | GET /ideas; GET /ideas/:id | Seeded catalog with multi-criteria search/filter/sort |
| Profile (2) | GET /profiles/me; PUT /profiles/me | Profile read/update |
| Processing (1) | GET /plans/:id/financial-summary | Totals, breakdown, funding gap and runway |
| Processing (1) | GET /plans/:id/break-even | Contribution, break-even units and margins |
| Processing (1) | POST /plans/:id/scenario-comparisons | Evaluate explicit sales/cost assumptions without overwriting saved inputs |
| Processing (1) | GET /profiles/me/idea-matches | Deterministic weighted matching with reasons |
| Processing (1) | GET /plans/:id/task-summary | Completion, overdue tasks, upcoming deadlines |
| Processing (1) | PUT /plans/:id/status | Validate readiness and perform a rule-based transition |

Every processing endpoint needs normal and edge-case tests, a useful UI consumer, and sample request/response documentation. Derive totals from saved inputs; avoid storing redundant calculated fields that become stale.

## Pages to add for these enhancements

The current routed flow already supplies 11 distinct views. Add Money lab and Launch checklist for their actual user value, not merely to reach a page count. A focused comparison view can live inside Money lab rather than splitting every formula into an unrelated page.

## Suggested demonstration

Show the landing page → choose or enter an idea → trigger a visible validation error → create a plan → add related financial rows → demonstrate arithmetic and a zero-contribution edge case → add an overdue task → attempt an invalid status transition and resolve its blockers → refresh to prove MongoDB persistence → retrieve an invalid ID to show JSON 404 → preview/export. Each member explains an actual part they implemented and can answer questions about teammates' code.

No additional payments, uploads, admin role system, or deployment work is proposed before the mandatory rubric gaps are closed.
