-- Login hardening.
-- 1) A secret ("pepper") that never leaves the database server. Passwords are
--    derived from it plus phone and PIN inside the edge functions, so a 6-digit
--    PIN can't be guessed directly against the auth API.
-- 2) A log of login attempts to lock a phone after repeated wrong PINs.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.secrets (
  name text primary key,
  value text not null,
  created_at timestamptz not null default now()
);
revoke all on private.secrets from public, anon, authenticated;
insert into private.secrets (name, value)
  values ('login_pepper', encode(extensions.gen_random_bytes(32), 'hex'))
  on conflict (name) do nothing;

create or replace function public.login_pepper()
returns text
language sql
security definer
set search_path = ''
as $$ select value from private.secrets where name = 'login_pepper' $$;
revoke all on function public.login_pepper() from public, anon, authenticated;
grant execute on function public.login_pepper() to service_role;

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  phone text not null,
  ip text,
  ok boolean not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_phone_at_idx on public.login_attempts(phone, at);
create index if not exists login_attempts_ip_at_idx on public.login_attempts(ip, at);
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;
