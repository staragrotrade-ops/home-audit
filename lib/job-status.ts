export const JOB_STATUSES = [
  'quote_received',
  'awaiting_customer',
  'awaiting_payment',
  'paid',
  'scheduling',
  'confirmed',
  'inspected',
  'report_sent',
  'completed',
  'cancelled',
] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  quote_received: 'Quote request',
  awaiting_customer: 'Waiting on customer',
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  scheduling: 'Scheduling',
  confirmed: 'Booked',
  inspected: 'Inspected',
  report_sent: 'Report sent',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const CLOSED_STATUSES: JobStatus[] = ['completed', 'cancelled']
