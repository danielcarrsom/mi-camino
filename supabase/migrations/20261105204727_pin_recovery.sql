-- PIN recovery: a security question per person, one-time recovery codes
-- (given in person, e.g. at the Consulate), and attempt logging for rate limits.
-- Only the edge function (service role) touches these tables: RLS on, no policies.

create table if not exists public.recovery (
  user_id uuid primary key references auth.users(id) on delete cascade,
  question text not null,
  answer_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists recovery_codes_user_idx on public.recovery_codes(user_id);

create table if not exists public.recovery_attempts (
  id bigint generated always as identity primary key,
  phone text not null,
  ok boolean not null,
  at timestamptz not null default now()
);
create index if not exists recovery_attempts_phone_at_idx on public.recovery_attempts(phone, at);

alter table public.recovery enable row level security;
alter table public.recovery_codes enable row level security;
alter table public.recovery_attempts enable row level security;
revoke all on public.recovery, public.recovery_codes, public.recovery_attempts from anon, authenticated;

-- Find an account by its internal login name (service role only).
create or replace function public.user_id_by_login(login text)
returns uuid
language sql
security definer
set search_path = ''
as $$ select id from auth.users where email = lower(login) limit 1 $$;
revoke all on function public.user_id_by_login(text) from public, anon, authenticated;
grant execute on function public.user_id_by_login(text) to service_role;
