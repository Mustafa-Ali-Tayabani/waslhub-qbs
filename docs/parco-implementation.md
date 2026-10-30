# PARCO vendor onboarding, supply & services — implementation report

Implemented inside the **two existing WaslHub portals** (Supplier Portal `public/index.html`, Tenant Admin `public/admin.html`) on 29-Oct-2026. No third portal was created. All PARCO-specific logic lives in one shared, persistent demo data layer, [parco-store.js](../parco-store.js), used by both apps.

## 1. What is live and what is simulated

| Capability | Status in this build | Where |
|---|---|---|
| Shared business state across screens, channels and browser tabs | **Live** — one localStorage store (`waslhub.parco.v1`); every screen re-renders on change, including other tabs (`storage` event) | `parco-store.js` |
| Onboarding decision via magic link **or** email action, one decision per request version | **Live** — `decideOnboarding(requestId, version, decision, channel, actor, remarks)` is idempotent; the second channel is locked and shows who decided, when and via which channel | Supplier `?onboarding=ID&channel=portal\|email`, Admin → Vendor Onboarding |
| Two distinct PARCO approvers, in app or via secure email page | **Live** — `decideApproval(taskId, submissionVersion, decision, channel, actorId, reason)` enforces assigned approver, no same-person double approval, reason on reject, one decision per task/version | Admin → Supply / Service Approvals; `admin.html?task=ID&channel=email` |
| Concerned Person acting on behalf of a vendor | **Live** — `createInvoice({source:'PARCO_ON_BEHALF', …})` requires assignment + reason; invoice carries real actor, vendor, reason, authorisation reference; vendor sees the attribution | Admin → Assigned Vendors; Supplier → invoice detail |
| Audit / contact / activity log | **Live** — append-only events with actor type, real actor, beneficiary vendor, channel, source; CSV export | Admin → Audit & Contact Logs, vendor detail |
| Due On + manual Send Reminder | **Live** — cooldown and max-count policy, recipient is the actual pending actor, outcome logged | Overview, Notifications & Reminders, request/task detail |
| Payment statement PDF (View / Download) | **Live** — generated client-side per record from the same data (A4, Helvetica); viewer uses a blob URL in an iframe | Finance, Payment Insight (both portals), invoice detail |
| Email delivery | **Simulated** — every "sent" shows *Simulated — demo mail*; nothing is sent | all channels |
| SAP posting (GR / SES), SAP document numbers for new records | **Simulated** — "Simulate SAP GR / SES confirmation (prototype)" is an admin-only, clearly labelled control; until used the workflow shows *Awaiting goods receipt / SES in SAP* and *Not available from SAP* | Approvals detail |
| ATL — Active Taxpayer List (FBR) | **Simulated** — no integration; Finance records a manual check with a labelled source; default *Not verified · integration not configured* | Vendor detail, Finance, Supplier profile |
| WHT — Withholding Tax | **Data-driven, never hard-coded** — rate comes from the invoice record (labelled *SAP tax data (simulated)*) or is shown as *Awaiting SAP tax data*; net payable is computed only when a rate exists | Finance, invoice detail, PDF |
| Credentials / login | Prototype: demo-account sign-in on both portals (pick a person; the session is remembered in the browser; *Switch account* / *Log out* in the header menu). The supplier email/password form still works without a credential check; OTP accepts any digits | Supplier login, Tenant Admin sign-in |

## 2. Demo identities and fixtures (all fictional, `@example.com`)

Tenant **PARCO — Pakistan** (`PARCO-DEMO`, PKR, Asia/Karachi). Staff: Ayesha Khan (PARCO Admin), Bilal Raza (Finance), Hassan Malik (Approver 1), Sana Ahmed (Approver 2), Farhan Siddiqui (Concerned Person). Switch the acting user from the **Prototype** dock in the Admin portal; the Supplier Portal is signed in as Lena Marsh, Vendor Organization Admin of **Indus Technical Trading & Services (Demo)** `V-1000236` (capabilities: Supply + Services).

| Vendor | Capability | Stage |
|---|---|---|
| V-1000234 Karachi Industrial Materials (Demo) | Supply | Active, Concerned Person Farhan |
| V-1000235 Sindh Field Maintenance (Demo) | Services (Mechanical, Calibration) | Vendor accepted via portal → PARCO review **overdue** |
| V-1000236 Indus Technical Trading & Services (Demo) | Both (Electrical, Inspection, Mechanical) | Active, Concerned Person Farhan (backup Bilal) |
| V-1000237 Coastal Civil Works (Demo) | Services (Civil) | ONB-00041 awaiting vendor response, both channels pending |
| V-1000238 / V-1000239 | — | In SAP master, not invited (available in the Invite wizard) |

Records: PARCO-DSP-00081 (pending Level 1, due tomorrow), PARCO-SRV-000112 (pending Level 2, due today), PARCO-SRV-000110 (fully approved, awaiting SES), client requests PARCO-CR-000411/412/413, invoices INV-DEMO-2026-091 (vendor, under review), 092 (uploaded on behalf by Farhan), 093 (scheduled, PDF).

