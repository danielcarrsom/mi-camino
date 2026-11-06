-- Mi Camino: each person's data, private to them.
-- No immigration status, no account numbers, no documents are ever stored.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  lang text not null default 'es',
  casita boolean not null default true,
  negocio boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The person's money data (work, expenses, goals, plans, tandas) as one document.
-- Kept as JSON for the prototype so the app and database stay in sync easily.
create table public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

create policy "profiles: read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles: delete own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "user_data: read own" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_data: insert own" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_data: update own" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_data: delete own" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger user_data_touch before update on public.user_data for each row execute function public.touch_updated_at();

-- Anonymous totals the Consulate can see later (no personal data): people and languages.
create or replace view public.stats_overview with (security_invoker = true) as
  select lang, count(*) as people, count(*) filter (where negocio) as with_business
  from public.profiles group by lang;
revoke all on public.stats_overview from anon, authenticated;
