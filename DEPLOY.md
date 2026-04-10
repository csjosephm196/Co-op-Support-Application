# Deploy: Vercel (frontend) + Render (API)

The UI runs on **Vercel**. The Express API and file uploads run on **Render**. PostgreSQL can be **Neon**, **Supabase**, **Render Postgres**, or any host that gives you a `DATABASE_URL`.

## 1. PostgreSQL

1. Create a database (e.g. **Neon**, **Supabase**, or **Render Postgres**) and copy the connection string as `DATABASE_URL`.

2. On your computer (with Node installed), put `DATABASE_URL` in `backend/.env`, or set it only for this shell:

   **PowerShell (Windows)**

   ```powershell
   cd backend
   $env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
   npm install
   npm run migrate
   ```

   **macOS / Linux**

   ```bash
   cd backend
   export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   npm install
   npm run migrate
   ```

   `npm run migrate` runs every `.sql` file in `migrations/` in order. Use a **new empty database** for the first deploy so `001` does not conflict with an old partial run.

   If migrate fails on **“type … already exists”**, Postgres is in a **partial** state (a previous run stopped after creating enums). For a **new deploy** with no data to keep, reset `public` and migrate again:

   **PowerShell**

   ```powershell
   cd backend
   $env:RESET_PUBLIC_SCHEMA = "yes"
   npm run db:reset-schema
   npm run migrate
   Remove-Item Env:RESET_PUBLIC_SCHEMA
   ```

   **macOS / Linux**

   ```bash
   cd backend
   RESET_PUBLIC_SCHEMA=yes npm run db:reset-schema
   npm run migrate
   ```

   Alternatively, in the Render **SQL** shell (or any SQL client), run `DROP SCHEMA public CASCADE;` then `CREATE SCHEMA public;` and grant as needed, then run `npm run migrate` from your machine.

   If `001` completed fully once and only **`002` is missing** (e.g. no `deadlines` table), use:

   ```bash
   cd backend
   npm run migrate:002
   ```

3. Optional demo accounts (for grading / demos):

   ```bash
   cd backend
   npm run db:seed
   ```

   Uses `DATABASE_URL` from `backend/.env`. Passwords are printed at the end (e.g. `Test1234!@#` for seeded users, `Admin123!@#` for the migration-created admin — see `README.md`).

## 2. Render — Web Service (backend)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect this repo, or **Web Service** manually.
2. If manual:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. **Environment** (minimum):

   | Name | Example |
   |------|---------|
   | `DATABASE_URL` | Your Postgres URL |
   | `JWT_SECRET` | Long random string (e.g. `openssl rand -base64 48`) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` (exact URL, no trailing slash) |
   | `NODE_ENV` | `production` |

   Optional: `JWT_EXPIRES_IN`, `SMTP_*`, `FRONTEND_URL` for invite links in email.

4. Deploy and wait until the service is **Live**. Copy the URL, e.g. `https://csa-backend-xxxx.onrender.com`.
5. Open `https://<your-service>.onrender.com/api/health` — you should see JSON `{"status":"ok",...}`.

**Note:** Free Render apps **spin down** after idle; first request can take ~30–60s. Uploaded PDFs live on the instance disk and can be **lost on redeploy**; fine for demos.

## 3. Vercel — Frontend

1. [Vercel](https://vercel.com) → **Add New Project** → import this repo.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (or Other with Build `npm run build`, Output `dist`).
4. **Environment Variables:**

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | `https://csa-backend-xxxx.onrender.com` (your Render URL **only** — no `/api`, no trailing slash) |

5. Deploy. Visit your Vercel URL and log in (e.g. seeded `student@test.com` / `Test1234!@#` if you ran the seed script).

6. If login fails with CORS or network errors, confirm **`FRONTEND_URL`** on Render matches the Vercel URL **exactly** (including `https://`).

## 4. Order of operations

1. Create Postgres → run **migrations** (and optional seed).
2. Deploy **Render** with `DATABASE_URL`, `JWT_SECRET`, and a temporary `FRONTEND_URL` (you can use `http://localhost:5173` first, then update to Vercel after step 3).
3. Deploy **Vercel** with `VITE_API_URL` = Render URL.
4. Update Render **`FRONTEND_URL`** to your final Vercel URL and **redeploy** (or clear cache) so CORS allows the teacher’s browser.

## 5. Teacher / reviewer

Share **only the Vercel URL**. No local install required. Mention that the API may be slow on the first click if the Render free tier was sleeping.
