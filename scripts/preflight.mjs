const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
]

const missing = required.filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

if (process.env.QUOTE_SUBMISSION_ENABLED !== 'true') {
  console.warn('QUOTE_SUBMISSION_ENABLED is not true; quote requests will remain disabled.')
}

console.log('Environment preflight passed.')
