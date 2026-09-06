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
- SQLite (see note below on database choice)
- Zod for request validation
- Vitest + Supertest for testing

**Database: SQLite instead of PostgreSQL**

The project brief suggested PostgreSQL, but this machine has neither PostgreSQL nor
Docker installed, and requiring the family to install and configure a database server
would work against the "keep it simple" goal of a small household app. SQLite is a
single embedded file, requires zero setup, and Prisma's schema/migration/query API is
nearly identical across both databases. All financial calculations happen in a
database-agnostic service layer (`backend/src/services/calculations.ts`), so switching
to PostgreSQL later is a small, low-risk change (see "Switching to PostgreSQL" below) —
nothing about the business logic depends on SQLite.

**Authentication: simple "who are you" session, not full auth**

With exactly 6 known family members and no need to protect data from each other, the
app uses a lightweight client-side "Using as" selector (stored in the browser's
`localStorage`) instead of passwords/JWTs/sessions. It pre-fills "who spent this" when
adding an expense. This avoids enterprise auth complexity that a real family would
never need, per the project brief's guidance. All financial data is otherwise treated
as shared household information, matching how the app is meant to be used (one device
at a time, on the family's own network).

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
cp .env.example .env      # already done for you; edit if needed
npm run db:migrate        # creates dev.db and applies the schema
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
| `DATABASE_URL` | Prisma connection string | `file:./dev.db` (SQLite) |
| `PORT` | API port | `4000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

**frontend/.env**
| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL the frontend calls | `/api` (proxied in dev) |

No secrets are required to run this application locally — there are no third-party API
keys or credentials involved.

## 6. Database Setup & Migrations

```bash
cd backend
npm run db:migrate       # apply schema changes (creates a new migration if the schema changed)
npm run db:seed          # (re)populate demo data — safe to re-run, it wipes and reseeds
npm run db:reset         # drop everything, reapply all migrations, and reseed
```

### Switching to PostgreSQL

1. In `backend/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` in `backend/.env` to a Postgres connection string.
3. Run `npm run db:migrate` again to generate Postgres-specific migrations.

The application code needs no other changes — all money/date logic is database-agnostic.

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

- The backend is a standard Node/Express app — deploy `backend/dist` behind any Node
  host (a VPS, Railway, Render, etc.) after running `npm run build`. Set `DATABASE_URL`
  to a persistent file path (SQLite) or a managed PostgreSQL instance (see above) and
  set `FRONTEND_URL` to your deployed frontend's origin for CORS.
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
- The "who are you" session is a convenience default for the Add Expense form, not an
  access-control mechanism — anyone with access to the app can see and edit all data,
  which matches how a single shared family device/app is actually used.

## 12. Next Steps For You

```bash
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev
# in a second terminal:
cd frontend && npm install && npm run dev
```

Then open the URL printed by the frontend dev server (usually `http://localhost:5173`,
or the next free port if that one's taken).
