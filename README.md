# Biz-Z

A React + Tailwind business planning app with Express, MongoDB, and optional Gemini assistance.

## Run locally

1. Install Node.js 22.12+ (Node 24 recommended).
2. Run `npm install`.
3. Run `npm run dev` and open http://127.0.0.1:5173.

The frontend and API run together. Without credentials, the app offers a clearly labeled local demo. Demo plans and profiles persist in this browser's local storage. Demo idea cards are templates, not Gemini output.

## Enable accounts, MongoDB, and Gemini

Copy `.env.example` to `.env` in the project root. Configure:

- `MONGODB_URI`: your local MongoDB or Atlas connection string.
- `JWT_SECRET`: a randomly generated secret of at least 32 characters.
- `GEMINI_API_KEY`: your Google AI Studio key. Keep it server-side; never use a VITE_ variable for this key.
- `GEMINI_MODEL`: a model available to your key (default: gemini-2.5-flash).

Restart the development server after changes. Register an account in the app. Account plans are isolated from local demo plans and from other users' plans. A MongoDB connection and JWT secret are required for accounts; Gemini is optional for manual planning.

`GET /api/health` reports configuration availability without exposing secrets. Gemini availability means a key is configured, not that its validity or quota has been verified.

## Implemented flow

- Responsive journey dashboard with the original Zee bee mascot.
- Five-step onboarding: exactly five interests and five traits, skills/time, budget/location, review.
- Three personalized Gemini ideas for signed-in users, or labeled template suggestions in demo mode.
- Bring your own business idea.
- Eight planning sections with answers, editable drafts, explicit saves, and review status.
- Executive summary unlocks after the first six sections are reviewed. Updating these sections marks an existing summary as needing review.
- Context-aware Gemini chat; suggestions are only applied to drafts on user action.
- Monthly financial calculator with deterministic arithmetic and explicit assumptions.
- Plan preview and downloadable PDF. Built-in PDF font currently targets Latin text; non-Latin scripts require an embedded Unicode font.
- Account registration/sign-in/sign-out, plan listing, creation, retrieval, section updates, deletion with confirmation.

## API

| Method | Endpoint                       | Purpose                                  |
| ------ | ------------------------------ | ---------------------------------------- |
| POST   | /api/auth/register             | Register and set HttpOnly session cookie |
| POST   | /api/auth/login                | Sign in                                  |
| POST   | /api/auth/logout               | Clear session cookie                     |
| GET    | /api/me                        | Current user                             |
| PUT    | /api/profile                   | Validate and save profile                |
| GET    | /api/plans                     | List own plans                           |
| POST   | /api/plans                     | Create a plan                            |
| GET    | /api/plans/:id                 | Read own plan                            |
| PUT    | /api/plans/:id/sections/:index | Save section (index 0–7)                 |
| DELETE | /api/plans/:id                 | Delete own plan                          |
| POST   | /api/ideas                     | Generate three Gemini ideas              |
| POST   | /api/plans/:id/chat            | Send context to Gemini                   |

The API validates input with Zod, hashes passwords with bcrypt, checks plan ownership, limits auth/AI requests, and rejects cross-origin writes. Never commit `.env`.

## Checks

- `npm run build`: type-check and production build.
- `npm run lint`: frontend lint.
- `npm test`: integration test against an isolated ephemeral MongoDB instance, including auth, profile validation, CRUD, ownership, summary rules, and missing-key fallback. First run downloads the MongoDB test binary into `.test-output/mongodb`; it does not use your application database.

## Production

Run `npm run build`, set `NODE_ENV=production`, then `npm start`. Express serves the built frontend and API on port 3001 by default. Use an HTTPS reverse proxy on the same host; production cookies are Secure. The API listens on loopback. For container deployment, deliberately configure the listening host and your network ingress. Set credentials in the deployment environment.

## Structure

- `src/App.tsx`: workspace navigation, session, plan state and data persistence.
- `src/components.tsx`: shared buttons, dialogs, heading, original SVG bee mascot.
- `src/Dashboard.tsx`: journey dashboard and progress.
- `src/Onboarding.tsx`: profile collection and idea exploration.
- `src/Editor.tsx`: section editor, Gemini chat, finance calculator, PDF export, authentication forms.
- `src/data.ts`: shared types, section metadata, demo templates, API client.
- `src/index.css`, `src/App.css`: Tailwind integration and consistent responsive design system.
- `server/index.js`: Express routes and Gemini integration.
- `server/models.js`: MongoDB/Mongoose models.
- `server/api.test.js`: isolated API integration coverage.
