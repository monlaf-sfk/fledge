-- Fledge marketplace: profiles for each side, swipes, mutual matches, chat, analytics events.
--
-- Progressive disclosure: card data (visible to every signed-in user) lives in
-- `startups` / `investor_profiles`; identity, contacts, deck and detailed metrics live in
-- `startup_private` / `investor_private`, readable only by the owner or a matched party.

create type public.startup_stage as enum ('idea', 'pre_seed', 'seed', 'series_a');
create type public.investor_type as enum ('angel', 'vc', 'accelerator', 'corporate');
create type public.swipe_action as enum ('pass', 'save', 'interested');

-- ---------------------------------------------------------------- startups (public card)
create table public.startups (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid unique references public.profiles (id) on delete cascade,  -- null = demo
  name               text not null check (char_length(name) between 2 and 80),
  pitch              text not null check (char_length(pitch) between 10 and 140),
  problem            text not null default '' check (char_length(problem) <= 600),
  industry           text not null,
  stage              public.startup_stage not null,
  geography          text not null,
  traction_range     text not null,
  funding_target_usd integer not null check (funding_target_usd > 0),
  team_size          integer not null check (team_size between 1 and 500),
  looking_for        public.investor_type[] not null default '{}',
  is_demo            boolean not null default false,
  demo_auto_interest boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -------------------------------------------------------- investor_profiles (public card)
create table public.investor_profiles (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid unique references public.profiles (id) on delete cascade,  -- null = demo
  display_name       text not null check (char_length(display_name) between 2 and 80),
  investor_type      public.investor_type not null,
  thesis             text not null check (char_length(thesis) between 10 and 600),
  industries         text[] not null check (cardinality(industries) > 0),
  stages             public.startup_stage[] not null check (cardinality(stages) > 0),
  geographies        text[] not null check (cardinality(geographies) > 0),
  ticket_min_usd     integer not null check (ticket_min_usd > 0),
  ticket_max_usd     integer not null,
  portfolio          text not null default '' check (char_length(portfolio) <= 400),
  is_demo            boolean not null default false,
  demo_auto_interest boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (ticket_max_usd >= ticket_min_usd)
);

-- ------------------------------------------------------------ private (unlocked on match)
create table public.startup_private (
  startup_id       uuid primary key references public.startups (id) on delete cascade,
  founder_name     text not null,
  founder_bio      text not null default '',
  linkedin_url     text not null default '',
  contact_email    text not null default '',
  deck_url         text not null default '',
  detailed_metrics text not null default ''
);

create table public.investor_private (
  investor_id   uuid primary key references public.investor_profiles (id) on delete cascade,
  contact_email text not null default '',
  linkedin_url  text not null default '',
  website_url   text not null default ''
);

-- ------------------------------------------------------------------- swipes and matches
create table public.swipes (
  actor_id    uuid not null references public.profiles (id) on delete cascade,
  startup_id  uuid references public.startups (id) on delete cascade,
  investor_id uuid references public.investor_profiles (id) on delete cascade,
  action      public.swipe_action not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- exactly one target
  check ((startup_id is null) <> (investor_id is null))
);
create unique index swipes_actor_startup on public.swipes (actor_id, startup_id) where startup_id is not null;
create unique index swipes_actor_investor on public.swipes (actor_id, investor_id) where investor_id is not null;

create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  startup_id  uuid not null references public.startups (id) on delete cascade,
  investor_id uuid not null references public.investor_profiles (id) on delete cascade,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (startup_id, investor_id)
);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_match_created on public.messages (match_id, created_at);

-- --------------------------------------------------------------------- analytics events
create table public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles (id) on delete set null,
  name       text not null check (name ~ '^[a-z_]{3,40}$'),
  props      jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index events_name_created on public.events (name, created_at);

-- ------------------------------------------------------------------------------ helpers
-- Is the current user a party of this match? security definer avoids RLS recursion.
create function public.is_match_party(p_startup_id uuid, p_investor_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.startups s where s.id = p_startup_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.investor_profiles i where i.id = p_investor_id and i.owner_id = auth.uid()
  );
$$;

create function public.is_matched_with_startup(p_startup_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    join public.investor_profiles i on i.id = m.investor_id
    where m.startup_id = p_startup_id and i.owner_id = auth.uid()
  );
$$;

create function public.is_matched_with_investor(p_investor_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    join public.startups s on s.id = m.startup_id
    where m.investor_id = p_investor_id and s.owner_id = auth.uid()
  );
$$;

-- -------------------------------------------------------------------------------- RLS
alter table public.startups          enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.startup_private   enable row level security;
alter table public.investor_private  enable row level security;
alter table public.swipes            enable row level security;
alter table public.matches           enable row level security;
alter table public.messages          enable row level security;
alter table public.events            enable row level security;

-- Cards: every signed-in user can read; only the owner writes, and only for their role.
create policy startups_read on public.startups for select to authenticated using (true);
create policy startups_insert on public.startups for insert to authenticated
  with check (owner_id = auth.uid() and is_demo = false and demo_auto_interest = false
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'founder'));
create policy startups_update on public.startups for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and is_demo = false and demo_auto_interest = false);

create policy investors_read on public.investor_profiles for select to authenticated using (true);
create policy investors_insert on public.investor_profiles for insert to authenticated
  with check (owner_id = auth.uid() and is_demo = false and demo_auto_interest = false
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'investor'));
create policy investors_update on public.investor_profiles for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and is_demo = false and demo_auto_interest = false);

