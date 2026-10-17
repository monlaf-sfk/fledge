-- Wizard drop-off for the Insights page: unique users who reached each onboarding step.
create function public.onboarding_steps()
returns table (role text, step int, users bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'analytics is restricted to admins' using errcode = '42501';
  end if;
  return query
    select e.props->>'role', (e.props->>'step')::int, count(distinct e.user_id)
    from public.events e
    join public.profiles p on p.id = e.user_id and not p.is_test
    where e.name = 'onboarding_step'
    group by 1, 2
    order by 1, 2;
end;
$$;
revoke execute on function public.onboarding_steps() from public, anon;
grant execute on function public.onboarding_steps() to authenticated;
