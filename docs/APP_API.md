# Inspector app API (v2)

Contract between the Home Audit website backend and the future building &
pest inspector app. Base URL: `https://homeaudit.com.au`. All responses are
JSON with `ok: true` or `ok: false` plus `error`.

## Sign-in

`GET /api/app/config` (no sign-in) returns `{supabaseUrl, publishableKey}` so
the app does not hard-code them.

The app signs in directly with Supabase Auth (email + password) using the
project URL and publishable key, then sends the access token on every call:

```
Authorization: Bearer <supabase access token>
```

Refresh the token with Supabase Auth before it expires. Logins are created
by the owner in `/admin` → Inspectors (a temporary password is shown once).
There are no API keys or secrets in the app.

`401` means sign in again; `400` means the request was refused (the message
says why); `404` means the job is not visible to this inspector.

## Endpoints

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/api/app/account` | – | `account {userId, staffId, email, displayName, role, registrationNumber, canIssueReports}`, `apiVersion` (2) |
| GET | `/api/app/jobs` | `?updatedSince=<ISO>` optional | `jobs[]` (max 400, newest change first), `serverTime` |
| GET | `/api/app/jobs/{id}` | – | `job` |
| PATCH | `/api/app/jobs/{id}/progress` | `{inspectionStatus?: not_started\|on_site\|inspected, reportStatus?: not_started\|drafting}` | `progress` (forward-only) |
| POST | `/api/app/jobs/{id}/report-upload` | `{reportKind, sizeBytes}` | `{bucket, path, signedUrl, token, maxBytes}` |
| POST | `/api/app/jobs/{id}/report-complete` | `{reportKind, versionLabel: "v1", storagePath, sizeBytes, sha256, issuedAt?}` | `report {id, versionLabel}` |
| GET | `/api/app/jobs/{id}/reports` | – | `reports[]` |
| GET | `/api/app/reports/{reportId}/download` | – | `{url}` (valid 5 minutes), `sizeBytes`, `sha256` |

`reportKind`: `building`, `timber_pest`, `building_and_pest`,
`new_home_stage`, `pci`, `other`.

### Job fields (`inspector_job_feed`)

`id, public_reference, service_family (existing_home|new_home),
inspection_type (building_and_pest|building_only|pre_auction),
new_home_stages[] (slab|frame|pre_plaster|fixing|pci), status, payment_status,
inspection_status, report_status, confirmed_start, confirmed_end,
preferred_date_1, preferred_date_2, deadline, flexible_booking, builder_name,
expected_ready_date, access_contact, access_notes, is_test, created_at,
updated_at, customer_first_name, customer_last_name, customer_email,
customer_mobile, full_address, suburb, postcode, property_type, storeys,
bedrooms, bathrooms`

Prices, payment ids and the owner's internal notes are never sent to the app.

### Uploading a report

1. `POST report-upload` with the kind and file size.
2. `PUT` the PDF to `signedUrl` (Supabase Storage signed upload, content type
   `application/pdf`). Check the URL host is the project's Supabase host.
3. `POST report-complete` with the returned `path`, the size and the SHA-256
   of the file. The server checks the file exists at that exact path and that
   its size matches; the SHA-256 is recorded as reported by the app. A new version of the same kind marks the previous one
   `superseded`; old versions are never overwritten.

## Inspection capture (v2)

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/api/app/catalog` | `?templatesSinceRev=` optional | `catalog {version, severities[], trades[], areas[], elements[]}`, `templates[]` (most used first) |
| GET | `/api/app/jobs/{id}/inspection` | `?sinceRev=` optional | `floorplans[]` (with `url`, valid 1 hour), `defects[]`, `photos[]`, `serverRev` |
| POST | `/api/app/jobs/{id}/assessment` | `Assessment` | `result {applied, stale}` |
| POST | `/api/app/jobs/{id}/areas` | `{areas: Area[]}` (max 200) | `result {applied[], stale[]}` |
| POST | `/api/app/jobs/{id}/defects` | `{defects: Defect[]}` (max 200) | `result {applied[], stale[]}` |
| POST | `/api/app/jobs/{id}/photos` | `Photo` | `{uploaded}`; when false also `{signedUrl, token, path}` |
| POST | `/api/app/jobs/{id}/photos/{photoId}` | – | confirms the upload (`uploaded: true`) |
| GET | `/api/app/jobs/{id}/photos/{photoId}` | – | `{url}` (valid 10 minutes) |
| DELETE | `/api/app/jobs/{id}/photos/{photoId}` | – | marks the photo deleted (file kept for the audit trail) |
| POST | `/api/app/jobs/{id}/floorplans/upload` | `{contentType, sizeBytes}` | `{path, signedUrl, token}` |
| POST | `/api/app/jobs/{id}/floorplans/complete` | `{path, levelLabel}` | `floorplan` |
| POST | `/api/app/jobs/{id}/submit` | – | hands fieldwork to review (`reportStatus: in_review`) |
| POST | `/api/app/dictation` | multipart `audio` (wav/aac/m4a ≤ 4 MB) + `field` (observation\|recommendation\|title\|limitation), optional `element`, `severity`, `location`, `existing`, `jobId` | `result {transcript, language, text, notes}` – Gemini; nothing stored; 240/hour per inspector |

