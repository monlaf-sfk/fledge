# Fledge — landing page + auth

Live: <https://fledge-theta.vercel.app> · every push to `main` deploys automatically.

Next.js 15 (App Router) + Tailwind 4 + Supabase Auth. Users sign up as **founder** or **investor**;
the role is stored in `public.profiles` and cannot be changed by the client after sign-up.

## Run locally

1. Create a free project at <https://supabase.com>.
2. In Supabase → **SQL Editor**, run `supabase/migrations/0001_profiles.sql`.
3. Copy env and fill in values from Supabase → Project Settings → API:
   ```bash
   cp .env.example .env.local
   ```
4. In Supabase → Authentication → URL Configuration, set **Site URL** to `http://localhost:3000`
   and add `http://localhost:3000/auth/callback` (and the Vercel URL later) to **Redirect URLs**.
5. Start:
   ```bash
   npm install
   npm run dev
   ```

For quick demos you can turn off **Confirm email** (Authentication → Providers → Email);
then sign-up logs the user in immediately.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Landing page. CTAs go to `/signup?role=founder` or `/signup?role=investor` |
| `/signup` | Role picker + name, email, password. Server-side validation |
| `/login` | Email + password. Supports `?next=` (same-site paths only) |
| `/auth/callback` | Email confirmation link → session |
| `/dashboard` | Protected. Shows role-specific next steps (onboarding is the next sprint) |

## Where things live

- `src/app/auth/actions.ts` — `signUp`, `signIn`, `signOut` server actions
- `src/lib/supabase/` — server client and session-refresh middleware
- `src/middleware.ts` — protects `/dashboard`, sends logged-in users away from `/login`, `/signup`
- `supabase/migrations/0001_profiles.sql` — `user_role` enum, `profiles` table, RLS, sign-up trigger

> The trigger rejects any new user without `role` = `founder`/`investor` in metadata.
> So "Add user" in the Supabase dashboard or a future Google OAuth button fails with
> `Invalid role: null` until that flow also passes a role.

## Deploy

Push to GitHub → import in Vercel → add the three env vars → add the Vercel URL to Supabase
Redirect URLs.
