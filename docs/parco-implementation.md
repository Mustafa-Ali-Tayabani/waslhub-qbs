# PARCO vendor onboarding, supply & services — implementation report

Implemented inside the **two existing WaslHub portals** (Supplier Portal `public/index.html`, Tenant Admin `public/admin.html`) on 29-Oct-2026. No third portal was created. All DEMO-specific logic lives in one shared, persistent demo data layer, [parco-store.js](../parco-store.js), used by both apps.

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

Tenant **PARCO — Pakistan** (`DEMO-DEMO`, PKR, Asia/Karachi). Staff: Ayesha Khan (PARCO Admin), Bilal Raza (Finance), Hassan Malik (Approver 1), Sana Ahmed (Approver 2), Farhan Siddiqui (Concerned Person). Switch the acting user from the **Prototype** dock in the Admin portal; the Supplier Portal is signed in as Lena Marsh, Vendor Organization Admin of **Indus Technical Trading & Services (Demo)** `V-1000236` (capabilities: Supply + Services).

| Vendor | Capability | Stage |
|---|---|---|
| V-1000234 Karachi Industrial Materials (Demo) | Supply | Active, Concerned Person Farhan |
| V-1000235 Sindh Field Maintenance (Demo) | Services (Mechanical, Calibration) | Vendor accepted via portal → PARCO review **overdue** |
| V-1000236 Indus Technical Trading & Services (Demo) | Both (Electrical, Inspection, Mechanical) | Active, Concerned Person Farhan (backup Bilal) |
| V-1000237 Coastal Civil Works (Demo) | Services (Civil) | ONB-00041 awaiting vendor response, both channels pending |
| V-1000238 / V-1000239 | — | In SAP master, not invited (available in the Invite wizard) |

Records: DEMO-DSP-00081 (pending Level 1, due tomorrow), DEMO-SRV-000112 (pending Level 2, due today), DEMO-SRV-000110 (fully approved, awaiting SES), client requests DEMO-CR-000411/412/413, invoices INV-DEMO-2026-091 (vendor, under review), 092 (uploaded on behalf by Farhan), 093 (scheduled, PDF).

## 3. Mandatory shared-status demonstration

1. Admin → Vendor Onboarding → ONB-00041: both channel cards show **Pending**. Open the vendor views from the detail (`index.html?onboarding=ONB-00041&channel=email` and `&channel=portal`).
2. Accept on the **email action** page. The admin list immediately shows *Vendor accepted · PARCO review* with *Accepted here* on Email and *Accepted via Email* on Magic link; reloading the magic link page shows *already accepted via Email* with no buttons.
3. ONB-00040 was accepted via the **magic link** (fixture): its email action page shows *already accepted via Portal* and cannot reject.
4. Approver task T-00081-1: open `admin.html?task=T-00081-1&channel=email` and accept; the in-app step for Level 1 becomes read-only with *via Email action*, and only then does Level 2 (Sana) become actionable — in app or via `?task=T-00081-2&channel=email`.

`node tests/e2e.js` automates all four plus 100+ other checks.

## 4. Roles as enforced in the prototype

