# Deploying to Render (backend) + Vercel (frontend)

This repo is preconfigured so both deploys are mostly point-and-click. Do the backend
first — the frontend needs its URL.

## ⚠️ Important: SQLite storage on Render's free tier is ephemeral

The app uses SQLite (see README.md § 1 for why). Render's **free** web service plan
does not include a persistent disk, so the database file — including logins,
passwords, and every family member you've added — is reset to empty **every time you
redeploy** (push a new commit, or manually redeploy). Within a single running instance
your data is safe; it only resets on a fresh deploy.

This is fine for trying the app out today, but it means you'll need to re-run the
bootstrap step (Part 1, step 7) after every deploy until you move off the free tier.
Before the family relies on this for real, do **one** of the following:
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
   command, start command, health check). `JWT_SECRET` and `BOOTSTRAP_SECRET` are
   auto-generated for you; leave `FRONTEND_URL` blank for now — you'll set it in Part 3.
4. Click **Apply** / **Create**. Render will build and deploy — this takes a minute or
   so (it runs `npm install`, `prisma generate`, `prisma migrate deploy`, then builds
   the TypeScript).
5. Once it's live, copy the URL Render gives you, e.g.
   `https://family-expense-backend.onrender.com`, and visit
   `https://<that-url>/api/health` — you should see `{"status":"ok"}`.
6. **Load the 6 family members + default categories.** Render's free tier has no
   Shell access, so this is done via a one-time API call instead of `npm run db:seed`.
   Copy the `BOOTSTRAP_SECRET` value from your service's **Environment** tab, then run
   (from any machine with `curl`, or ask Claude to run it for you):
   ```
   curl -X POST https://<your-backend-url>/api/admin/bootstrap \
     -H "x-bootstrap-secret: <your BOOTSTRAP_SECRET value>"
   ```
   The response contains a **one-time temporary password for each family member** —
   save these now, they are never shown again. Each person should sign in with their
   temporary password and will be prompted to set their own immediately. This endpoint
   safely refuses to run again once any user exists, so it's fine to leave configured.

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
     step 5, with `/api` appended — e.g.
     `https://family-expense-backend.onrender.com/api`).
5. Click **Deploy**. Vercel builds and gives you a URL like
   `https://home-expense-tracker.vercel.app`.
6. Open that URL — you should land on the login screen. Signing in won't work yet
   because the backend's CORS is still only allowing `http://localhost:5173` — that's
   Part 3.

## Part 3 — Connect them (update backend CORS + cookies)

1. Back in the Render dashboard, open your backend service → **Environment**.
2. Set `FRONTEND_URL` to your Vercel URL from Part 2, step 5 (e.g.
   `https://home-expense-tracker.vercel.app`), no trailing slash.
3. Make sure `NODE_ENV` is set to `production` (required — without it, session
   cookies aren't marked `Secure`/`SameSite=None` and cross-site login from Vercel to
   Render will silently fail). It's already in `render.yaml` for a fresh Blueprint
   deploy.
4. Save — Render will automatically redeploy with the new values (and, per the
   ephemeral-storage warning above, this wipes the database — re-run the bootstrap
   step from Part 1 afterward).
5. Once that finishes, reload your Vercel URL and sign in with one of the temporary
   passwords from the bootstrap step.

Note: the backend also automatically allows any `*.vercel.app` origin (see
`backend/src/app.ts`), so Vercel's preview deployments (from pull requests) work
without touching `FRONTEND_URL` again — only your production Vercel domain needs to
be set explicitly.

## Redeploying after future code changes

Both platforms auto-deploy on every push to `main` by default — just
`git push` and both will rebuild. Because of the ephemeral-storage caveat above,
**every backend redeploy wipes the database** — re-run the bootstrap `curl` command
from Part 1, step 6 afterward, and let the family know their old temporary passwords
no longer work (their real, chosen passwords are safe as long as no redeploy happened
since they set them — but on the free tier, plan for this being genuinely temporary
until you move to persistent storage).

## Troubleshooting

- **Frontend loads but shows "Failed to load dashboard"**: almost always a CORS/env
  mismatch. Double-check `VITE_API_URL` on Vercel (must end in `/api`, no trailing
  slash after that) and `FRONTEND_URL` on Render (must exactly match your Vercel
  domain, no trailing slash).
- **Login screen shows no family members**: the database hasn't been bootstrapped yet
  (or was wiped by a redeploy) — run the `curl` command from Part 1, step 6.
- **Render build fails with `TS7016: Could not find a declaration file for module`**:
  `NODE_ENV=production` makes `npm install` skip devDependencies (which includes the
  `@types/*` packages TypeScript needs to compile). The `render-build` script already
  uses `npm install --include=dev` to force them in — if you changed that script,
  restore the `--include=dev` flag.
- **Render build fails on `prisma migrate deploy`**: check the build logs — this
  usually means `DATABASE_URL` isn't set. It should be pre-filled from `render.yaml`;
  if you clicked through the Blueprint wizard it should already be there.
- **Login works locally but not on the deployed site**: check `NODE_ENV=production` is
  set on Render (see Part 3, step 3) — without it, the session cookie won't survive
  the cross-site request from your Vercel domain to your Render domain.
- **All my data disappeared after a redeploy**: expected on Render's free plan — see
  the warning at the top of this file. Re-run the bootstrap step.
