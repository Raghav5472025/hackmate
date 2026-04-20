-- =============================================
-- HackMate V5 — Run this in Supabase SQL Editor
-- =============================================

-- Fix avatar_url column
alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists availability text default 'available',
  add column if not exists available_hours int default 4,
  add column if not exists reputation_score int default 0,
  add column if not exists profile_views int default 0;

-- Username index
create index if not exists idx_profiles_username on public.profiles(lower(username));

-- Storage bucket for avatars (safe upsert)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880;

-- Storage policies
do $$
begin
  drop policy if exists "avatars_select" on storage.objects;
  drop policy if exists "avatars_insert" on storage.objects;
  drop policy if exists "avatars_update" on storage.objects;
  drop policy if exists "avatars_delete" on storage.objects;
  drop policy if exists "Avatar images are publicly accessible" on storage.objects;
  drop policy if exists "Users can upload own avatar" on storage.objects;
  drop policy if exists "Users can update own avatar" on storage.objects;
  drop policy if exists "Users can delete own avatar" on storage.objects;
exception when others then null;
end $$;

create policy "avatars_select" on storage.objects for select using (bucket_id='avatars');
create policy "avatars_insert" on storage.objects for insert
  with check (bucket_id='avatars' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "avatars_update" on storage.objects for update
  using (bucket_id='avatars' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "avatars_delete" on storage.objects for delete
  using (bucket_id='avatars' and auth.uid()::text=(storage.foldername(name))[1]);

-- Messages table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  invite_id uuid references public.invites(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (length(content)>0 and length(content)<=2000),
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;

drop policy if exists "msgs_select" on public.messages;
drop policy if exists "msgs_insert" on public.messages;
create policy "msgs_select" on public.messages for select using (
  auth.uid() in (
    select from_user_id from public.invites where id=invite_id
    union select to_user_id from public.invites where id=invite_id
  )
);
create policy "msgs_insert" on public.messages for insert with check (
  auth.uid()=sender_id and auth.uid() in (
    select from_user_id from public.invites where id=invite_id and status='accepted'
    union select to_user_id from public.invites where id=invite_id and status='accepted'
  )
);

-- Leaderboard view
create or replace view public.leaderboard as
select id, full_name, username, avatar_url, avatar_color, college, role,
  hackathons_count, wins_count, reputation_score,
  (hackathons_count*10 + wins_count*25 + reputation_score) as total_score
from public.profiles
order by total_score desc;

-- Realtime
alter publication supabase_realtime add table public.messages;

-- Performance indexes
create index if not exists idx_messages_invite on public.messages(invite_id);
create index if not exists idx_messages_created on public.messages(created_at);
create index if not exists idx_invites_from on public.invites(from_user_id);
create index if not exists idx_invites_to on public.invites(to_user_id);

select 'V5 SQL done!' as result;