-- Private details: owner always; the other side only after a match.
create policy startup_private_read on public.startup_private for select to authenticated
  using (
    exists (select 1 from public.startups s where s.id = startup_id and s.owner_id = auth.uid())
    or public.is_matched_with_startup(startup_id)
  );
create policy startup_private_write on public.startup_private for all to authenticated
  using (exists (select 1 from public.startups s where s.id = startup_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.startups s where s.id = startup_id and s.owner_id = auth.uid()));

create policy investor_private_read on public.investor_private for select to authenticated
  using (
    exists (select 1 from public.investor_profiles i where i.id = investor_id and i.owner_id = auth.uid())
    or public.is_matched_with_investor(investor_id)
  );
create policy investor_private_write on public.investor_private for all to authenticated
  using (exists (select 1 from public.investor_profiles i where i.id = investor_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.investor_profiles i where i.id = investor_id and i.owner_id = auth.uid()));

-- Swipes: private to the actor. Founders swipe investors, investors swipe startups.
create policy swipes_read on public.swipes for select to authenticated using (actor_id = auth.uid());
create policy swipes_insert on public.swipes for insert to authenticated
  with check (
    actor_id = auth.uid() and (
      (investor_id is not null and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'founder'))
      or (startup_id is not null and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'investor'))
    )
  );
create policy swipes_update on public.swipes for update to authenticated
  using (actor_id = auth.uid()) with check (actor_id = auth.uid());

-- Matches are created only by the trigger below; parties can read them.
create policy matches_read on public.matches for select to authenticated
  using (public.is_match_party(startup_id, investor_id));

create policy messages_read on public.messages for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id
                 and public.is_match_party(m.startup_id, m.investor_id)));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.matches m where m.id = match_id
    and public.is_match_party(m.startup_id, m.investor_id)));

-- Events: users write only their own; nobody reads raw rows through the API.
create policy events_insert on public.events for insert to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------- match trigger
-- Runs after every Interested swipe. Order-independent: whoever is second creates the match.
-- Demo profiles with demo_auto_interest reciprocate immediately (flagged is_demo).
create function public.handle_swipe()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_startup_id  uuid;
  v_investor_id uuid;
  v_other_owner uuid;
  v_demo        boolean := false;
  v_reciprocal  boolean := false;
  v_match_id    uuid;
begin
  if new.action <> 'interested' then
    return new;
  end if;

  if new.investor_id is not null then
    -- founder liked an investor
    select s.id into v_startup_id from public.startups s where s.owner_id = new.actor_id;
    v_investor_id := new.investor_id;
    select i.owner_id, i.demo_auto_interest into v_other_owner, v_demo
      from public.investor_profiles i where i.id = v_investor_id;
    v_reciprocal := v_demo or exists (
      select 1 from public.swipes w
      where w.actor_id = v_other_owner and w.startup_id = v_startup_id and w.action = 'interested');
  else
    -- investor liked a startup
    select i.id into v_investor_id from public.investor_profiles i where i.owner_id = new.actor_id;
    v_startup_id := new.startup_id;
    select s.owner_id, s.demo_auto_interest into v_other_owner, v_demo
      from public.startups s where s.id = v_startup_id;
    v_reciprocal := v_demo or exists (
      select 1 from public.swipes w
      where w.actor_id = v_other_owner and w.investor_id = v_investor_id and w.action = 'interested');
  end if;

  if v_startup_id is null or v_investor_id is null or not v_reciprocal then
    return new;
  end if;

  insert into public.matches (startup_id, investor_id, is_demo)
  values (v_startup_id, v_investor_id, v_demo)
  on conflict (startup_id, investor_id) do nothing
  returning id into v_match_id;

  if v_match_id is not null then
    insert into public.events (user_id, name, props)
    values (new.actor_id, 'match_created',
            jsonb_build_object('match_id', v_match_id, 'is_demo', v_demo));
  end if;

  return new;
end;
$$;

create trigger on_swipe_interested
  after insert or update of action on public.swipes
  for each row execute function public.handle_swipe();

-- ------------------------------------------------------------------- funnel aggregate
-- Aggregate counts only (no rows, no PII) for the Insights page. Demo matches excluded.
create function public.funnel_summary()
returns table (step text, users bigint)
language sql stable security definer set search_path = ''
as $$
  select 'signed_up', count(*) from public.profiles
  union all
  select 'profile_completed', (select count(*) from public.startups where owner_id is not null)
                            + (select count(*) from public.investor_profiles where owner_id is not null)
  union all
  select 'viewed_feed', count(distinct user_id) from public.events where name = 'card_viewed'
  union all
  select 'showed_interest', count(distinct actor_id) from public.swipes where action = 'interested'
  union all
  select 'got_real_match', count(distinct u) from (
    select s.owner_id u from public.matches m join public.startups s on s.id = m.startup_id where not m.is_demo
    union
    select i.owner_id from public.matches m join public.investor_profiles i on i.id = m.investor_id where not m.is_demo
  ) x where u is not null
  union all
  select 'sent_message', count(distinct sender_id) from public.messages;
$$;

revoke execute on function public.funnel_summary() from public, anon;
grant execute on function public.funnel_summary() to authenticated;
