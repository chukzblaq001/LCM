-- LEARN CHEM 3.3 repair: reliable learner profiles and school-group permissions.
-- Run AFTER 001_learnchem_cloud.sql and 002_learner_class.sql.

-- Explicit table privileges are still constrained by the RLS policies below.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update(display_name, class_level) on public.profiles to authenticated;
grant select, insert, delete on public.school_groups to authenticated;
grant select, insert on public.group_members to authenticated;
grant select, insert, update on public.learner_progress to authenticated;

-- Keep the profile trigger in sync with the latest registration metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_class text;
begin
  selected_class := new.raw_user_meta_data->>'class_level';
  if selected_class not in (
    'JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3',
    'University 100','University 200','University 300','University 400'
  ) then
    selected_class := null;
  end if;

  insert into public.profiles(id, display_name, role, class_level)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Learner'),
    'student',
    selected_class
  )
  on conflict (id) do update
    set display_name = coalesce(nullif(trim(excluded.display_name), ''), public.profiles.display_name),
        class_level = coalesce(public.profiles.class_level, excluded.class_level);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Safe recovery for a signed-in user whose profile row is missing.
-- The role is always set to student; clients cannot promote themselves.
create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  selected_class text;
  result_row public.profiles;
begin
  if uid is null then
    raise exception 'Please sign in first';
  end if;

  select raw_user_meta_data->>'class_level'
    into selected_class
    from auth.users
   where id = uid;

  if selected_class not in (
    'JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3',
    'University 100','University 200','University 300','University 400'
  ) then
    selected_class := null;
  end if;

  insert into public.profiles(id, display_name, role, class_level)
  select u.id,
         coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), 'Learner'),
         'student',
         selected_class
    from auth.users u
   where u.id = uid
  on conflict (id) do nothing
  returning * into result_row;

  if result_row.id is null then
    select * into result_row from public.profiles where id = uid;
  end if;
  return result_row;
end;
$$;
revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

-- Recreate the group join RPC with a clear error for bad/blank codes.
create or replace function public.join_school_group(p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  group_id_found uuid;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first';
  end if;
  if nullif(trim(p_join_code), '') is null then
    raise exception 'Enter a group join code';
  end if;

  select id into group_id_found
    from public.school_groups
   where upper(join_code) = upper(trim(p_join_code))
   limit 1;

  if group_id_found is null then
    raise exception 'No school group matches that join code';
  end if;

  insert into public.group_members(group_id, user_id)
  values (group_id_found, auth.uid())
  on conflict (group_id, user_id) do nothing;

  return group_id_found;
end;
$$;
revoke all on function public.join_school_group(text) from public, anon;
grant execute on function public.join_school_group(text) to authenticated;

-- Reassert the expected row-level security rules.
alter table public.profiles enable row level security;
alter table public.school_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.learner_progress enable row level security;

drop policy if exists profile_self_read on public.profiles;
create policy profile_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_student_in_teacher_group(id));

drop policy if exists profile_self_update on public.profiles;
create policy profile_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists group_insert_teacher on public.school_groups;
create policy group_insert_teacher on public.school_groups
  for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('teacher','admin'))
  );

drop policy if exists group_read_member on public.school_groups;
create policy group_read_member on public.school_groups
  for select to authenticated
  using (teacher_id = auth.uid() or public.is_group_member(id));

drop policy if exists group_members_read on public.group_members;
create policy group_members_read on public.group_members
  for select to authenticated
  using (user_id = auth.uid() or public.owns_group(group_id));

drop policy if exists teacher_self_join on public.group_members;
create policy teacher_self_join on public.group_members
  for insert to authenticated
  with check (user_id = auth.uid() and public.owns_group(group_id));

drop policy if exists progress_read_owner_or_teacher on public.learner_progress;
create policy progress_read_owner_or_teacher on public.learner_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_student_in_teacher_group(user_id));

drop policy if exists progress_insert_owner on public.learner_progress;
create policy progress_insert_owner on public.learner_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists progress_update_owner on public.learner_progress;
create policy progress_update_owner on public.learner_progress
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
