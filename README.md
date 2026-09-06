# Family Home Expense Tracker

A complete household expense and income management application built for a family of 6:
**Vivek, Rekha, Dhruv, Devesh, Aruna (Dadi), and Vinti**.

It answers the everyday household finance questions — who spent money, on what, how much
is left of this month's income, whether the family is saving or overspending, and how
dependent the household is on credit cards — with a modern, fintech-style dashboard.

## 1. Technology Stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts (charts)
- TanStack React Query (data fetching/caching)
- React Router
- Axios, react-hot-toast, date-fns

**Backend**
- Node.js + TypeScript + Express
- Prisma ORM
- PostgreSQL, hosted on [Neon](https://neon.tech) (see note below on database choice)
- Zod for request validation
- Vitest + Supertest for testing

**Database: PostgreSQL on Neon**

Money and family data need to survive redeploys, so the app uses a real managed
Postgres database rather than a local file. [Neon](https://neon.tech)'s free tier
persists indefinitely (unlike Render's own free Postgres, which is deleted after 30
days), scales to zero when idle, and is encrypted at rest. Prisma is configured with
two connection strings (`backend/prisma/schema.prisma`): `DATABASE_URL`, a pooled
connection (via Neon's built-in PgBouncer) used for normal app queries, and
`DIRECT_URL`, an unpooled connection used only by `prisma migrate` (schema-change
statements aren't compatible with connection pooling). All financial calculations
happen in a database-agnostic service layer (`backend/src/services/calculations.ts`),
so nothing about the business logic is Postgres-specific.

**Authentication: real per-member login, deliberately family-scale**

Every family member has their own password. Login issues a signed session (JWT) in an
httpOnly, Secure cookie — every API route except `/api/health` and `/api/auth/login`
requires a valid session, and passwords are bcrypt-hashed (never stored or returned in
plain text; every response was audited to make sure a password hash never reaches the
frontend). New members can be added from **Settings → Family Members**, which issues a
one-time generated temporary password shown once and never again. A first login (or a
newly added member) is required to set their own password before doing anything else.

This is intentionally *not* enterprise auth — there are no roles/permissions beyond
"signed in or not" (any family member can add expenses, add other members, etc.), no
email verification, and no password reset flow (an admin/other member can be asked to
add you again, or you can be helped to reset your password directly in the database).
For a private household app with a handful of trusted users, that trade-off is the
right one; see § 25 for the rest of the security posture (rate limiting, security
headers, input validation).

## 2. Folder Structure

```
Home Expenses Project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Data model (User, Category, Expense, Income, Budget, Settings)
│   │   ├── seed.ts             # Realistic demo data generator
│   │   └── migrations/
│   ├── src/
│   │   ├── routes/             # Express route handlers (thin, HTTP-only)
│   │   ├── services/           # calculations.ts (pure, unit-tested), dataAccess.ts, reportService.ts, period.ts
│   │   ├── middleware/         # asyncHandler + centralized error handler
│   │   ├── utils/               # money.ts (paise/rupee helpers), errors.ts
│   │   ├── validation.ts       # Zod schemas for every request body/query
│   │   ├── app.ts / index.ts
│   ├── tests/                  # calculations.test.ts, api.test.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Dashboard, Expenses, Income, Budgets, Family, MemberReport, Reports, Settings
│   │   ├── components/         # layout/, ui/, charts/, expenses/, income/, budgets/, dashboard/
│   │   ├── context/             # CurrentUserContext, AddExpenseModalContext
│   │   ├── hooks/               # React Query hooks per resource
│   │   ├── lib/                  # api.ts (typed API client), format.ts (INR formatting), chartColors.ts
│   │   └── types.ts
│   └── package.json
└── README.md
```

## 3. Installation

Requires Node.js 18+ (tested on Node 24) and npm.

```bash
# From the project root
cd backend
npm install
cp .env.example .env      # edit DATABASE_URL/DIRECT_URL to point at your own Postgres (e.g. a free Neon project)
npm run db:migrate        # applies the schema
npm run db:seed           # loads the 6 family members + ~4 months of realistic demo data

cd ../frontend
npm install
cp .env.example .env      # already done for you
```

## 4. Running the app (development)

Two terminals:

```bash
# Terminal 1 — backend API (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — frontend (Vite will pick 5173 or the next free port, e.g. 5174)
cd frontend
npm run dev
```

Open the URL Vite prints (check the terminal — it auto-increments the port if 5173 is
taken by another app on your machine). The frontend's dev server proxies `/api/*`
requests to the backend automatically, so no extra configuration is needed.

## 5. Environment Variables

**backend/.env**
| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Prisma pooled connection string (Neon/PgBouncer) | — (required) |
| `DIRECT_URL` | Prisma unpooled connection string, used only by migrations | — (required) |
| `PORT` | API port | `4000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `JWT_SECRET` | Signs login session tokens | — (required) |
| `BOOTSTRAP_SECRET` | One-time header to seed a brand-new empty database | — (required) |

**frontend/.env**
| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL the frontend calls | `/api` (proxied in dev) |

`DATABASE_URL`/`DIRECT_URL` need a Postgres instance — a free
[Neon](https://neon.tech) project takes under a minute to create and gives you both
connection strings from its "Connect" dialog (toggle "Connection pooling" off to get
the direct one).

## 6. Database Setup & Migrations

```bash
cd backend
npm run db:migrate       # apply schema changes (creates a new migration if the schema changed)
npm run db:seed          # (re)populate demo data — safe to re-run, it wipes and reseeds
npm run db:reset         # drop everything, reapply all migrations, and reseed
```

## 7. Testing

```bash
cd backend
npm test          # 36 tests: calculation engine (21) + API integration (15)
```

The test suite specifically covers the financial calculation engine
(`src/services/calculations.ts`) with the exact worked examples from the product spec
(₹2,00,000 income / ₹1,60,000 expenses / ₹30,000 credit card → 80% expense ratio, 18.8%
credit card dependence) plus edge cases: zero income, zero expenses, overspending,
no transactions at all, and budget threshold boundaries.

The frontend does not currently have an automated test suite (no test runner was
configured) — it was verified through manual browser testing of every page (see
Section 10, "Final Verification").

## 8. Linting & Building for Production

```bash
cd backend
npm run lint
npm run build      # compiles TypeScript to backend/dist
npm start          # runs the compiled server

cd frontend
npm run lint
npm run build       # type-checks and builds to frontend/dist
npm run preview     # serve the production build locally
```

## 9. Deployment Notes

For step-by-step Render (backend) + Vercel (frontend) deployment instructions —
including a `render.yaml` blueprint and `vercel.json` already in this repo — see
[DEPLOYMENT.md](./DEPLOYMENT.md).

- The backend is a standard Node/Express app — deploy `backend/dist` behind any Node
  host (a VPS, Railway, Render, etc.) after running `npm run build`. Set `DATABASE_URL`
  / `DIRECT_URL` to a managed PostgreSQL instance (see above) and set `FRONTEND_URL` to
  your deployed frontend's origin for CORS.
- The frontend is a static Vite build (`frontend/dist`) — deploy it to any static host
  (Netlify, Vercel, S3+CloudFront, etc.) and set `VITE_API_URL` to your backend's public
  URL at build time.
- If both are deployed behind the same reverse proxy, you can keep `VITE_API_URL=/api`
  and proxy `/api` to the backend at the infrastructure level, exactly like the dev setup.

## 10. Final Verification (what was actually checked)

- ✅ `npm install` succeeded on both backend and frontend with no errors.
- ✅ `npm run db:migrate` + `npm run db:seed` created the schema and loaded 6 users,
  21 categories, ~4 months of income, and 100+ expenses.
- ✅ `npm test` — 36/36 backend tests passing (calculation engine + API integration).
- ✅ `npm run lint` — zero errors/warnings on backend and frontend.
- ✅ `npm run build` — clean production builds (TypeScript + Vite) with no errors.
- ✅ Manually verified every page in a real browser against the running dev servers:
  Dashboard, Expenses (search/filter/sort/pagination/CSV export), Add/Edit Expense
  modal, Income, Budgets, Family, individual Member Report, Monthly Report
  (with print/PDF), and Settings (family members, categories, alert thresholds).
- ✅ Verified the worked calculation example live: adding a ₹499 expense immediately
  updated Total Expenses, Remaining Balance, and Savings across the dashboard.
- ✅ Verified alerts, budget progress bars, and month-over-month comparisons render
  correctly against the seeded data.
- ⚠️ Mobile/responsive layout was implemented with standard Tailwind breakpoints
  (sidebar hidden below `lg`, bottom nav + slide-over menu shown instead) and was
  code-reviewed, but could not be visually confirmed at a narrow viewport in this
  environment's browser automation tool (the window-resize tool did not reflect in
  screenshots here). Please double-check the mobile layout on an actual phone/narrow
  browser window after setup.

## 11. Known Limitations

- No automated frontend test suite (manual browser verification only).
- No PDF export beyond the browser's native "Print / Save as PDF" (used on the Monthly
  Report page) — a dedicated PDF library was intentionally skipped to avoid unnecessary
  complexity, per the project brief ("do not allow a complicated export implementation
  to block the core application"). CSV export is fully implemented for expenses.
- No CSV *import* (only export) — not required by the spec's core phases.
- Once signed in, every family member has equal access — there are no roles or
  permissions beyond "logged in or not" (see § 1 "Authentication" for why this is
  the right trade-off at this scale). Anyone signed in can see and edit all financial
  data, add other members, and change budgets/thresholds.
- No password-reset email flow — if someone forgets their password, another signed-in
  member can't reset it for them from the UI today; ask for help resetting it directly
  in the database, or add them again under a slightly different name as a workaround.

## 12. Next Steps For You

```bash
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev
# in a second terminal:
cd frontend && npm install && npm run dev
```

Then open the URL printed by the frontend dev server (usually `http://localhost:5173`,
or the next free port if that one's taken).
