const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const paths = [
  '/',
  '/building-and-pest-inspections',
  '/pre-purchase-building-inspection',
  '/new-home-inspections',
  '/practical-completion-inspection',
  '/about',
  '/credentials',
  '/service-areas',
  '/service-areas/mount-eliza',
  '/service-areas/clyde-north',
  '/quote',
  '/robots.txt',
  '/sitemap.xml',
]

let failed = false

for (const path of paths) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
    const ok = response.status >= 200 && response.status < 400
    console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${path}`)
    failed ||= !ok
  } catch (error) {
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : String(error)}`)
    failed = true
  }
}

if (failed) process.exit(1)
