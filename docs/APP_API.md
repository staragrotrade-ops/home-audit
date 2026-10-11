# Inspector app API (v1)

Contract between the Home Audit website backend and the future building &
pest inspector app. Base URL: `https://homeaudit.com.au`. All responses are
JSON with `ok: true` or `ok: false` plus `error`.

## Sign-in

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
| GET | `/api/app/account` | – | `account {userId, staffId, email, displayName, role, registrationNumber}`, `apiVersion` |
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
   of the file. A new version of the same kind marks the previous one
   `superseded`; old versions are never overwritten.

## Who can see what

- An inspector sees only jobs assigned to them in `/admin`.
- A staff member with role `admin` sees every job.
- Disabling a login in `/admin` blocks the app on its next call.

## Not built yet (planned)

Creating jobs from the phone, photo upload, structured inspection data
(AS 4349.1 / AS 4349.3 findings), report email delivery, push notifications.
New endpoints will be added under `/api/app/` without changing the ones above.
