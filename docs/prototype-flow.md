# WaslHub Supplier Invoicing Portal — prototype flow

How the clickable prototype is wired, screen by screen, so it can be drawn as a flow diagram.
Three pages ship in `public/`:

| Page | File | User | Sample identity |
|---|---|---|---|
| Supplier Portal | `index.html` | Supplier user | Lena Marsh, Northline Industrial Supplies LLC (supplier 1000234) at tenant Demo Buyer Co. |
| Tenant Admin | `admin.html` | Buyer's AP / procurement admin | Amal Khoury, AP Manager, Tenant admin role |
| Design System & Change Log | `design-system.html` | Reference only | Status tags, theme tokens, theme demo, change log, acceptance checklist |

Every Mermaid block below renders on GitHub. Section 10 repeats the same edges as a flat table for Figma / FigJam / Miro.

---

## 1. Screen inventory

Use the IDs as node names.

### Supplier Portal

| ID | Screen | Page label in the prototype | Purpose |
|---|---|---|---|
| S01 | Log in | 01 Auth · Log in | Tenant-branded login. No credential check in the prototype. |
| S02 | OTP | 01 Auth · OTP | 6-digit code; any digits pass. |
| S03 | Forgot password | 01 Auth · Forgot password | Enter email. |
| S04 | Check your email | (same screen, sent state) | Reset link sent. Prototype button opens the link. |
| S05 | Set a new password | 01 Auth · Reset password | Password rules checklist. |
| S06 | Invitation email | 01 Onboarding · Invitation email | Email the buyer sends to a new supplier. |
| S07 | Activate account | 01 Onboarding · Set password | Step 1 of 2: set password, accept terms. |
| S08 | Secure your account | 01 Onboarding · 2FA setup | Step 2 of 2: QR code, authenticator code. |
| S09 | Link expired | 01 Auth · Link expired | Invitation / reset link expired or used. |
| S10 | Welcome modal | (over Dashboard) | First-time hints after onboarding. |
| S11 | Home / Dashboard | 02 Dashboard | KPIs, action required, upcoming payments, POs ready to invoice. |
| S12 | Supplier Workflow | 03 Supplier Workflow | All SAP documents: tabs, search, filters, sort, pagination, export. |
| S13 | PO Detail | 04 PO Detail | Header, lines with open-to-invoice qty, linked documents. |
| S14 | GR Detail | 04 GR Detail | Read-only goods receipt (material document). |
| S15 | SES Detail | 04 SES Detail | Read-only service entry sheet. |
| S16 | Create Invoice / Credit Memo | 05 Create Invoice / Credit Memo | 4-step wizard plus success screen. |
| S17 | Standalone Invoice | 05 Standalone Invoice | Non-PO invoice form plus submitted screen. Can be disabled per tenant. |
| S18 | Invoice Detail | 05 Invoice Detail | Timeline, reason panel, lines, totals, attachments, audit trail. |
| S19 | Payment Insight | 06 Payment Insight | Aging buckets, payments list, remittance download. |
| S20 | Notifications | 07 Notifications | In-app list plus email template preview. |
| S21 | Profile | 07 Profile | Read-only supplier data, request change, portal users. |
| S22 | Documentation | 07 Documentation | Short guides linking into the flows. |

### Tenant Admin

| ID | Screen | Purpose |
|---|---|---|
| A01 | Tenant settings | Branding, regional formats, feature toggles, tolerances, attachment rules, live login preview. |
| A02 | SAP connection | Connection status, last sync, errors, sync log, company codes in scope. |
| A03 | Supplier management | SAP suppliers and portal access; invite flow (3-step modal). |
| A04 | Monitoring | KPI cards and exception queue (blocked, returned, sync failed). |
| A05 | Admin users & roles | Roles and admin user list. |

---

## 2. Authentication and onboarding