Screen access is enforced by role in `renderVals` (not just hidden in the nav): Demo Admin (all), Finance (overview, onboarding, vendors, finance, payments, notifications, audit, monitoring, SAP connection), Approvers (overview, supply/service approvals, vendors, notifications, audit — own task history), Concerned Person (overview, assigned vendors, vendors scoped to assignments, notifications, audit scoped). Vendor users only ever see `V-1000236` data. Command-level checks: assigned approver only, same person cannot approve both levels, reject needs a reason, on-behalf upload needs assignment + reason + PDF, duplicate active invitation prevented, SAP-owned services read-only.

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
- Master data (Tenant Admin › Setup): **Tax rates** (`d.taxCodes`, `saveTaxCode` / `removeTaxCode`; a code used in a vendor tax rule cannot be removed, set it inactive instead); **Services master data** add (active immediately, labelled PARCO until mapped in SAP) and remove (`removeService`, refused while a vendor or client request uses it); **Approval routing** (`config.approval[SUPPLY|SERVICE]`, `setApprovers`) with optional per-vendor routing (`vendor.approvers`, chosen in the invite wizard or the vendor profile). New submissions and resubmissions use `approversFor(vendorId, type)`; open tasks keep their approver. Any staff member assigned as an approver gets the Approvals screens.
- Demo accounts include the users of every active vendor; the Supplier Portal follows the signed-in user's company (`VENDOR` is set from the session). Indus Technical keeps its hand-made SAP document fixtures; every other vendor gets simulated SAP purchase orders in the store (`d.sapPos`): two supply POs when it is activated (`seedPos`), and a service PO line for each client request (`servicePoLine`). SAP confirmation posts the received quantity onto the PO line (`postReceipt`); the vendor's invoice wizard creates a real store invoice for Demo Finance and records the invoiced quantity (`invoicePo`).
- Users & RBAC: Setup › Users (`saveUser`, deactivation refused while the user is an approver, Concerned Person or has open approvals; the last admin is protected) and Setup › Roles & permissions (`d.roles`, `PARCO.PERMS`, `can(staffId, perm)`, custom roles). Every admin screen and action checks a permission; approving follows Approval routing, not a permission.
- Service orders: the vendor creates a service order for any enabled service by entering the PARCO reference number; `checkReference()` refuses unknown numbers, another vendor's numbers, numbers for another service and already-used numbers (refusals are logged).
- ATL and WHT: supply dispatches and service orders ask whether the vendor is on FBR's Active Taxpayer List; ATL service orders choose a WHT category from Setup › Tax rates & WHT (`d.whtCodes`, ATL and non-ATL rates, demo values); non-ATL uses the non-ATL rate. The submission stores `atlDeclared` and `wht`; approvers see a warning when the declaration differs from PARCO's ATL record; invoices for that PO carry the WHT rate.
- Vendor record (Vendors › Directory › a vendor): full-width page with live counts and related-list tabs — Overview, Service orders, Supply dispatches, Client requests (PARCO references), Purchase orders (expandable lines), Invoices (with View PDF), People & access, Activity. Lists are searchable; a row opens the record in its own screen (`vendRel()`).
- Invoices: the vendor's invoice wizard has the ATL toggle and, for service POs, the WHT category; withholding and net payable show in the summary.
- Service orders per vendor appear in the vendor directory (column) and on the Concerned Person's assigned vendor cards.
- Open approvals can be moved to the configured approvers (`rerouteOpen`): a button on Setup › Approval routing, and automatically when a vendor's own approvers change. A task is kept if the move would let one person approve both levels.
- The vendor profile's Change capability / services form uses the same searchable service picker as the invite wizard.
- Tax code rules per vendor: `vendor.taxRule = { codes, def, by, at, reason }`, set by Demo Admin or Finance in the vendor profile (`setTaxRule` / `clearTaxRule`, both logged). The Supplier Portal invoice and standalone-invoice forms only offer the assigned codes and preselect the default; without a rule every SAP tax code for the company code is allowed.
- Approval panels for someone who is not the assigned approver show Accept / Reject locked (separation of duties) plus Send reminder and a demo shortcut to switch to the assigned approver.
- Flow guide (Tenant Admin › Help): a 12-step tutorial of the whole flow, filterable by role, each step linking to its screen (`guideV()`).
- Search and filters on every list: the shared admin table helper `tbl()` adds a search box, automatic status/type filter chips (a dropdown when there are more than six values) and a filtered count; the Supplier Portal uses `fbar()` / `lfx()` for payments, dispatches, service work and client requests.
- Prototype controls are hidden unless the URL contains `?prototype=1` (they hold Reset demo data, table states and flow shortcuts).
- Side panels (both portals): every record detail (onboarding request, vendor, supply / service submission, invoice, service master item) and every inline form (new dispatch, service work, client request, service draft, upload on behalf) opens in a side panel (`.ux-drawer`) below the header; the list shrinks beside it so the next row stays clickable, Esc closes details. Each detail ends with a sticky action footer (`.ux-dr-foot`, built by `onbFoot` / `apprFoot` / `finFoot` / `vendFoot` in Tenant Admin and `subFoot` in the Supplier Portal) that says who acts next and shows only the actions the signed-in user can take, including the rejection reason field. Duplicate inline action buttons were removed.
- Visual language v2 (both portals): brand `#2348D6` with a violet companion (`--brand-2`, `--brand-grad`), dark gradient sidebar (`.ux-side`, `.ux-nav`), frosted header (`.ux-glass`), gradient sign-in panels and dashboard heroes, 16–18 px card radii with soft shadows, uppercase table headers. Quick search: ⌘K / Ctrl+K or the header search opens a palette (`cmdV()`) that finds screens, actions, vendors, onboarding requests, dispatches, service work, invoices and POs, filtered by role.
- Dashboards (both portals) share one component kit (`.ux-*` classes in each page's style block: KPI tiles, task rows, stage strip, single-series bars, approval progress). The admin Overview is computed per role in `homeV()`; the supplier Home in `dashV()`.
- `Tenant Admin.dc.html` — `00 Sign in` with five demo accounts (session in `localStorage` key `waslhub.parco.session`), six role-gated sidebar sections with tabs (Overview · Vendors · Approvals · Finance · Activity · Setup), header account menu; invite wizard step 3 picks the primary contact and additional users from the vendor's SAP contact persons (`vendor.contacts`); new screens `08 Overview`, `08 Vendor Onboarding` (+ Invite wizard), `08 Vendors`, `08 Supply Approvals`, `08 Service Approvals` (+ client requests), `08 Services Master Data`, `08 Assigned Vendors` (+ on-behalf upload), `08 Finance & Invoices`, `08 Payment Insight`, `08 Notifications & Reminders`, `08 Audit & Contact Logs`, `08 Email Action`; PDF viewer; prototype dock with *Act as* and *Reset PARCO demo data*.
- URLs: `index.html?onboarding=<ONB-id>&channel=portal|email`, `admin.html?task=<task-id>&channel=email`, `admin.html?screen=<screen>&request=|vendor=|submission=<id>`.
- Tests: `tests/e2e.js` + `tests/parco.scenarios.js` (192 checks incl. `vendorRecord`, `usersAndRbac`, `atlWhtAndVendorOrders`, `sapPosRerouteAndProfilePicker` and a full new-vendor lifecycle `fullFlowNewVendor`, headless Chrome; pages open with `?prototype=1` so the prototype controls are available). Run `node tests/e2e.js`.

## 8. Acceptance checklist

| Criterion | Result |
|---|---|
| Admin and Supplier remain the two portals; existing flows intact | ✅ regression scenarios pass |
| Only Demo Admin initiates onboarding | ✅ wizard only for Demo Admin |
| SAP master data prefilled, read-only, *Missing in SAP* shown | ✅ |
| Supply / Services / Both with multi-service selection | ✅ |
| One shared status across email action and magic link; other channel locked after a decision | ✅ automated |
| Sent / opened never equals accepted | ✅ status only changes on `decideOnboarding` |
| Vendor accept/reject; PARCO review, activation, revoke, expiry date | ✅ (expiry enforced by date in fixtures; no automatic sweep) |
| Vendor users with roles; vendors isolated | ✅ (prototype signed in as one vendor) |
| Concerned Person assigned after onboarding, scoped view, history | ✅ |
| Supply submission against SAP PO with prefilled read-only fields, validations, evidence | ✅ |
| Two distinct approvers, app or secure email, one status per task | ✅ automated |
| Service submission requires Demo Client Request Number; one/many services | ✅ |
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

## Supplier registration (7-step wizard)

Built from "Waslhub Supplier Registration – Fields & Dropdowns Spec". The vendor's magic link (`index.html?onboarding=ID&channel=portal`) now opens the registration wizard: Company Details, Primary Contact, Address, Bank Account (several accounts), Products and Services, Compliance & Documents, Review. Progress bar ("Step X of 7", "% Complete"), clickable stepper, Back / Save Draft / Next, inline validation, Edit links on the Review page.

- Field definitions, country rules and validation live in `parco-store.js` (`REG_C`, `regSchema`, `regErrors`), so both portals read the same definition.
- Country-driven fields: Pakistan (SECP, NTN, STRN, FBR certificates, +92, PKR, Pakistani cities and banks), Saudi Arabia (CR, ZATCA, +966, SAR, 18 cities), UAE (Trade Licence, TRN, +971, AED).
- Prefilled from the SAP vendor master; "Fill sample data (demo)" and "Use a sample file" exist for demos. Real file picking works (10 MB, PDF/DOC/DOCX/JPG/JPEG/PNG); only the file name is stored.
- Submitting the registration accepts the invitation (`submitRegistration`). The email action can still accept without the form; admin then sees "No registration submitted".
- Admin › Vendors › Onboarding › request: registration summary, document checklist with Preview and Verify (`verifyRegDoc`), "Approve & activate" is blocked until every required document is verified, "Send back for changes" reopens the wizard for the vendor, who resubmits.
- Step 6 is named "Compliance & Documents" in both the stepper and the Review page (the spec used two names).
- Test: `supplierRegistration` (suite 208 checks).

## Approvals for PO invoices and onboarding

- **PO invoices:** a vendor invoice on any PO creates a `DEMO-PIA-…` approval (type `INVOICE`) routed to the vendor's Level 1 and Level 2 approvers (supply approvers for material POs, service approvers for service POs). Level 1 re-checks ATL with FBR; after Level 2, "Post to SAP" posts the invoice. Screen: Approvals › PO invoices.
- **Invitations:** an invitation prepared by a PARCO user goes to that user's invitation approvers (Setup › Users › Approvers for this user's vendor invitations; default Hassan Malik → Sana Ahmed) as a `DEMO-OBA-…` approval (stage `INVITE`). The vendor receives the link only after Level 2. The person who prepared it cannot approve it.
- **Registrations:** when the vendor submits the registration, a stage `REGISTRATION` approval goes to the vendor's own approvers (chosen in invite step 3). Level 1 must verify every document before accepting; rejection sends the form back to the vendor with the reason; Level 2 approval activates the vendor. Screen: Approvals › Onboarding.
- Config switches (store `config`): `inviteApproval`, `registrationApproval` (both on). `createOnboarding({ skipApproval: true })` exists for test setup.
- Tests: `poInvoiceApproval`, updated `supplierRegistration`, `fullFlowNewVendor`, `adminOnboardingDetail` (suite 217 checks).

