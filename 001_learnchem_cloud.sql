-- LEARN CHEM 3.0 Supabase schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text not null default 'Learner',role text not null default 'student' check(role in ('student','teacher','admin')),created_at timestamptz not null default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','Learner'),'student') on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.school_groups(id uuid primary key default gen_random_uuid(),name text not null check(char_length(name) between 3 and 80),join_code text not null unique,teacher_id uuid not null references public.profiles(id) on delete cascade,created_at timestamptz not null default now());
create table if not exists public.group_members(group_id uuid not null references public.school_groups(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,joined_at timestamptz not null default now(),primary key(group_id,user_id));
create table if not exists public.learner_progress(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,lesson_id text not null,completed boolean not null default false,bookmarked boolean not null default false,best_score integer check(best_score between 0 and 100),updated_at timestamptz not null default now(),unique(user_id,lesson_id));
create table if not exists public.ai_usage(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now());

alter table public.profiles enable row level security; alter table public.school_groups enable row level security; alter table public.group_members enable row level security; alter table public.learner_progress enable row level security; alter table public.ai_usage enable row level security;

-- Helper functions avoid recursive RLS policy lookups.
create or replace function public.is_group_member(gid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.group_members where group_id=gid and user_id=auth.uid()); $$;
create or replace function public.owns_group(gid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.school_groups where id=gid and teacher_id=auth.uid()); $$;
create or replace function public.is_student_in_teacher_group(student_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.group_members gm join public.school_groups sg on sg.id=gm.group_id where gm.user_id=student_id and sg.teacher_id=auth.uid()); $$;

-- Prevent users from changing their own role; they may update only display_name.
revoke update on public.profiles from authenticated; grant update(display_name) on public.profiles to authenticated;
drop policy if exists profile_self_read on public.profiles; create policy profile_self_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_student_in_teacher_group(id));
drop policy if exists profile_self_update on public.profiles; create policy profile_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists group_insert_teacher on public.school_groups; create policy group_insert_teacher on public.school_groups for insert to authenticated with check(teacher_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin')));
drop policy if exists group_read_member on public.school_groups; create policy group_read_member on public.school_groups for select to authenticated using(teacher_id=auth.uid() or public.is_group_member(id));
drop policy if exists group_update_teacher on public.school_groups; create policy group_update_teacher on public.school_groups for update to authenticated using(teacher_id=auth.uid()) with check(teacher_id=auth.uid());
drop policy if exists group_delete_teacher on public.school_groups; create policy group_delete_teacher on public.school_groups for delete to authenticated using(teacher_id=auth.uid());

create or replace function public.join_school_group(p_join_code text) returns uuid language plpgsql security definer set search_path=public as $$ declare gid uuid; begin if auth.uid() is null then raise exception 'Please sign in first'; end if; select id into gid from public.school_groups where join_code=upper(trim(p_join_code)); if gid is null then raise exception 'Invalid group code'; end if; insert into public.group_members(group_id,user_id) values(gid,auth.uid()) on conflict do nothing; return gid; end; $$; grant execute on function public.join_school_group(text) to authenticated;

drop policy if exists group_members_read on public.group_members; create policy group_members_read on public.group_members for select to authenticated using(user_id=auth.uid() or public.owns_group(group_id));
drop policy if exists teacher_self_join on public.group_members; create policy teacher_self_join on public.group_members for insert to authenticated with check(user_id=auth.uid() and public.owns_group(group_id));
drop policy if exists teacher_remove_member on public.group_members; create policy teacher_remove_member on public.group_members for delete to authenticated using(public.owns_group(group_id));

drop policy if exists progress_read_owner_or_teacher on public.learner_progress; create policy progress_read_owner_or_teacher on public.learner_progress for select to authenticated using(user_id=auth.uid() or public.is_student_in_teacher_group(user_id));
drop policy if exists progress_insert_owner on public.learner_progress; create policy progress_insert_owner on public.learner_progress for insert to authenticated with check(user_id=auth.uid());
drop policy if exists progress_update_owner on public.learner_progress; create policy progress_update_owner on public.learner_progress for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
-- No client policies for ai_usage: only the Edge Function service role accesses it.
-- Promote a verified teacher manually: update public.profiles set role='teacher' where id=(select id from auth.users where email='teacher@example.com');
