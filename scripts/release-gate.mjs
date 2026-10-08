import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn, spawnSync } from 'node:child_process'

const port = 3110
const productionHost = 'homeaudit.com.au'
const previewHost = 'home-audit-alpha.vercel.app'

const coreIndexableRoutes = [
  '/',
  '/building-and-pest-inspections',
  '/pre-purchase-building-inspection',
  '/new-home-inspections',
  '/practical-completion-inspection',
  '/about',
  '/credentials',
  '/service-areas',
  '/guides',
  '/guides/agent-pressure-skip-building-inspection',
  '/guides/building-inspection-buyers-market',
  '/guides/independent-new-home-stage-inspections',
  '/guides/major-building-defect-vs-major-structural-defect-victoria',
  '/guides/pre-slab-inspection-glen-waverley',
]

function run(command, args) {
  // npm is a .cmd shim on Windows and can only be started through a shell.
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    console.error(`Could not run "${command} ${args.join(' ')}": ${result.error.message}`)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function request(pathname, host = productionHost) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: pathname,
        headers: { Host: host },
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => resolve({ response, body }))
      },
    )

    req.on('error', reject)
    req.end()
  })
}

async function waitForServer() {
  const deadline = Date.now() + 20_000

  while (Date.now() < deadline) {
    try {
      await request('/')
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  throw new Error('Production server did not become ready within 20 seconds')
}

function canonicalFor(pathname) {
  return pathname === '/' ? 'https://homeaudit.com.au' : `https://homeaudit.com.au${pathname}`
}

function assertValidJsonLd(html, pathname) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  assert.ok(scripts.length > 0, `${pathname}: expected at least one JSON-LD block`)

  for (const [, value] of scripts) {
    assert.doesNotThrow(() => JSON.parse(value), `${pathname}: invalid JSON-LD`)
  }
}

run('npm', ['test'])
run('npm', ['run', 'lint'])
run('npm', ['run', 'build'])

const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
})

let serverOutput = ''
server.stdout.on('data', (chunk) => {
  serverOutput += chunk
})
server.stderr.on('data', (chunk) => {
  serverOutput += chunk
})

try {
  await waitForServer()

  const sitemap = await request('/sitemap.xml')
  assert.equal(sitemap.response.statusCode, 200, '/sitemap.xml: expected HTTP 200')
  assert.match(sitemap.body, /pre-purchase-building-inspection/, 'Sitemap must include pre-purchase page')
  assert.match(sitemap.body, /practical-completion-inspection/, 'Sitemap must include PCI page')
  assert.match(sitemap.body, /<loc>https:\/\/homeaudit\.com\.au\/guides<\/loc>/, 'Sitemap must include guides hub')
  assert.match(sitemap.body, /building-inspection-buyers-market/, 'Sitemap must include the market guide')
  assert.match(sitemap.body, /agent-pressure-skip-building-inspection/, 'Sitemap must include the agent-pressure guide')
  assert.doesNotMatch(sitemap.body, /<loc>https:\/\/homeaudit\.com\.au\/quote<\/loc>/, 'Sitemap must exclude quote')

  const serviceAreaRoutes = [...sitemap.body.matchAll(
    /<loc>https:\/\/homeaudit\.com\.au(\/service-areas\/[^<]+)<\/loc>/g,
  )].map((match) => match[1])

  assert.equal(serviceAreaRoutes.length, 12, 'Sitemap must contain 12 service-area detail pages')

  const indexableRoutes = [...coreIndexableRoutes, ...serviceAreaRoutes]

  for (const pathname of indexableRoutes) {
    const { response, body } = await request(pathname)
    assert.equal(response.statusCode, 200, `${pathname}: expected HTTP 200`)
    assert.match(body, /<meta name="robots" content="index, follow"\/>/, `${pathname}: expected index, follow`)
    assert.equal((body.match(/<h1(?:\s|>)/g) || []).length, 1, `${pathname}: expected exactly one h1`)
    assert.ok(
      body.includes(`<link rel="canonical" href="${canonicalFor(pathname)}"`),
      `${pathname}: expected self-referencing canonical`,
    )
    assertValidJsonLd(body, pathname)
  }

  const preview = await request('/', previewHost)
  assert.match(
    String(preview.response.headers['x-robots-tag']),
    /noindex, nofollow/,
    'Preview host must be noindex',
  )

  const production = await request('/')
  assert.equal(production.response.headers['x-robots-tag'], undefined, 'Production host must remain indexable')

  const quote = await request('/quote')
  assert.equal(quote.response.statusCode, 200, '/quote: expected HTTP 200')
  assert.match(quote.body, /<meta name="robots" content="noindex, follow"\/>/, '/quote must be noindex')

  const credentials = await request('/credentials')
  assert.match(credentials.body, /Xiaoqiong Yang/, 'Credentials page must show the inspector name')
  assert.match(credentials.body, /IN-L 100094/, 'Credentials page must show the registration number')
  assert.match(
    credentials.body,
    /Professional indemnity insurance maintained/,
    'Credentials page must show the insurance statement',
  )

  const robots = await request('/robots.txt')
  assert.equal(robots.response.statusCode, 200, '/robots.txt: expected HTTP 200')
  assert.match(robots.body, /User-Agent: OAI-SearchBot/, 'robots.txt must include OAI-SearchBot')

  const admin = await request('/admin')
  assert.equal(admin.response.statusCode, 404, '/admin must not be publicly available')

  const about = await request('/about')
  assert.match(about.body, /<title>About Home Audit<\/title>/, '/about: title must not repeat the brand')
  assert.match(about.body, /max-image-preview/, '/about: Googlebot preview directives must be present')

  const footerEmail = await request('/')
  assert.match(footerEmail.body, /mailto:info@homeaudit\.com\.au/, 'Homepage must publish the contact email')

  const missing = await request('/this-page-does-not-exist')
  assert.equal(missing.response.statusCode, 404, 'Unknown routes must return a true HTTP 404')

  const missingArea = await request('/service-areas/not-a-real-suburb')
  assert.equal(missingArea.response.statusCode, 404, 'Unknown service areas must return a true HTTP 404')

  console.log(
    '\nRELEASE PASS: code, build, service areas, routing, indexation, canonicals, JSON-LD and credentials checks passed.',
  )
} catch (error) {
  console.error('\nRELEASE FAILED')
  console.error(error)
  if (serverOutput) console.error(serverOutput)
  process.exitCode = 1
} finally {
  server.kill('SIGTERM')
}
