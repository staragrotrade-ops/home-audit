-- The app's report list (read as the signed-in inspector) shows whether the
-- report was sent and downloaded. Those columns need the same column grant
-- as the others. Safe to run more than once.
grant select (sent_at, sent_to, download_count) on public.inspection_reports to authenticated;
