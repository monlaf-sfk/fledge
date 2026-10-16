-- PostgREST upsert (on_conflict) cannot target partial indexes. Plain unique constraints
-- work the same here: NULLs are distinct, so each swipe has exactly one non-null target.
drop index public.swipes_actor_startup;
drop index public.swipes_actor_investor;
alter table public.swipes add constraint swipes_actor_startup_key unique (actor_id, startup_id);
alter table public.swipes add constraint swipes_actor_investor_key unique (actor_id, investor_id);
