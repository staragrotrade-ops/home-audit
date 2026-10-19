-- Inspection Agreement: the version of the agreement the customer accepted,
-- when, and a SHA-256 fingerprint of the exact text. The customer ticks the
-- box on the order page before paying (or, for a job paid another way,
-- before giving the booking details). Each acceptance is also written to
-- audit_events. Additive and safe to run twice.

alter table public.jobs
  add column if not exists agreement_version text,
  add column if not exists agreement_sha256 text,
  add column if not exists agreement_accepted_at timestamptz;

alter table public.jobs drop constraint if exists jobs_agreement_check;
alter table public.jobs add constraint jobs_agreement_check check (
  (agreement_version is null and agreement_sha256 is null and agreement_accepted_at is null)
  or (
    agreement_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    and agreement_sha256 ~ '^[0-9a-f]{64}$'
    and agreement_accepted_at is not null
  )
);
