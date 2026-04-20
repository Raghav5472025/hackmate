-- =============================================
-- HackMate — Fixes SQL
-- Run this in Supabase SQL Editor
-- =============================================

-- ── Fix 1: Make sure username column exists ───
alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists last_seen timestamptz default now();

-- ── Fix 2: Username index (case insensitive) ──
drop index if exists profiles_username_unique;
create index if not exists profiles_username_idx on public.profiles(lower(username));

-- ── Fix 3: Storage bucket for avatars ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- ── Fix 4: Storage policies (drop + recreate) ─
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Fix 5: Messages table (if not exists) ─────
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  invite_id uuid references public.invites(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (length(content) > 0 and length(content) <= 2000),
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

drop policy if exists "Chat participants can read messages" on public.messages;
drop policy if exists "Chat participants can send messages" on public.messages;

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
    auth.uid() = sender_id
    and auth.uid() in (
      select from_user_id from public.invites where id = invite_id and status = 'accepted'
      union
      select to_user_id from public.invites where id = invite_id and status = 'accepted'
    )
  );

-- ── Fix 6: Enable Realtime ────────────────────
alter publication supabase_realtime add table public.messages;

-- ── Done! ─────────────────────────────────────
select 'All fixes applied successfully!' as result;