```mermaid
flowchart TD
  S01[S01 Log in] -->|Log in| S02[S02 OTP]
  S02 -->|Verify and continue| S11[S11 Dashboard]
  S02 -->|Back to log in| S01
  S01 -->|Forgot password?| S03[S03 Forgot password]
  S03 -->|Send reset link| S04[S04 Check your email]
  S03 -->|Back to log in| S01
  S04 -->|Open reset link| S05[S05 Set a new password]
  S04 -->|Return to log in| S01
  S05 -->|Update password · toast| S01
  S06[S06 Invitation email] -->|Activate my account| S07[S07 Activate: password + terms]
  S01 -->|activate your account| S07
  S07 -->|Set password & continue| S08[S08 2FA setup]
  S08 -->|Verify & enable 2FA| S10[S10 Welcome modal over Dashboard]
  S10 -->|Go to Home| S11
  S10 -->|Read the guide| S22[S22 Documentation]
  S06 -->|link opened after expiry| S09[S09 Link expired]
  S09 -->|Send me a new link · toast| S09
  S09 -->|Back to log in| S01
  S11 -->|Log out| S01
```

Rules shown on these screens: consent text under the Log in button, tenant branding on the left panel (3 rotating slides), OTP code expiry, reset link valid 30 minutes, invitation link valid 72 hours and single use.

---

## 3. Supplier navigation shell

Available on every signed-in screen (S11–S22).

| Element | Target |
|---|---|
| Sidebar: Home | S11 |
| Sidebar: Supplier Workflow | S12 |
| Sidebar: Payment Insight | S19 |
| Sidebar: Notifications (unread badge) | S20 |
| Sidebar: Profile | S21 |
| Sidebar: Documentation | S22 |
| Sidebar: Log out | S01 |
| New document → Invoice against PO | S16 (document type Invoice) |
| New document → Credit memo | S16 (document type Credit Memo) |
| New document → Standalone invoice | S17 |
| Header: Last synced with SAP pill, sync icon | Toast "Sync requested"; in the failed state a Retry button restores sync |
| Header: company selector (All companies / 1000 / 2000) | Filters every list and total to the selected company code |
| Header: bell | S20 |
| Header: user | S21 |
| Breadcrumb "Supplier Workflow" on detail screens | S12 |

---

## 4. Document flows (supplier)

```mermaid
flowchart TD
  S11[S11 Dashboard] -->|KPI Open POs / Under review / Blocked| S12[S12 Supplier Workflow tab]
  S11 -->|KPI Paid / Outstanding| S19[S19 Payment Insight tab]
  S11 -->|Action required item| S18b[S18 Invoice Detail · resubmit panel open]
  S11 -->|Upcoming payment row| S18[S18 Invoice Detail]
  S11 -->|PO ready to invoice · open| S13[S13 PO Detail]
  S11 -->|PO ready to invoice · Create invoice| S16[S16 Create Invoice step 1 · PO preselected]
  S12 -->|row type PO| S13
  S12 -->|row type GR| S14[S14 GR Detail]
  S12 -->|row type SES| S15[S15 SES Detail]
  S12 -->|row type Invoice / Credit Memo| S18
  S12 -->|Create invoice| S16
  S13 -->|Create Invoice · only if open qty > 0| S16
  S13 -->|Linked document| S14
  S13 -->|Linked document| S15
  S13 -->|Linked document| S18
  S13 -->|Linked payment| S19
  S14 -->|Invoice this quantity · GR posted| S16
  S15 -->|Invoice this quantity · SES accepted| S16
  S14 -->|PO link| S13
  S15 -->|PO link| S13
  S19 -->|row| S18
  S20 -->|notification| S18
  S20 -->|notification| S14
  S20 -->|notification| S15
  S20 -->|notification| S13
  S20 -->|notification| S19
  S22 -->|guide| S16
  S22 -->|guide| S12
  S22 -->|guide| S19
  S22 -->|guide| S21
```

### 4a. Create Invoice / Credit Memo wizard (S16)

```mermaid
flowchart LR
  W1[Step 1 · Select PO & lines] -->|Continue| W2[Step 2 · Quantities & prices]
  W2 -->|Continue| W3[Step 3 · Details & attachments]
  W3 -->|Continue| W4[Step 4 · Review & submit]
  W4 -->|Submit invoice| W5[Submitted · portal reference]
  W5 -->|View invoice| S18[S18 Invoice Detail · Blocked]
  W5 -->|Back to Supplier Workflow| S12[S12 Supplier Workflow]
  W1 -->|Cancel| S12
  W2 -->|Back| W1
  W3 -->|Back| W2
  W4 -->|Back| W3
```

