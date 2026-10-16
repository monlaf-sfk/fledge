-- Fledge: user profiles with a role chosen at sign-up (founder or investor).
-- Run once in Supabase Dashboard -> SQL Editor, or with `supabase db push`.

create type public.user_role as enum ('founder', 'investor');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        public.user_role not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read and update only their own profile.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Role and email are fixed after sign-up: clients may update only full_name.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, updated_at) on public.profiles to authenticated;

-- Create the profile row automatically when a user signs up.
-- Role and name come from the sign-up metadata; an unknown role aborts sign-up.
create function public.handle_new_user()
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

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    requested_role::public.user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
