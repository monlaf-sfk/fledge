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
| `/dashboard` | Counters (Interested sent, Saved, Matches) and links |
| `/onboarding` | Role-specific profile form. Card fields are public; contacts, deck, metrics unlock after a match |
| `/discover` | Ranked feed with Pass / Save / Interested (keys ← ↓ →). Match pop-up on mutual interest |
| `/saved` | Saved profiles, can still press Pass or Interested |
| `/matches`, `/matches/[id]` | Matches list, unlocked details, chat (polls every 5 s) |
| `/insights` | Live funnel from the database (demo matches excluded) and own action counts |

## Where things live

- `src/app/auth/actions.ts` — `signUp`, `signIn`, `signOut` server actions
- `src/lib/supabase/` — server client and session-refresh middleware
- `src/middleware.ts` — protects `/dashboard`, sends logged-in users away from `/login`, `/signup`
- `supabase/migrations/0001_profiles.sql` — `user_role` enum, `profiles` table, RLS, sign-up trigger

> The trigger rejects any new user without `role` = `founder`/`investor` in metadata.
> So "Add user" in the Supabase dashboard or a future Google OAuth button fails with
> `Invalid role: null` until that flow also passes a role.

## Product logic

- **Fit score** (`src/lib/scoring.ts`): industry 35 · stage 30 · geography 20 · ticket 15.
- **Match**: DB trigger `handle_swipe` creates a match when both sides press Interested,
  whoever is second. Clients cannot insert matches.
- **Progressive disclosure**: `startups` / `investor_profiles` are readable by any signed-in user;
  `startup_private` / `investor_private` only by the owner or a matched party (RLS).
- **Demo profiles** (`0003_demo_profiles.sql`): 12 startups + 10 investors, `is_demo = true`,
  labelled DEMO on cards. Some auto-reciprocate Interested so the demo shows a match. Demo matches
  are excluded from the Insights funnel.
- **Events** (`events` table): `signup_completed`, `profile_completed`, `card_viewed`,
  `card_action`, `match_created` (from the trigger), `message_sent`. `funnel_summary()` returns
  aggregate counts only.

## Migrations

Apply new files in `supabase/migrations` **before** pushing code that uses them
(push to `main` deploys immediately):

```bash
supabase link --project-ref phkaexasrrbgqjxvizqn
supabase db push
```

## Deploy

Connected: every push to `main` on `monlaf-sfk/fledge` deploys to Vercel production.
