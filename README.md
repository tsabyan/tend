# Tend

Goals, habits and tasks — one calm place. A productivity suite with three modules behind a bottom nav:

- **Focus** — goals broken into ordered steps, an immersive one-step-at-a-time focus mode with a pomodoro timer (15/25/50m + 5m breaks), and per-goal focus time tracking. AI can draft steps from a goal title.
- **Habits** — identity-based habit tracking ("I want to become …"), per-weekday schedules, streaks, 30-day completion rate, monthly calendar. AI can draft habits from an identity.
- **Tasks** — fast capture, a sun toggle for "today", Today / Later / Done sections.

Built with Next.js (App Router, TypeScript), Supabase (auth + Postgres with RLS), and the Gemini API for AI suggestions. Ported from the prototype in [reference/productivity-suite.jsx](reference/productivity-suite.jsx) — see [docs/PLAN.md](docs/PLAN.md) for the implementation plan.

## Setup

1. **Supabase project** — create one at [supabase.com](https://supabase.com), or run locally with `supabase start` (requires Docker).
2. **Environment** — copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (server-side only, used by the AI suggestion routes)
3. **Database** — apply the migration in `supabase/migrations/`:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   Or paste the SQL into the dashboard's SQL Editor.

   All tables live in the dedicated `tend` schema (not `public`). On a hosted project, also add `tend` to **Project Settings → API → Exposed schemas** — without this every query returns 404/406. (Local `supabase start` picks it up from `config.toml` automatically.)
4. **Run**:
   ```bash
   npm install
   npm run dev
   ```

Sign up with email + password on `/login`. If email confirmation is enabled in your Supabase auth settings, confirm before signing in.

## Structure

```
src/app/              routes: / (shell), /login, /auth/signout, /api/ai/*
src/components/       Shell + FocusApp / HabitApp / TodoApp modules
src/lib/              supabase clients, types, dates/streak utils, chime, AI helpers
src/proxy.ts          session refresh + auth guard
supabase/migrations/  schema: goals, steps, identities, habits, habit_logs, todos (all RLS)
```
