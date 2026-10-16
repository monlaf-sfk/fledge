-- Analytics is for the team only. Admins are set by hand in SQL; clients cannot change it
-- (profiles allows client updates of full_name only, see 0001).
alter table public.profiles add column is_admin boolean not null default false;
update public.profiles set is_admin = true where email like 'rassulkerimzhanov+%@gmail.com';

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Both analytics functions now refuse non-admins.
create or replace function public.funnel_summary()
returns table (step text, users bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'analytics is restricted to admins' using errcode = '42501';
  end if;
  return query
    select 'signed_up'::text, count(*) from public.profiles where not is_test;
end;
$$;

alter function public.analytics_overview() rename to analytics_overview_unchecked;
revoke execute on function public.analytics_overview_unchecked() from public, anon, authenticated;

create function public.analytics_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'analytics is restricted to admins' using errcode = '42501';
  end if;
  return public.analytics_overview_unchecked();
end;
$$;
revoke execute on function public.analytics_overview() from public, anon;
grant execute on function public.analytics_overview() to authenticated;
