-- =============================================
-- HackMate V3 — Additional SQL
-- Run this in Supabase SQL Editor
-- (Run AFTER the original supabase_schema.sql)
-- =============================================

-- ── Add username to profiles ─────────────────
alter table public.profiles
  add column if not exists username text unique,
  add column if not exists last_seen timestamptz default now();

-- Auto-generate username from full_name if not set
create or replace function public.generate_username(name text, uid uuid)
returns text as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  base := lower(regexp_replace(split_part(name, ' ', 1), '[^a-z0-9]', '', 'g'));
  if length(base) < 3 then base := 'user'; end if;
  candidate := base;
  loop
    if not exists (select 1 from public.profiles where username = candidate and id != uid) then
      return candidate;
    end if;
    suffix := suffix + 1;
    candidate := base || suffix::text;
  end loop;
end;
$$ language plpgsql;

-- ── Messages table ────────────────────────────
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

create policy "Sender can update own messages" on public.messages
  for update using (auth.uid() = sender_id);

-- ── Enable Realtime on messages ───────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.invites;
alter publication supabase_realtime add table public.notifications;

-- ── Update notifications trigger ─────────────
create or replace function public.handle_new_message()
returns trigger as $$
declare
  other_user uuid;
  sender_name text;
begin
  select case when from_user_id = new.sender_id then to_user_id else from_user_id end
  into other_user
  from public.invites where id = new.invite_id;

  select full_name into sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, type, message, data)
  values (
    other_user,
    'message',
    sender_name || ' sent you a message',
    jsonb_build_object('invite_id', new.invite_id, 'sender_id', new.sender_id)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_message
  after insert on public.messages
  for each row execute procedure public.handle_new_message();

-- ── Index for performance ─────────────────────
create index if not exists messages_invite_id_idx on public.messages(invite_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
create index if not exists profiles_username_idx on public.profiles(username);