## 3. Mandatory shared-status demonstration

1. Admin → Vendor Onboarding → ONB-00041: both channel cards show **Pending**. Open the vendor views from the detail (`index.html?onboarding=ONB-00041&channel=email` and `&channel=portal`).
2. Accept on the **email action** page. The admin list immediately shows *Vendor accepted · PARCO review* with *Accepted here* on Email and *Accepted via Email* on Magic link; reloading the magic link page shows *already accepted via Email* with no buttons.
3. ONB-00040 was accepted via the **magic link** (fixture): its email action page shows *already accepted via Portal* and cannot reject.
4. Approver task T-00081-1: open `admin.html?task=T-00081-1&channel=email` and accept; the in-app step for Level 1 becomes read-only with *via Email action*, and only then does Level 2 (Sana) become actionable — in app or via `?task=T-00081-2&channel=email`.

`node tests/e2e.js` automates all four plus 100+ other checks.

## 4. Roles as enforced in the prototype

Screen access is enforced by role in `renderVals` (not just hidden in the nav): PARCO Admin (all), Finance (overview, onboarding, vendors, finance, payments, notifications, audit, monitoring, SAP connection), Approvers (overview, supply/service approvals, vendors, notifications, audit — own task history), Concerned Person (overview, assigned vendors, vendors scoped to assignments, notifications, audit scoped). Vendor users only ever see `V-1000236` data. Command-level checks: assigned approver only, same person cannot approve both levels, reject needs a reason, on-behalf upload needs assignment + reason + PDF, duplicate active invitation prevented, SAP-owned services read-only.

## 5. Integration contracts (replace the demo implementations here)

| Command | Purpose | Idempotency / rules |
|---|---|---|
| `createOnboarding` | Invite from SAP vendor master with capabilities, services, users, channels, due days | one active request per vendor unless renewed (new version) |
| `decideOnboarding` | Vendor accept/reject from either channel | first valid decision per version wins; returns `ALREADY_DECIDED` with channel/time |
| `activateVendor`, `requestCorrection`, `revokeOnboarding`, `resendChannel` | PARCO review lifecycle | resend never changes business status |
| `assignConcernedPerson`, `updateCapabilities` | Post-onboarding assignment and controlled scope changes with reason, effective date, history | vendor must be ACTIVE |
| `createClientRequest` | PARCO issues a Client Request Number for an enabled service | vendor never generates it |
| `createSubmission`, `decideApproval`, `confirmSap`, `resubmit` | Supply dispatch / service work, two-level approval, SAP confirmation, versioned resubmission | see §4 |
| `createInvoice`, `setInvoiceStatus`, `setAtl` | Vendor or on-behalf invoice, Finance status, ATL record | on-behalf requires assignment |
| `sendReminder`, `addContact`, `log`, `auditCsv` | Reminders with policy, contact log, immutable audit | reminders log sender/recipient/outcome |
| `invoicePdf`, `makePdf` | Record-specific PDF | generated from the same record |

Production wiring points: replace `persist/load` with the backend, emit real email from `createOnboarding/sendReminder` (keep the *simulated* label until then), feed `confirmSap`/`sapStatus` from the SAP GR/SES events, replace `setAtl` with the FBR ATL check, and populate `whtRate/whtRateSource` from SAP tax data.

## 6. Left configurable (not guessed)

Listed in the store under `config.todo` and surfaced in the Overview subtitle: SAP connection type and field mapping; activation timing after acceptance; email decision verification and token expiry; named approvers / approval matrix (`config.approvers`); invoice eligibility gate after GR/SES; Client Request Number pattern; Concerned Person delegated actions and proof of authorisation; due-date SLA, reminder cadence and escalation (`config.onboardingDueDays`, `approvalDueDays`, `reminderCooldownHours`, `maxReminders`); FBR ATL method and WHT rules (`config.wht`, `atlMode` warn/block); PDF type when SAP provides originals; production email, storage, retention and audit export permissions.

## 7. Files and routes