Step rules:

- Step 1: document type toggle (Invoice / Credit Memo, credit memo switchable per tenant); PO cards show open-to-invoice value and are disabled when nothing is open; only lines with open received (GR) or accepted (SES) quantity can be selected.
- Step 2: per line ordered, received, already invoiced, open qty, PO unit price; entering a quantity above the open qty or a price outside the tenant tolerance (±2.00 %) shows an inline warning "may cause the invoice to be blocked for payment". Submission is still allowed.
- Step 3: supplier invoice ref. (mandatory, unique check), invoice date typed in tenant format, tax code from SAP for the company code, payment terms read-only, invoice PDF mandatory (max 10 MB), up to 5 supporting files.
- Step 4: summary, warnings count, confirmation checkbox.
- Save as draft is available at every step (toast).
- After submit the new invoice appears everywhere as NIS-INV-2025-0871, posted as 5105600123 / 2025 and blocked (Price Variance when the price was changed, otherwise Quantity Variance or Manual Block).

### 4b. Invoice Detail exception loop (S18)

```mermaid
flowchart LR
  B[Blocked for Payment · reason panel] -->|Upload corrected invoice| R[Resubmit modal · PDF + note]
  R -->|Resubmit| SCH[Scheduled for Payment · block released]
  R -->|Cancel| B
  SCH -->|Simulate SAP payment run · prototype| P[Paid · clearing document]
  P -->|Remittance advice| DL[PDF download · toast]
  B -->|Contact AP| M[Message modal]
  M -->|Send message| B
  RET[Returned to Supplier · reason panel] -->|Upload corrected invoice| R
  REJ[Rejected · reason panel] -.no resubmission.-> REJ
```

### 4c. Standalone (non-PO) invoice (S17)

```mermaid
flowchart LR
  F[Form · buyer contact, description, ref, date, company code, currency, net, tax code, PDF] -->|Submit invoice| D[Submitted · portal reference WH-SUB-2025-004128]
  D -->|Submit another| F
  D -->|Back to Supplier Workflow| S12[S12 Supplier Workflow]
  OFF[Feature disabled by tenant] -.shown instead of the form.-> OFF
```

### 4d. Profile (S21)

Request change → modal (field, new value, supporting document) → Send request → confirmation "Change request CR-2025-0193 sent". Invite user → toast. All supplier master data is read-only from SAP; bank account shows the last 4 digits only.

---

## 5. Status models

### Invoice lifecycle

```mermaid
stateDiagram-v2
  [*] --> Draft : saved in portal
  Draft --> Submitted : submit
  Submitted --> Parked : SAP creates parked document (tenant setting "Parked in SAP" on)
  Submitted --> UnderReview : tenant posts directly (setting off)
  Parked --> UnderReview : AP starts review
  UnderReview --> Posted : AP posts
  UnderReview --> Returned : AP returns with reason
  UnderReview --> Rejected : AP rejects with reason
  Returned --> Submitted : supplier resubmits corrected invoice
  Posted --> Blocked : payment block (Price Variance, Quantity Variance, Missing Goods Receipt, Date Variance, Manual Block)
  Posted --> Scheduled : included in payment run
  Blocked --> Scheduled : corrected invoice uploaded / block released
  Posted --> Reversed : SAP document reversed or cancelled
  Scheduled --> Paid : payment run executed, clearing document
  Paid --> [*]
  Rejected --> [*]
  Reversed --> [*]
```

### Other documents

| Object | States |
|---|---|
| Purchase Order | Open → Partially Delivered → Fully Delivered → Partially Invoiced → Fully Invoiced → Closed |
| Goods Receipt (material document) | Posted ↔ Reversed |
| Service Entry Sheet | Pending Acceptance → Accepted or Rejected |

