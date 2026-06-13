# Prime Form — Client Portal (V1)

Private client portal for Prime Form. Replaces the Google Sheet sent to clients.
The app **stores and displays** what Coach Anthony designs — it does not generate programs.

## Architecture (3 layers, kept separate)

```
UI  ──────────►  Business logic  ──────────►  Database
pages/, components/   context/, hooks/          lib/supabase.js, data/
```

- **Database layer** (`src/lib/supabase.js`, `src/data/*`) — the only code that touches Supabase. Every query is a pure function taking a `db` client. Swappable without touching UI.
- **Business logic** (`src/context/AuthContext.jsx`, `src/hooks/*`) — auth orchestration, picks the correct `db` per role, async loading.
- **UI layer** (`src/pages/*`, `src/components/*`) — never imports Supabase directly.

## Auth

- **Coach** → Supabase Auth (email + password). Full read/write via RLS `is_coach()`.
- **Client** → access code → `client-login` edge function mints a JWT scoped to `client_id`. Read-only. The frontend never queries `client_code` directly.

## Setup

```bash
npm install
cp .env.example .env      # then fill VITE_SUPABASE_ANON_KEY
npm run dev
```

Get the anon key: Supabase Dashboard → Project Settings → API Keys → `anon` / publishable key.

## Deploy (Vercel)

1. Push to the `primeform-app` repo.
2. Import the repo in Vercel (framework auto-detected as Vite).
3. Add Environment Variables in Vercel:
   - `VITE_SUPABASE_URL` = `https://fkooctrvufrrhtclxtmx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Deploy. `vercel.json` already handles SPA routing.

## Backend (already provisioned)

Tables: `clients`, `assessments`, `meal_plans`, `programs`, `program_exercises`,
`progress_logs`, `progress_photos`, `checkins`, `coaches`. RLS enabled on all.
Edge function `client-login` deployed. Storage bucket `progress-photos` (private).

> Do **not** revoke the Legacy HS256 key in Supabase — the client login JWT is signed with it.

## Routes

- `/` — client access-code login
- `/app` — client portal (Dashboard, Program, Nutrition, Progress, Sessions, Assessment)
- `/coach/login` — coach login
- `/coach` — client list → `/coach/client/:id` (Profile/Sessions, Assessment, Meal, Program, Progress)
