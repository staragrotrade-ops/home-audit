-- Booking requests: the owner proposes up to three inspection times to the
-- agent (or another access contact) by email or text. The message carries a
-- private link; the agent picks a time there (or says none suit), and the job
-- is updated automatically.
--
-- The link has its own table, separate from job_access_tokens, so an agent's
-- link can never open the customer's order page.

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  token_hash text not null unique,
  slots timestamptz[] not null,
  channel text not null,
  service_label text,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  status text not null default 'sent',
  chosen_start timestamptz,
  reply_message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz not null default now() + interval '21 days',
  constraint booking_requests_hash_check check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint booking_requests_slots_check check (cardinality(slots) between 1 and 3),
  constraint booking_requests_channel_check check (channel in ('email', 'sms', 'link')),
  constraint booking_requests_status_check
    check (status in ('sent', 'confirmed', 'declined', 'cancelled')),
  constraint booking_requests_chosen_check
    check (status <> 'confirmed' or chosen_start is not null),
  constraint booking_requests_reply_length check (char_length(coalesce(reply_message, '')) <= 1000)
);

create index if not exists booking_requests_job_idx
  on public.booking_requests (job_id, created_at desc);

alter table public.booking_requests enable row level security;
revoke all on table public.booking_requests from anon, authenticated;