Workflow tabs map onto these states: All · Action Required (returned, blocked, draft) · In Process (submitted, parked, under review, SES pending) · Posted (posted, scheduled, GR posted, SES accepted) · Paid · Rejected (rejected, reversed, GR reversed, SES rejected).

---

## 6. Tenant Admin flows

```mermaid
flowchart TD
  A01[A01 Tenant settings] -->|Save changes · toast| A01
  A01 -->|pick colour swatch| A01p[Live login preview + contrast checks]
  A02[A02 SAP connection] -->|Sync now · toast| A02
  A02f[Sync failed state · header pill + banner + Connection error] -->|Retry| A02
  A03[A03 Supplier management] -->|Invite supplier| I1[Invite modal · step 1 choose SAP supplier]
  I1 -->|Continue| I2[Step 2 · contact email, role, allow sub-users]
  I2 -->|Send invitation| I3[Step 3 · Invitation sent · link valid 72 h]
  I3 -->|Done| A03
  I1 -->|Cancel| A03
  I2 -->|Cancel| A03
  A03 -->|row action Invite · no access| I1
  A03 -->|row action Resend invite / Activate / Deactivate · toast| A03
  A04[A04 Monitoring] -->|KPI Blocked for payment| A04b[Queue filtered: Blocked]
  A04 -->|KPI Stuck / failed sync| A04s[Queue filtered: Sync failed]
  A04 -->|status filter select| A04
  A05[A05 Admin users & roles] -->|Add admin user · no-op in prototype| A05
```

Sidebar on every admin screen: Tenant settings, SAP connection, Supplier management, Monitoring (badge = exception count), Admin users & roles. Header: last-sync pill (or red "SAP sync failed · Retry"), signed-in admin.

---

## 7. Prototype controls (floating "Prototype" dock)

| Control | Supplier Portal | Tenant Admin |
|---|---|---|
| Flows | Login · Onboarding · Link expired · Reset password · Invoice happy path + blocked · Payments | — |
| Jump to screen | Any of S01–S22 | A01–A05 |
| Table state (all lists) | Data · Loading · Empty · Error for workflow, payments, notifications, PO linked documents | Same for all four admin tables |
| SAP sync | Synced · Sync failed (header pill, banner, table error state) | Synced · Sync failed (pill, banner, connection card, sync-log row) |
| Invoice NIS-INV-2025-0871 | Blocked · Scheduled · Paid | — |

Prototype-only helpers (reset-link opener, expired-link opener, payment-run simulator) are hidden when the dock is switched off via the `showPrototypeDock` property.

Recommended demo path: Log in → Dashboard → PO 4500012345 → Create Invoice (change a unit price) → Submitted → View invoice (Blocked, Price Variance) → Upload corrected invoice → Resubmit (Scheduled) → Simulate payment run (Paid) → Remittance advice. Admin path: Supplier management → Invite supplier → three steps.

---

## 8. Sample data map

```mermaid
erDiagram
  TENANT ||--|{ COMPANY_CODE : has
  COMPANY_CODE ||--|{ PLANT : has
  TENANT ||--|{ SUPPLIER : grants_access
  SUPPLIER ||--|{ PORTAL_USER : has
  SUPPLIER ||--|{ PURCHASE_ORDER : receives
  PURCHASE_ORDER ||--|{ PO_LINE : contains
  PO_LINE ||--o{ GOODS_RECEIPT : "material lines"
  PO_LINE ||--o{ SERVICE_ENTRY_SHEET : "service lines"
  PO_LINE ||--o{ INVOICE_LINE : invoiced_by
  INVOICE ||--|{ INVOICE_LINE : contains
  INVOICE ||--o| PAYMENT : cleared_by
```

