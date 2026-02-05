-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  constraint username_length check (char_length(username) >= 3)
);

-- Create mindmaps table
create table mindmaps (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table
create table subscriptions (
  user_id uuid references auth.users on delete cascade not null primary key,
  status text,
  plan text,
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create activity_logs table
create table activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table mindmaps enable row level security;
alter table subscriptions enable row level security;
alter table activity_logs enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Mindmaps policies
create policy "Users can view own mindmaps." on mindmaps
  for select using (auth.uid() = user_id);

create policy "Users can insert own mindmaps." on mindmaps
  for insert with check (auth.uid() = user_id);

create policy "Users can update own mindmaps." on mindmaps
  for update using (auth.uid() = user_id);

create policy "Users can delete own mindmaps." on mindmaps
  for delete using (auth.uid() = user_id);

-- Subscriptions policies
create policy "Users can view own subscription." on subscriptions
  for select using (auth.uid() = user_id);

-- Activity logs policies
create policy "Users can view own logs." on activity_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own logs." on activity_logs
  for insert with check (auth.uid() = user_id);

-- Function to handle new user profile creation
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