## Vendors that are not in SAP

Invite vendor › step 1 has two sources: **From SAP vendor master** (unchanged) and **New vendor (not in SAP)**. For a new vendor PARCO enters only the supplier name and email (the supplier provides everything else in the registration form); the wizard flags a possible duplicate of an existing vendor (same name, email or NTN). On send, `createNewVendor` adds a `NEW-xxxxx` vendor with `source: 'NEW'`, and the invitation follows the normal approval flow.

The vendor's registration is not prefilled from SAP and adds a "Business background and verification" block (year established, owners / directors with CNIC, two client references, litigation and blacklisting declarations) plus Company Profile, owners' CNIC copies and optional financial statements in Compliance & Documents. When Level 2 approves the registration, the vendor is activated and created in SAP (simulated): it gets an SAP vendor code (`sapCode`, e.g. V-1000301), and NTN, STRN, address and bank are taken from the registration. Test: `newVendorNotInSap` (suite 224 checks).


## Previewing the supplier's form

Vendors › Onboarding has **Preview supplier form** (SAP vendor) and **Preview form for a new supplier**; the new-vendor invite step has the same link. They open `index.html?onboarding=PREVIEW&channel=portal` (or `PREVIEW-NEW`): the real registration wizard with a preview banner, validation working, and nothing saved. Change Country in step 1 to see the Saudi Arabia or UAE fields.

## SAP-data onboarding and side panels

- Invite wizard, SAP vendor selected: **How does this vendor complete onboarding?** — **Use SAP data** (default: details fetched from SAP, the vendor only reviews and accepts, no form) or **Vendor fills the registration form**. Stored as `onboarding.regMode` (`SAP` | `FORM`); new non-SAP vendors are always `FORM`. Previews: `?onboarding=PREVIEW-SAP` and `PREVIEW-NEW`. Test: `sapDataOnboarding`.
- Side panels (both portals): while a panel is open the list beside it collapses to its first two columns with the open row highlighted, the page intro and filter chips hide, panel content stacks into one column below 720px, footer text is clamped to two lines, and Esc closes the panel.
