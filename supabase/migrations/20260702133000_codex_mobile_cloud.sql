create extension if not exists pgcrypto;

create table if not exists public.codex_mobile_profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  display_name text,
  guest boolean not null default false,
  client_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (username),
  unique (client_key)
);

create table if not exists public.codex_mobile_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  owner_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.codex_mobile_profiles enable row level security;
alter table public.codex_mobile_records enable row level security;

drop policy if exists "codex mobile profiles read" on public.codex_mobile_profiles;
drop policy if exists "codex mobile profiles insert" on public.codex_mobile_profiles;
drop policy if exists "codex mobile profiles update" on public.codex_mobile_profiles;
drop policy if exists "codex mobile records read" on public.codex_mobile_records;
drop policy if exists "codex mobile records insert" on public.codex_mobile_records;

create policy "codex mobile profiles read" on public.codex_mobile_profiles for select using (true);
create policy "codex mobile profiles insert" on public.codex_mobile_profiles for insert with check (true);
create policy "codex mobile profiles update" on public.codex_mobile_profiles for update using (true) with check (true);
create policy "codex mobile records read" on public.codex_mobile_records for select using (true);
create policy "codex mobile records insert" on public.codex_mobile_records for insert with check (true);