- `parco-store.js` — shared data layer (fixtures, commands, PDF, labels), embedded into all three pages by `build.py`.
- `Supplier Portal.dc.html` — demo-account sign-in, header account menu, one **Workflow** screen with tabs (SAP documents · Supply dispatches · Service work; screens `03 Supplier Workflow`, `03 Supply Workflow`, `03 Services Workflow`); new screens `01 Onboarding · Magic Link`, `01 Onboarding · Email Action`; registry invoices in the SAP documents tab, Invoice Detail (attribution, WHT, PDF), Payment Insight (PDF), Profile (NTN/STRN, ATL, Concerned Person, help requests, roles), Dashboard panel, Notifications merge.
- Demo data: 11 SAP vendors (7 not yet invited) and a 105-service SAP service master in 13 categories (`moreServices()` in parco-store.js, `SEED_VERSION` 6). The invite wizard's service step is a searchable picker (`svcPick()`): search, category chips with counts, selected chips, select all shown.
- Invite wizard step 3: one PARCO contact person (dropdown with designation) stored as `concernedPlan` on the request and assigned as Concerned Person by `activateVendor()`; vendor contact name and email are typed; extra vendor users are added with an Operations / Finance toggle.
- Flow guide (Tenant Admin › Help): a 12-step tutorial of the whole flow, filterable by role, each step linking to its screen (`guideV()`).
- Search and filters on every list: the shared admin table helper `tbl()` adds a search box, automatic status/type filter chips (a dropdown when there are more than six values) and a filtered count; the Supplier Portal uses `fbar()` / `lfx()` for payments, dispatches, service work and client requests.
- Prototype controls are hidden unless the URL contains `?prototype=1` (they hold Reset demo data, table states and flow shortcuts).
- Side panels (both portals): every record detail (onboarding request, vendor, supply / service submission, invoice, service master item) and every inline form (new dispatch, service work, client request, service draft, upload on behalf) opens in a side panel (`.ux-drawer`) below the header; the list shrinks beside it so the next row stays clickable, Esc closes details. Each detail ends with a sticky action footer (`.ux-dr-foot`, built by `onbFoot` / `apprFoot` / `finFoot` / `vendFoot` in Tenant Admin and `subFoot` in the Supplier Portal) that says who acts next and shows only the actions the signed-in user can take, including the rejection reason field. Duplicate inline action buttons were removed.
- Visual language v2 (both portals): brand `#2348D6` with a violet companion (`--brand-2`, `--brand-grad`), dark gradient sidebar (`.ux-side`, `.ux-nav`), frosted header (`.ux-glass`), gradient sign-in panels and dashboard heroes, 16–18 px card radii with soft shadows, uppercase table headers. Quick search: ⌘K / Ctrl+K or the header search opens a palette (`cmdV()`) that finds screens, actions, vendors, onboarding requests, dispatches, service work, invoices and POs, filtered by role.
- Dashboards (both portals) share one component kit (`.ux-*` classes in each page's style block: KPI tiles, task rows, stage strip, single-series bars, approval progress). The admin Overview is computed per role in `homeV()`; the supplier Home in `dashV()`.
- `Tenant Admin.dc.html` — `00 Sign in` with five demo accounts (session in `localStorage` key `waslhub.parco.session`), six role-gated sidebar sections with tabs (Overview · Vendors · Approvals · Finance · Activity · Setup), header account menu; invite wizard step 3 picks the primary contact and additional users from the vendor's SAP contact persons (`vendor.contacts`); new screens `08 Overview`, `08 Vendor Onboarding` (+ Invite wizard), `08 Vendors`, `08 Supply Approvals`, `08 Service Approvals` (+ client requests), `08 Services Master Data`, `08 Assigned Vendors` (+ on-behalf upload), `08 Finance & Invoices`, `08 Payment Insight`, `08 Notifications & Reminders`, `08 Audit & Contact Logs`, `08 Email Action`; PDF viewer; prototype dock with *Act as* and *Reset PARCO demo data*.
- URLs: `index.html?onboarding=<ONB-id>&channel=portal|email`, `admin.html?task=<task-id>&channel=email`, `admin.html?screen=<screen>&request=|vendor=|submission=<id>`.
- Tests: `tests/e2e.js` + `tests/parco.scenarios.js` (132 checks, headless Chrome; pages open with `?prototype=1` so the prototype controls are available). Run `node tests/e2e.js`.

## 8. Acceptance checklist

| Criterion | Result |
|---|---|
| Admin and Supplier remain the two portals; existing flows intact | ✅ regression scenarios pass |
| Only PARCO Admin initiates onboarding | ✅ wizard only for PARCO Admin |
| SAP master data prefilled, read-only, *Missing in SAP* shown | ✅ |
| Supply / Services / Both with multi-service selection | ✅ |
| One shared status across email action and magic link; other channel locked after a decision | ✅ automated |
| Sent / opened never equals accepted | ✅ status only changes on `decideOnboarding` |
| Vendor accept/reject; PARCO review, activation, revoke, expiry date | ✅ (expiry enforced by date in fixtures; no automatic sweep) |
| Vendor users with roles; vendors isolated | ✅ (prototype signed in as one vendor) |
| Concerned Person assigned after onboarding, scoped view, history | ✅ |
| Supply submission against SAP PO with prefilled read-only fields, validations, evidence | ✅ |
| Two distinct approvers, app or secure email, one status per task | ✅ automated |
| Service submission requires PARCO Client Request Number; one/many services | ✅ |
| *Both* vendor runs supply and services concurrently | ✅ automated (DSP-00082 + SRV-000113) |
| On-behalf invoice visible to vendor with real uploader attribution | ✅ |
| Every action logged with actor/time/channel/source | ✅ |
| Due On + Send Reminder with outcome and overdue visibility | ✅ |
| ATL terminology only (no ATS) | ✅ asserted in tests |
| WHT without hard-coded official rates | ✅ |
| View PDF real, Download PDF matching file | ✅ automated |
| Operational approval, SAP confirmation, invoice review, payment kept separate | ✅ |
| Decisions persist across refresh and navigation | ✅ automated |
| Simulated integrations never presented as real | ✅ labelled everywhere |