| Entity | Sample values |
|---|---|
| Tenant | Demo Buyer Co. (alternate theme: Sample Tenant Group); company codes 1000 and 2000; plants 1100, 1200 |
| Supplier | 1000234 Northline Industrial Supplies LLC; users Lena Marsh (admin), Daniel Okafor, Priya Raman |
| POs | 4500012345 Packaging Materials (USD, material), 4500012388 Equipment Preventive Maintenance (USD, service), 4500012402 Safety Gloves (OMR), 4500012410 Hydraulic Hose Fittings (SAR) |
| Receipts | GR 5000004567 / 2025, 5000004589 / 2025, 5000004571 / 2025 (reversed); SES 1000000456 (accepted), 1000000461 (pending) |
| Invoices | NIS-INV-2025-0871 → SAP 5105600123 / 2025 (happy path); 0856 blocked Date Variance; 0862 returned; 0851 rejected; 0864 and 0849 paid; 0866 scheduled; 0833, 0815 posted; CM NIS-CM-2025-0012 |
| Payments | clearing 1500000789 (27-Oct-2025, bank transfer), 1500000771, 1500000752 |
| Tax codes | Company 1000: V5 VAT 5 %, V0 Zero-rated, VE Exempt; company 2000 adds S1 VAT 15 % |

---

## 9. Design rules visible in every flow

- Dates follow the tenant format (default DD-MMM-YYYY); typed date fields validate against it.
- Amounts are right-aligned with the currency code; 3-decimal currencies (OMR, KWD, BHD) show 3 decimals; mixed-currency lists show totals per currency.
- Net, Tax and Gross are always shown separately.
- SAP keys appear as "Number / Fiscal Year".
- Every SAP screen shows "Last synced with SAP" and has a sync-failed state with Retry.
- Every list has sort indicators, pagination and loading / empty / error states.
- Status tags carry an icon and a hover tooltip with meaning and required action; KPI cards, headers and controls carry explanatory tooltips.

---

## 10. Flat edge list (for diagram tools)

| From | Trigger | To |
|---|---|---|
| S01 Log in | Log in | S02 OTP |
| S01 | Forgot password? | S03 Forgot password |
| S01 | activate your account | S07 Activate |
| S02 | Verify and continue | S11 Dashboard |
| S02 | Back to log in | S01 |
| S03 | Send reset link | S04 Check your email |
| S04 | Open reset link | S05 Set a new password |
| S05 | Update password | S01 (toast) |
| S06 Invitation email | Activate my account | S07 |
| S07 | Set password & continue | S08 2FA setup |
| S08 | Verify & enable 2FA | S11 + S10 Welcome modal |
| S10 | Read the guide | S22 Documentation |
| S09 Link expired | Back to log in | S01 |
| Any signed-in screen | Log out | S01 |
| S11 | KPI card | S12 tab or S19 tab |
| S11 | Action required item | S18 (resubmit open) |
| S11 | Upcoming payment row | S18 |
| S11 | PO ready to invoice | S13 or S16 |
| S12 | Row (PO / GR / SES / INV / CM) | S13 / S14 / S15 / S18 |
| S12 | Create invoice | S16 |
| S13 | Create Invoice (open qty > 0) | S16 step 1 |
| S13 | Linked document | S14 / S15 / S18 / S19 |
| S14, S15 | Invoice this quantity | S16 |
| S14, S15 | PO link | S13 |
| S16 step 4 | Submit | S16 success |
| S16 success | View invoice | S18 (Blocked) |
| S16 success | Back to Supplier Workflow | S12 |
| S16 step 1 | Cancel | S12 |
| S18 Blocked / Returned | Upload corrected invoice → Resubmit | S18 Scheduled |
| S18 Scheduled | Simulate SAP payment run | S18 Paid |
| S18 Paid | Remittance advice | PDF download |
| S18 | Contact AP → Send message | toast |
| S18 | PO link | S13 |
| S17 form | Submit invoice | S17 submitted |
| S17 submitted | Submit another / Back | S17 form / S12 |
| S19 | Row | S18 |
| S20 | Notification | S18 / S14 / S15 / S13 / S19 |
| S21 | Request change → Send request | confirmation |
| S22 | Guide | S16 / S12 / S19 / S21 |
| A03 | Invite supplier | Invite step 1 → 2 → 3 → A03 |
| A03 | Row action | A03 (access state changes) |
| A04 | KPI Blocked / Stuck | A04 queue filtered |
| A02 (sync failed) | Retry | A02 synced |
