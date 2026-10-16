-- Analytics v2: anonymous top-of-funnel events, test-account exclusion, one overview function.

-- Test accounts stay usable but never count in analytics.
alter table public.profiles add column is_test boolean not null default false;
update public.profiles set is_test = true where email like 'rassulkerimzhanov+%@gmail.com';

-- Anonymous visitors: events can carry an anonymous browser id instead of a user.
alter table public.events add column anon_id text check (anon_id is null or anon_id ~ '^[a-zA-Z0-9-]{8,64}$');
create index events_anon on public.events (anon_id) where anon_id is not null;

-- Public pages log through this function only; it accepts a fixed list of names.
create function public.track_public(p_name text, p_anon_id text, p_props jsonb default '{}')
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_name not in ('landing_viewed', 'signup_viewed', 'login_viewed', 'cta_clicked') then
    raise exception 'event not allowed: %', p_name;
  end if;
  if p_anon_id is null or p_anon_id !~ '^[a-zA-Z0-9-]{8,64}$' then
    raise exception 'bad anon id';
  end if;
  if pg_column_size(p_props) > 2000 then
    raise exception 'props too large';
  end if;
  insert into public.events (user_id, anon_id, name, props)
  values (auth.uid(), p_anon_id, p_name, coalesce(p_props, '{}'));
end;
$$;
grant execute on function public.track_public(text, text, jsonb) to anon, authenticated;

-- Everything the Insights page shows, as one JSON document. Aggregates only, no PII.
-- Excludes test accounts everywhere and demo profiles from match metrics.
create function public.analytics_overview()
returns jsonb
language sql stable security definer set search_path = ''
as $$
with
real_users as (select id, role, created_at from public.profiles where not is_test),
ev as (
  select e.* from public.events e
  where e.user_id is null or e.user_id in (select id from real_users)
),
own_cards as (
  select s.id card_id, s.owner_id, 'founder'::text role from public.startups s where s.owner_id in (select id from real_users)
  union all
  select i.id, i.owner_id, 'investor' from public.investor_profiles i where i.owner_id in (select id from real_users)
),
real_matches as (
  select m.id, m.created_at, s.owner_id founder_id, i.owner_id investor_id
  from public.matches m
  join public.startups s on s.id = m.startup_id
  join public.investor_profiles i on i.id = m.investor_id
  where not m.is_demo
    and s.owner_id in (select id from real_users)
    and i.owner_id in (select id from real_users)
),
connections as (
  select rm.* from real_matches rm
  where exists (select 1 from public.messages x where x.match_id = rm.id and x.sender_id = rm.founder_id)
    and exists (select 1 from public.messages x where x.match_id = rm.id and x.sender_id = rm.investor_id)
),
matched_users as (
  select founder_id u, min(created_at) at from real_matches group by 1
  union all
  select investor_id, min(created_at) from real_matches group by 1
),
connected_users as (
  select founder_id u from connections union select investor_id from connections
),
swipes_real as (
  select w.*, p.role from public.swipes w join real_users p on p.id = w.actor_id
),
per_user as (
  select
    p.id, p.role::text role,
    exists (select 1 from own_cards c where c.owner_id = p.id) profile_done,
    exists (select 1 from ev where ev.user_id = p.id and ev.name = 'card_viewed') viewed,
    exists (select 1 from swipes_real w where w.actor_id = p.id and w.action = 'interested') interested,
    exists (select 1 from matched_users m where m.u = p.id) matched,
    exists (select 1 from connected_users c where c.u = p.id) connected
  from real_users p
),
actions as (
  select (props->>'score')::int score, props->>'action' action
  from ev where name = 'card_action' and props ? 'score'
),
days as (
  select generate_series(current_date - 13, current_date, interval '1 day')::date d
)
select jsonb_build_object(
  'generated_at', now(),
  'top_funnel', jsonb_build_object(
    'visitors',      (select count(distinct anon_id) from ev where name = 'landing_viewed'),
    'signup_viewed', (select count(distinct anon_id) from ev where name = 'signup_viewed'),
    'signups_tracked', (select count(*) from ev where name = 'signup_completed')
  ),
  'funnel', (
    select jsonb_agg(jsonb_build_object('role', r, 'signed_up', a, 'profile', b, 'viewed', c,
                                        'interested', d, 'matched', e, 'connected', f))
    from (
      select coalesce(role, 'all') r,
             count(*) a,
             count(*) filter (where profile_done) b,
             count(*) filter (where viewed) c,
             count(*) filter (where interested) d,
             count(*) filter (where matched) e,
             count(*) filter (where connected) f
      from per_user group by grouping sets ((), (role))
    ) t
  ),
  'kpi', jsonb_build_object(
    'card_actions',      (select count(*) from actions),
    'interested_actions',(select count(*) from actions where action = 'interested'),
    'real_interested_pairs', (
      select count(*) from swipes_real w
      left join public.startups s on s.id = w.startup_id
      left join public.investor_profiles i on i.id = w.investor_id
      where w.action = 'interested' and not coalesce(s.is_demo, i.is_demo, false)),
    'real_matches',  (select count(*) from real_matches),
    'connections',   (select count(*) from connections),
    'median_hours_to_match', (
      select round(extract(epoch from percentile_cont(0.5) within group (order by m.at - p.created_at)) / 3600.0, 1)
      from matched_users m join real_users p on p.id = m.u),
    'active_7d', (select count(distinct user_id) from ev where user_id is not null and created_at > now() - interval '7 days'),
    'returning_users', (
      select count(*) from (
        select user_id from ev where user_id is not null
        group by user_id having count(distinct created_at::date) >= 2) x)
  ),
  'fit_buckets', (
    select jsonb_agg(jsonb_build_object('bucket', b, 'actions', n, 'interested', i) order by b)
    from (
      select least(score / 25, 3) * 25 b, count(*) n, count(*) filter (where action = 'interested') i
      from actions group by 1
    ) t
  ),
  'action_mix', (
    select jsonb_agg(jsonb_build_object('role', role, 'pass', p, 'save', s, 'interested', i))
    from (
      select role::text, count(*) filter (where action = 'pass') p,
             count(*) filter (where action = 'save') s,
             count(*) filter (where action = 'interested') i
      from swipes_real group by role
    ) t
  ),
  'daily', (
    select jsonb_agg(jsonb_build_object(
      'day', d,
      'active', (select count(distinct coalesce(user_id::text, anon_id)) from ev where created_at::date = d),
      'signups', (select count(*) from real_users where created_at::date = d),
      'matches', (select count(*) from real_matches where created_at::date = d)
    ) order by d)
    from days
  )
);
$$;
revoke execute on function public.analytics_overview() from public, anon;
grant execute on function public.analytics_overview() to authenticated;

-- New sign-ups with the team's plus-addressed test emails are flagged automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  if requested_role is null or requested_role not in ('founder', 'investor') then
    raise exception 'Invalid role: %', coalesce(requested_role, 'null');
  end if;

  insert into public.profiles (id, email, full_name, role, is_test)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    requested_role::public.user_role,
    new.email like 'rassulkerimzhanov+%@gmail.com'
  );
  return new;
end;
$$;
