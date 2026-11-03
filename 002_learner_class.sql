-- LEARN CHEM 3.1: learner class selection and profile sync.
-- Run this AFTER 001_learnchem_cloud.sql in Supabase SQL Editor.
alter table public.profiles add column if not exists class_level text;

alter table public.profiles drop constraint if exists profiles_class_level_check;
alter table public.profiles add constraint profiles_class_level_check
  check (class_level is null or class_level in (
    'JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3',
    'University 100','University 200','University 300','University 400'
  ));

-- Existing policy allows a user to update only their own profile row.
-- Grant only the extra column needed for class selection; role remains protected.
grant update(class_level) on public.profiles to authenticated;

-- New sign-ups save their selected class from trusted auth metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(id,display_name,role,class_level)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name','Learner'),
    'student',
    case
      when new.raw_user_meta_data->>'class_level' in (
        'JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3',
        'University 100','University 200','University 300','University 400'
      ) then new.raw_user_meta_data->>'class_level'
      else null
    end
  )
  on conflict(id) do update
    set class_level=coalesce(public.profiles.class_level,excluded.class_level);
  return new;
end;
$$;
