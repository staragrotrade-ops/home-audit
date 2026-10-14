-- Google Calendar: when each booked job was last put in the calendar, and the
-- last error if it failed. The event id is fixed per job ("ha" + job id), so
-- it is not stored. Additive and safe to run twice.
alter table public.jobs
  add column if not exists calendar_synced_at timestamptz,
  add column if not exists calendar_error text;