**Defect** — the phone creates the `id` (UUID v4) so offline edits keep their
identity. `{id, elementKey, severity, title, observation, recommendation?,
locationLabel?, floorplanId?, pinX?, pinY? (0–1 of the plan's width/height),
extraPins? ([{floorplanId, x, y}], up to 50 further locations of the same defect;
needs the first pin),
tradeKey?, quantity?, quantityUnit?, rootCauseId?, templateId?, sortOrder?,
deleted?, clientUpdatedAt}`. The server fills `category` from the severity,
the trade from the element when not given (inspector override wins) and the
unit from the element's quantity metric. Resending is safe: the newest
`clientUpdatedAt` wins; older edits come back in `stale` and the app should
pull. Deletes are soft (`deleted: true`).

**Root causes** are one level deep: a symptom points to its cause with
`rootCauseId`; a cause cannot point to another cause. In trade leads a
symptom is grouped under the cause's trade (a ceiling stain caused by a
blocked gutter belongs to the roofer's lead).

**Assessment** — the report summary (AS 4349.1 Appendix C, AS 4349.3), one per job:
`{buildingCondition: above_average|average|below_average, majorIncidence / minorIncidence:
low|typical|high, pestRisk: low|moderate|high|extreme, pestIntervalMonths 1–24,
furtherInspections: [structural_engineer|electrician|plumber|gas_fitter|roofer|drainer|
pest_manager|asbestos_assessor|pool_inspector|arborist|invasive_pest_inspection],
weather?, occupancy?, summary?, clientUpdatedAt}` (all ratings optional). The inspection
pull returns `assessment` (or null). The catalog also returns `reportTerms {version, scope[],
terms[]}` – the standard report wording (lib/report-terms.ts); blocks have `scope`
all|building|pest.

**Area** — a room or part of the property in the "Areas inspected" list:
`{id, name, kind: room|wet_area|roof_exterior|roof_space|subfloor|exterior|site|outbuilding,
status: not_started|inspected|limited|not_accessible|not_applicable, limitation?, notes?,
sortOrder?, deleted?, clientUpdatedAt}`. Limited / not accessible should have a `limitation` (the app asks for it; the
website accepts it missing so one area never blocks the sync).
The inspection pull also returns `areas[]`.

**Photo** — `{id, defectId?, areaId?, contentType, sizeBytes, sha256, widthPx?,
heightPx?, caption?, source: camera|gallery, capturedAt}`. Sync the defect
first, then register the photo, `PUT` the bytes to `signedUrl`, then confirm.
`submit` is refused while any photo is unconfirmed.

**Incremental sync**: keep the highest `serverRev` seen per job and pass it as
`sinceRev`. One counter covers defects and photos on all phones.

**Floorplans** come from the listing (fetched once after payment, best
effort), the customer's upload on the order page, admin, or onsite capture.

## Who can see what

- An inspector sees only jobs assigned to them in `/admin`.
- A staff member with role `admin` sees every job.
- Disabling a login in `/admin` blocks the app on its next call.
- Only admins and staff marked "Allow issuing reports" in `/admin` can register
  (issue) a report; other inspectors submit fieldwork for review.

## Not built yet (planned)

Creating jobs from the phone, report email delivery, push notifications,
repair quotes and releasing trade leads to the tradie platform.
New endpoints will be added under `/api/app/` without changing the ones above.
