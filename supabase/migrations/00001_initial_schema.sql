-- ============================================================
-- AstroVastu Pro — initial database schema
-- Run this in the Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- 1. Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  subscription_status text not null default 'free',
  payment_customer_id text,  -- Razorpay/Cashfree customer ID (to be integrated later)
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Projects
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  client_name   text not null default '',
  location      text not null default '',
  language      text not null default 'english',
  project_type  text not null default 'residential',
  status        text not null default 'in_progress',
  cover_image_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 3. Layouts
create table if not exists public.layouts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null default 'Untitled',
  image_path    text not null,
  boundary      jsonb not null default '[]'::jsonb,
  center        jsonb not null default '{"x":0.5,"y":0.5}'::jsonb,
  north_degrees real not null default 0,
  viewport      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.layouts enable row level security;

create policy "Users can CRUD own layouts"
  on public.layouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 4. Layout Markers
create table if not exists public.layout_markers (
  id            uuid primary key default gen_random_uuid(),
  layout_id     uuid not null references public.layouts(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  kind          text not null check (kind in ('activity','utility','object')),
  label         text not null,
  position      jsonb not null default '{"x":0,"y":0}'::jsonb,
  verdict       text not null default 'neutral' check (verdict in ('good','bad','neutral')),
  remedy        text not null default '',
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

alter table public.layout_markers enable row level security;

create policy "Users can CRUD own markers"
  on public.layout_markers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 5. Storage bucket for floor-plan images (run in SQL editor)
insert into storage.buckets (id, name, public)
values ('floor-plans', 'floor-plans', false)
on conflict (id) do nothing;

create policy "Users can upload own floor plans"
  on storage.objects for insert
  with check (
    bucket_id = 'floor-plans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own floor plans"
  on storage.objects for select
  using (
    bucket_id = 'floor-plans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own floor plans"
  on storage.objects for delete
  using (
    bucket_id = 'floor-plans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
