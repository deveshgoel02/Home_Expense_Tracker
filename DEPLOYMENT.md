# Deploying to Render (backend) + Vercel (frontend)

This repo is preconfigured so both deploys are mostly point-and-click. Do the backend
first — the frontend needs its URL.

## ⚠️ Important: SQLite storage on Render's free tier is ephemeral

The app uses SQLite (see README.md § 1 for why). Render's **free** web service plan
does not include a persistent disk, so the database file is reset to empty every time
you redeploy (push a new commit, or manually redeploy). Within a single running
instance your data is safe — it only resets on a fresh deploy.

This is fine for trying the app out today. Before the family relies on it for real
data, do **one** of the following:
- Upgrade the Render service to a paid plan and attach a **Persistent Disk** mounted
  at `backend/prisma` (Render dashboard → your service → Disks), or
- Switch to a free hosted Postgres (e.g. Neon, Supabase, or Render's own Postgres) —
  see README.md § 6 "Switching to PostgreSQL". Come back and ask for help wiring this
  up once you have a Postgres connection string; it's a small change.

## Part 1 — Backend on Render

1. Go to [render.com](https://render.com) and sign in (or sign up) — connect your
   GitHub account when prompted so Render can see your repos.
2. Click **New +** → **Blueprint**.
3. Pick the `deveshgoel02/Home_Expense_Tracker` repository. Render will detect the
   `render.yaml` file at the repo root and pre-fill everything (service name, build
   command, start command, health check).
4. When it asks for the `FRONTEND_URL` environment variable, you can leave it blank
   for now (or type `http://localhost:5173` temporarily) — you'll update it in Part 3.
5. Click **Apply** / **Create**. Render will build and deploy — this takes a few
   minutes the first time (it runs `npm install`, `prisma generate`,
   `prisma migrate deploy`, then builds the TypeScript).
6. Once it's live, copy the URL Render gives you, e.g.
   `https://family-expense-backend.onrender.com`.
7. **Load demo data (optional):** open the service's **Shell** tab in the Render
   dashboard and run `npm run db:seed` once, if you want the app to start with sample
   data instead of empty. Skip this if you want the family to start from zero — and
   never run it again once real data exists, since it wipes everything first.
8. Visit `https://<your-backend-url>/api/health` in a browser — you should see
   `{"status":"ok"}`. That confirms the backend is live.

## Part 2 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in — connect GitHub the same way.
2. Click **Add New...** → **Project**, and import the same
   `deveshgoel02/Home_Expense_Tracker` repository.
3. Vercel will ask for the project settings:
   - **Root Directory** → click Edit and select `frontend` (this is a monorepo — the
     frontend isn't at the repo root).
   - **Framework Preset** → Vercel should auto-detect "Vite". Leave build/output
     settings as detected (`npm run build`, output `dist`).
4. Before deploying, add an **Environment Variable**:
   - `VITE_API_URL` = `https://<your-render-backend-url>/api` (the URL from Part 1,
     step 6, with `/api` appended — e.g.
     `https://family-expense-backend.onrender.com/api`).
5. Click **Deploy**. Vercel builds and gives you a URL like
   `https://home-expense-tracker.vercel.app`.
6. Open that URL — the dashboard should load. It will show errors / fail to fetch
   data until you complete Part 3 below, because the backend's CORS is still only
   allowing `http://localhost:5173`.

## Part 3 — Connect them (update backend CORS)

1. Back in the Render dashboard, open your backend service → **Environment**.
2. Set `FRONTEND_URL` to your Vercel URL from Part 2, step 5 (e.g.
   `https://home-expense-tracker.vercel.app`), no trailing slash.
3. Save — Render will automatically redeploy with the new value.
4. Once that finishes, reload your Vercel URL. The dashboard should now load real
   data end-to-end.

Note: the backend also automatically allows any `*.vercel.app` origin (see
`backend/src/app.ts`), so Vercel's preview deployments (from pull requests) work
without touching `FRONTEND_URL` again — only your production Vercel domain needs to
be set explicitly.

## Redeploying after future code changes

Both platforms auto-deploy on every push to `main` by default — just
`git push` and both will rebuild. No extra steps needed unless you change environment
variables.

## Troubleshooting

- **Frontend loads but shows "Failed to load dashboard"**: almost always a CORS/env
  mismatch. Double-check `VITE_API_URL` on Vercel (must end in `/api`, no trailing
  slash after that) and `FRONTEND_URL` on Render (must exactly match your Vercel
  domain, no trailing slash).
- **Render build fails on `prisma migrate deploy`**: check the build logs — this
  usually means `DATABASE_URL` isn't set. It should be pre-filled from `render.yaml`;
  if you clicked through the Blueprint wizard it should already be there.
- **All my data disappeared after a redeploy**: expected on Render's free plan — see
  the warning at the top of this file.
