-- Create a table for public profiles
create table profiles (
  id text primary key, -- Clerk User ID
  email text,
  role text check (role in ('user', 'recruiter')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for vacancies (Recruiters)
create table vacancies (
  id uuid default gen_random_uuid() primary key,
  recruiter_id text references profiles(id) not null,
  title text not null,
  description text not null,
  requirements jsonb, -- Extracted keywords/skills
  status text check (status in ('active', 'closed', 'draft')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for candidates/resumes (Users)
create table candidates (
  id uuid default gen_random_uuid() primary key,
  user_id text references profiles(id) not null,
  file_url text not null, -- Link to R2 storage
  parsed_data jsonb not null, -- JSON result from analysis
  score_data jsonb, -- Optional: pre-calculated scores if needed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for applications/matches
create table applications (
  id uuid default gen_random_uuid() primary key,
  vacancy_id uuid references vacancies(id) not null,
  candidate_id uuid references candidates(id) not null,
  score integer, -- Match score 0-100
  status text check (status in ('applied', 'viewed', 'rejected', 'interview')) default 'applied',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table vacancies enable row level security;
alter table candidates enable row level security;
alter table applications enable row level security;

-- Policies (Basic examples, need refinement based on Auth)
-- Profiles: Users can read/update their own profile
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (true); -- Clerk sync will handle this usually
create policy "Users can update own profile" on profiles for update using (auth.uid()::text = id);

-- Vacancies: Read public, Write owner
create policy "Vacancies are viewable by everyone" on vacancies for select using (true);
create policy "Recruiters can insert their own vacancies" on vacancies for insert with check (auth.uid()::text = recruiter_id);
create policy "Recruiters can update their own vacancies" on vacancies for update using (auth.uid()::text = recruiter_id);

-- Candidates: Read owner (and recruiters?), Write owner
create policy "Candidates are viewable by owner" on candidates for select using (auth.uid()::text = user_id);
create policy "Users can insert their own candidates" on candidates for insert with check (auth.uid()::text = user_id);

-- Applications: Read owner (candidate) and recruiter (vacancy owner)
-- This is complex in RLS without joins, often handled in app logic or views.
