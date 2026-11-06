-- Shared rate limit for the routes that cost money (AI and voice).
-- The web server calls public.rate_limit_hit(key, per_minute, per_day) before each
-- paid call. Keys are an HMAC of route + IP made on the server, so no IP is stored
-- and nobody can aim at someone else's counter. Old rows are cleaned up as it runs.
create schema if not exists private;

create table if not exists private.rate_hits (
  key text not null,
  minute timestamptz not null,
  count integer not null default 0,
  primary key (key, minute)
);
revoke all on private.rate_hits from public, anon, authenticated;

create or replace function public.rate_limit_hit(p_key text, p_per_minute integer, p_per_day integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  m timestamptz := date_trunc('minute', now());
  c_min integer;
  c_day integer;
begin
  if p_key is null or length(p_key) > 100 or p_per_minute < 1 or p_per_day < 1 then
    return false;
  end if;
  insert into private.rate_hits (key, minute, count) values (p_key, m, 1)
    on conflict (key, minute) do update set count = private.rate_hits.count + 1
    returning count into c_min;
  select coalesce(sum(count), 0) into c_day
    from private.rate_hits where key = p_key and minute > now() - interval '1 day';
  if random() < 0.01 then
    delete from private.rate_hits where minute < now() - interval '1 day';
  end if;
  return c_min <= p_per_minute and c_day <= p_per_day;
end;
$$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public;
grant execute on function public.rate_limit_hit(text, integer, integer) to anon, authenticated, service_role;
