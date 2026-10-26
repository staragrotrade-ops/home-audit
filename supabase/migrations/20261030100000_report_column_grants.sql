-- The app's report list (read as the signed-in inspector) shows whether the
-- report was sent and downloaded. Those columns need the same column grant
-- as the others. Safe to run more than once.
grant select (sent_at, sent_to, download_count) on public.inspection_reports to authenticated;

-- Also in 20261029100000_report_transfer.sql after it was corrected; repeated
-- here for databases that ran the first version of that migration.
grant select (intake_channel) on public.jobs to authenticated;
alter table public.jobs drop constraint if exists jobs_transfer_of_report_id_fkey;
