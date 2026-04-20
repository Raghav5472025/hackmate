-- =============================================
-- HackMate — Full Database Schema
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES TABLE ──────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  college text not null,
  year text not null check (year in ('1st year','2nd year','3rd year','4th year','Postgrad')),
  gender text not null check (gender in ('Female','Male','Non-binary','Prefer not to say')),
  role text not null,
  skills text[] not null default '{}',
  hackathons_count integer not null default 0,
  wins_count integer not null default 0,
  achievements text default '',
  github_url text default '',
  linkedin_url text default '',
  preferred_team_size integer default 4,
  is_open boolean not null default true,
  looking_for text default '',
  avatar_color text default 'teal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── INVITES TABLE ────────────────────────────────────────────────
create table public.invites (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  message text default '',
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

-- ── HACKATHONS TABLE ─────────────────────────────────────────────
create table public.hackathons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  organizer text not null,
  description text default '',
  start_date date,
  end_date date,
  registration_deadline date,
  mode text check (mode in ('Online','Offline','Hybrid')),
  location text default '',
  prize_pool text default '',
  team_size_min integer default 2,
  team_size_max integer default 5,
  tags text[] default '{}',
  website_url text default '',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── NOTIFICATIONS TABLE ──────────────────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  message text not null,
  is_read boolean default false,
  data jsonb default '{}',
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.hackathons enable row level security;
alter table public.notifications enable row level security;

-- Profiles: anyone can read, only owner can write
create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Invites: sender and receiver can read, only sender can insert
create policy "Users can view their invites" on public.invites for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Users can send invites" on public.invites for insert with check (auth.uid() = from_user_id);
create policy "Receiver can update invite status" on public.invites for update using (auth.uid() = to_user_id);

-- Hackathons: public read
create policy "Hackathons are public" on public.hackathons for select using (true);

-- Notifications: only owner can read
create policy "Users see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications for insert with check (true);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ── TRIGGER: Auto-create notification on invite ──────────────────
create or replace function public.handle_new_invite()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, message, data)
  values (
    new.to_user_id,
    'invite',
    'You received a new team invite!',
    jsonb_build_object('invite_id', new.id, 'from_user_id', new.from_user_id)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_invite_created
  after insert on public.invites
  for each row execute procedure public.handle_new_invite();

-- ── TRIGGER: Auto-update updated_at ─────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ── SAMPLE HACKATHON DATA ────────────────────────────────────────
insert into public.hackathons (name, organizer, description, start_date, end_date, registration_deadline, mode, prize_pool, team_size_min, team_size_max, tags, website_url) values
('Smart India Hackathon 2025', 'Ministry of Education, India', 'India''s biggest hackathon for students — solve real government problem statements.', '2025-08-15', '2025-08-17', '2025-07-31', 'Offline', '₹1,00,000', 2, 6, ARRAY['Government','Social Impact','AI','IoT'], 'https://sih.gov.in'),
('HackWithInfy 2025', 'Infosys', 'Infosys''s flagship student hackathon for engineering and science graduates.', '2025-09-10', '2025-09-12', '2025-08-25', 'Online', '₹3,00,000', 3, 5, ARRAY['Enterprise','Cloud','Sustainability'], 'https://hackwithinfy.com'),
('Flipkart Grid 7.0', 'Flipkart', 'E-commerce and supply chain focused hackathon by Flipkart.', '2025-10-01', '2025-10-03', '2025-09-15', 'Hybrid', '₹5,00,000', 2, 4, ARRAY['E-commerce','ML','Logistics','Data'], 'https://unstop.com'),
('Google Solution Challenge', 'Google Developer Student Clubs', 'Build solutions using Google technologies for UN Sustainable Development Goals.', '2025-01-01', '2025-04-30', '2025-03-01', 'Online', 'Global recognition + prizes', 1, 4, ARRAY['Google Cloud','Firebase','AI','SDGs'], 'https://developers.google.com/community/gdsc-solution-challenge');
