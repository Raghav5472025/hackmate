-- =============================================
-- HackMate V4 — SQL Additions
-- Run this in Supabase SQL Editor
-- (Run AFTER supabase_schema.sql and supabase_additions.sql)
-- =============================================

-- ── Add username + avatar_url to profiles ────
alter table public.profiles
  add column if not exists username text unique,
  add column if not exists avatar_url text,
  add column if not exists last_seen timestamptz default now();

-- ── Username uniqueness index ─────────────────
create unique index if not exists profiles_username_unique on public.profiles(lower(username));

-- ── Storage bucket for avatars ────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- ── Storage policies ──────────────────────────
create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Messages table (if not already done) ──────
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  invite_id uuid references public.invites(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (length(content) > 0 and length(content) <= 2000),
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Chat participants can read messages" on public.messages
  for select using (
    auth.uid() in (
      select from_user_id from public.invites where id = invite_id
      union
      select to_user_id from public.invites where id = invite_id
    )
  );

create policy "Chat participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    auth.uid() in (
      select from_user_id from public.invites where id = invite_id and status = 'accepted'
      union
      select to_user_id from public.invites where id = invite_id and status = 'accepted'
    )
  );

-- ── Realtime ──────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
