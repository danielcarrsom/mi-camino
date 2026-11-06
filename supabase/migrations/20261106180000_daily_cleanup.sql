-- Daily cleanup, so the retention times promised in the privacy notice hold
-- even when the app is quiet: attempt logs after 30 days, rate-limit codes after 1 day.
create extension if not exists pg_cron;

create or replace function private.cleanup_old_records()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_attempts where at < now() - interval '30 days';
  delete from public.recovery_attempts where at < now() - interval '30 days';
  delete from private.rate_hits where minute < now() - interval '1 day';
$$;
revoke all on function private.cleanup_old_records() from public, anon, authenticated;

select cron.schedule('mi-camino-daily-cleanup', '17 4 * * *', $$select private.cleanup_old_records()$$);
