/* PARCO scenario checks (loaded by tests/e2e.js). Shared demo data lives in localStorage, so each scenario resets it first. */
const reset = async (p) => { await p.evaluate(() => window.PARCO.reset()); await p.waitForTimeout(400); };
const actAs = async (p, name) => { if (!(await p.$('[data-screen-label="00 Sign in"]'))) { await p.click('button[aria-label="Account menu"]'); await p.waitForTimeout(200); await p.click('button:has-text("Switch account")'); await p.waitForTimeout(400); } await p.click('[data-screen-label="00 Sign in"] button:has-text("' + name + '")'); await p.waitForTimeout(700); };
const goTo = async (p, section, tab) => { await p.locator('aside nav a:has-text("' + section + '")').first().click(); await p.waitForTimeout(500); if (tab) { await p.locator('header [role=tablist] a:has-text("' + tab + '")').first().click(); await p.waitForTimeout(600); } };
async function adminShellAndOverview(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p); await p.reload(); await p.waitForTimeout(2500);
  const O = '[data-screen-label="08 Overview"]';
  h.ok('P: overview has 4 role KPI tiles for the admin', (await h.count(p, O + ' .ux-tile')) === 4 && await h.has(p, O, 'Waiting for your review') && await h.has(p, O, 'Good '));
  h.ok('P: admin to-do shows the activation waiting for her', await h.has(p, O + ' .ux-card:has-text("Your to-do")', 'PARCO review & activation') && await h.has(p, O + ' .ux-card:has-text("Your to-do")', 'ready to invite from SAP'));
  h.ok('P: end-to-end flow with 7 stages and charts', (await h.count(p, O + ' .ux-step')) === 7 && (await h.count(p, O + ' .ux-bar')) === 8);
  await p.click(O + ' .ux-seg button:has-text("Overdue")'); await p.waitForTimeout(300);
  h.ok('P: queue filter Overdue', (await h.count(p, O + ' .ux-card:has-text("Everything due") .ux-row')) === 1); await p.click(O + ' .ux-seg button:has-text("All")'); await p.waitForTimeout(300);
  h.ok('P: needs-attention lists due items with reminders', (await h.count(p, O + ' button:has-text("Send reminder")')) >= 4);
  h.ok('P: acting user shown', await h.has(p, 'header', 'Ayesha Khan') && await h.has(p, 'header', 'PARCO Admin'));
  await p.screenshot({ path: h.SHOTS + '/p-overview.png' });
  await actAs(p, 'Hassan Malik');
  h.ok('P: approver dashboard is about his approvals', await h.has(p, O, 'Waiting for you') && await h.has(p, O + ' .ux-card:has-text("Your to-do")', 'PARCO-DSP-00081') && await h.has(p, O, 'Your decisions by channel'));
  h.ok('P: approver sign-in scopes the navigation', !(await h.has(p, 'aside nav', 'Finance')) && !(await h.has(p, 'aside nav', 'Setup')) && await h.has(p, 'aside nav', 'Approvals') && await h.has(p, 'header', 'Hassan Malik'));
  await goTo(p, 'Vendors');
  h.ok('P: approver has no Onboarding tab (single Vendors screen, no tab row)', !(await h.has(p, 'header', 'Onboarding')) && (await h.count(p, 'header [role=tablist]')) === 0 && (await h.count(p, '[data-screen-label="08 Vendors"]')) === 1);
  await actAs(p, 'Ayesha Khan'); await goTo(p, 'Vendors');
  h.ok('P: admin sign-in restores Finance, Setup and the Onboarding tab', await h.has(p, 'aside nav', 'Finance') && await h.has(p, 'aside nav', 'Setup') && await h.has(p, 'header [role=tablist]', 'Onboarding'));
  await p.reload(); await p.waitForTimeout(2500);
  h.ok('P: session survives a reload (no sign-in screen)', (await h.count(p, '[data-screen-label="00 Sign in"]')) === 0 && await h.has(p, 'header', 'Ayesha Khan'));
  await p.close();
}
async function adminOnboardingDetail(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p); await goTo(p, 'Vendors', 'Onboarding');
  const S = '[data-screen-label="08 Vendor Onboarding"]';
  h.ok('P: onboarding table 4 requests', (await h.count(p, S + ' tbody tr')) === 4);
  await p.click(S + ' tbody tr:has-text("ONB-00041")'); await p.waitForTimeout(600);
  h.ok('P: ONB-00041 detail shows both channels pending', (await h.count(p, S + ' span:has-text("Pending")')) >= 2 && await h.has(p, S, 'Coastal Civil Works'));
  h.ok('P: SAP-prefilled form shows Missing in SAP', await h.has(p, S, 'Missing in SAP'));
  h.ok('P: channel vendor-view links present', (await h.count(p, S + ' .ob-ch a:has-text("Vendor view")')) === 2 && (await h.count(p, S + ' .ob-track .ob-st')) === 4);
  await p.screenshot({ path: h.SHOTS + '/p-onboarding-detail.png' });
  await p.click(S + ' tbody tr:has-text("ONB-00040")'); await p.waitForTimeout(500);
  h.ok('P: accepted request shows lock banner + review actions', await h.has(p, S, 'already accepted via Magic link') && (await h.count(p, S + ' .ux-dr-foot button:has-text("Activate vendor")')) === 1 && await h.has(p, S + ' .ux-dr-foot', 'Your review'));
  await p.click(S + ' .ux-dr-foot button:has-text("Activate vendor")'); await p.waitForTimeout(600);
  h.ok('P: activation works and prompts concerned person', await h.has(p, S, 'Active') && await h.has(p, S, 'Not assigned yet'));
  await p.click(S + ' button:has-text("Assign / reassign Concerned Person")'); await p.waitForTimeout(300);
  await p.fill(S + ' input[placeholder="e.g. Initial assignment"]', 'Initial assignment after activation');
  await p.click(S + ' button:has-text("Save")'); await p.waitForTimeout(600);
  h.ok('P: concerned person assigned with history', await h.has(p, S, 'Farhan Siddiqui'));
  await p.close();
}
async function adminInviteWizard(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p); await goTo(p, 'Vendors', 'Onboarding');
  await p.click('button:has-text("Invite vendor")'); await p.waitForTimeout(400);
  const W = 'div[role=dialog]';
  await p.fill(W + ' input[placeholder^="Search by SAP"]', 'Lahore'); await p.waitForTimeout(300);
  h.ok('P: wizard search finds SAP vendor', (await h.count(p, W + ' button:has-text("V-1000238")')) === 1 && (await h.count(p, W + ' button:has-text("V-1000236")')) === 0);
  await p.click(W + ' button:has-text("V-1000238")'); await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(300);
  await p.click(W + ' button:has-text("Services —")'); await p.waitForTimeout(200);
  await p.fill(W + ' .ux-svp input', 'calibration'); await p.waitForTimeout(250);
  h.ok('P: service search narrows a 100+ service master', (await h.count(p, W + ' .ux-svrow')) < 10 && await h.has(p, W, 'Showing') && await h.has(p, W, 'of 105'));
  await p.click(W + ' .ux-svrow:has-text("SVC-CAL-04")'); await p.click(W + ' .ux-svp .clr'); await p.waitForTimeout(200); await p.click(W + ' .ux-cat:has-text("Inspection")'); await p.waitForTimeout(200); await p.click(W + ' .ux-svrow:has-text("SVC-INSP-03")'); await p.waitForTimeout(200);
  h.ok('P: multi-select services', await h.has(p, W, '2 selected'));
  await p.screenshot({ path: h.SHOTS + '/p-wizard-step2.png' });
  await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(300);
  h.ok('P: contact prefilled from SAP', (await p.locator(W + ' input[placeholder="name@example.com"]').inputValue()) === 'usman.lis@example.com');
  await p.fill(W + ' input[placeholder="Name"]', 'Hira Baig (Demo)'); await p.fill(W + ' input[placeholder="email@example.com"]', 'hira.lis@example.com'); await p.click(W + ' button:has-text("Add user")'); await p.waitForTimeout(200);
  await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(300);
  h.ok('P: both channels on by default', (await h.count(p, W + ' :text("check_box")')) >= 2);
  await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(300);
  h.ok('P: summary shows one shared decision', await h.has(p, W, 'one shared decision'));
  await p.click(W + ' button:has-text("Send invitation")'); await p.waitForTimeout(600);
  h.ok('P: invitation sent', await h.has(p, W, 'Invitation sent · ONB-00042'));
  await p.click(W + ' button:has-text("View request")'); await p.waitForTimeout(500);
  const S = '[data-screen-label="08 Vendor Onboarding"]';
  h.ok('P: new request listed awaiting response', (await h.count(p, S + ' tbody tr')) === 5 && await h.has(p, S, 'Lahore Instrumentation'));
  await p.click('button:has-text("Invite vendor")'); await p.waitForTimeout(300); await p.fill(W + ' input[placeholder^="Search by SAP"]', 'Lahore'); await p.waitForTimeout(300);
  h.ok('P: duplicate active invitation prevented', (await h.count(p, W + ' button:has-text("V-1000238")')) === 0);
  await p.close();
}
async function emailActionApproval(ctx, h) {
  let p = await h.open(ctx, 'admin.html'); await reset(p); await p.close();
  p = await h.open(ctx, 'admin.html', '?task=T-00081-1&channel=email');
  const E = '[data-screen-label="08 Email Action"]';
  h.ok('P: email action page standalone (no sidebar)', (await h.count(p, 'aside')) === 0 && await h.has(p, E, 'Level 1 approver') && await h.has(p, E, 'Hassan Malik'));
  h.ok('P: SAP data prefilled on email page', await h.has(p, E, '4500012345') && await h.has(p, E, 'DN-58931'));
  await p.screenshot({ path: h.SHOTS + '/p-email-action.png' });
  await p.click(E + ' button:has-text("Accept")'); await p.waitForTimeout(600);
  h.ok('P: accept via email locks the page', await h.has(p, E, 'already approved via Email') && (await h.count(p, E + ' button:has-text("Accept")')) === 0);
  await p.reload(); await p.waitForTimeout(2500);
  h.ok('P: decision persists after reload', await h.has(p, E, 'already approved via Email'));
  await p.close();
  p = await h.open(ctx, 'admin.html', '?task=T-00081-2&channel=email');
  h.ok('P: level 2 email link now active for Sana', await h.has(p, E, 'Level 2 approver') && (await h.count(p, E + ' button:has-text("Accept")')) === 1);
  await p.click(E + ' button:has-text("Reject")'); await p.waitForTimeout(200); await p.click(E + ' button:has-text("Confirm rejection")'); await p.waitForTimeout(400);
  h.ok('P: reject requires a reason', await h.has(p, 'body', 'reason is required'));
  await p.fill(E + ' textarea', 'Gate pass photo unreadable'); await p.click(E + ' button:has-text("Confirm rejection")'); await p.waitForTimeout(500);
  h.ok('P: level 2 rejected with reason', await h.has(p, E, 'already rejected via Email'));
  await reset(p); await p.close();
}
async function adminVendorsAuditNotifications(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p); await goTo(p, 'Vendors', 'Directory');
  const V = '[data-screen-label="08 Vendors"]';
  h.ok('P: vendors table lists the SAP vendors', (await h.count(p, V + ' tbody tr')) === 11 && await h.has(p, V, 'Showing 1–11 of 11'));
  await p.click(V + ' tbody tr:has-text("V-1000236")'); await p.waitForTimeout(600);
  h.ok('P: vendor detail with ATL and concerned person', await h.has(p, V, 'Indus Technical') && await h.has(p, V, 'ATL — Active Taxpayer List') && await h.has(p, V, 'Farhan Siddiqui') && !(await h.has(p, 'body', 'ATS')));
  await p.screenshot({ path: h.SHOTS + '/p-vendor-detail.png' });
  await p.click(V + ' button:has-text("People & access")'); await p.waitForTimeout(300);
  h.ok('P: people tab lists vendor users with roles', await h.has(p, V, 'Vendor Organization Admin') && await h.has(p, V, 'Vendor Finance'));
  await p.click(V + ' button:has-text("Contact & activity log")'); await p.waitForTimeout(300);
  await p.click(V + ' button:has-text("Log call")'); await p.fill(V + ' textarea', 'Called Lena about dispatch DSP-00081 evidence'); await p.click(V + ' button:has-text("Save")'); await p.waitForTimeout(500);
  h.ok('P: contact log entry added and audited', await h.has(p, V, 'Called Lena about dispatch') && await h.has(p, V, 'Contact logged (CALL)'));
  await p.click(V + ' button:has-text("Invoices & submissions")'); await p.waitForTimeout(300);
  h.ok('P: docs tab shows on-behalf invoice attribution', await h.has(p, V, 'PARCO on behalf · Farhan Siddiqui'));
  await p.locator(V + ' button:has-text("View PDF")').first().click(); await p.waitForTimeout(800);
  const src = await p.evaluate(() => { const f = document.querySelector('div[role=dialog] iframe'); return f ? f.getAttribute('src') : ''; });
  h.ok('P: View PDF opens real blob PDF viewer', src.startsWith('blob:'));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('div[role=dialog] button:has-text("Download PDF")')]);
  h.ok('P: Download PDF produces a file', !!dl && /\.pdf$/.test(dl.suggestedFilename()), dl ? dl.suggestedFilename() : 'no download');
  await p.click('div[role=dialog] button[aria-label="Close"]'); await p.waitForTimeout(300);
  await goTo(p, 'Activity', 'Audit & contact logs');
  const A = '[data-screen-label="08 Audit & Contact Logs"]';
  const n = await h.count(p, A + ' tbody tr');
  h.ok('P: audit log populated', n >= 20, 'rows=' + n);
  await p.selectOption(A + ' select >> nth=0', 'V-1000237'); await p.waitForTimeout(400);
  h.ok('P: audit filter by vendor', (await h.count(p, A + ' tbody tr')) < n && await h.has(p, A, 'Coastal Civil Works'));
  await goTo(p, 'Activity', 'Notifications & reminders');
  const N = '[data-screen-label="08 Notifications & Reminders"]';
  h.ok('P: notifications due items + reminder history', (await h.count(p, N + ' button:has-text("Send reminder")')) >= 4 && (await h.count(p, N + ' tbody tr')) >= 1);
  await p.close();
}
module.exports = { adminShellAndOverview, adminOnboardingDetail, adminInviteWizard, emailActionApproval, adminVendorsAuditNotifications };

async function supplyTwoPersonApproval(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p);
  await actAs(p, 'Hassan Malik'); await goTo(p, 'Approvals', 'Supply');
  const S = '[data-screen-label="08 Supply Approvals"]';
  h.ok('P: supply approvals lists DSP-00081 pending L1', (await h.count(p, S + ' tbody tr:has-text("PARCO-DSP-00081")')) === 1);
  await p.click(S + ' tbody tr:has-text("PARCO-DSP-00081")'); await p.waitForTimeout(600);
  h.ok('P: L1 approver sees Accept on level 1 only', (await h.count(p, S + ' button:has-text("Accept")')) === 1 && await h.has(p, S, 'SAP-prefilled data') && await h.has(p, S, 'Stretch Wrap Film'));
  await p.screenshot({ path: h.SHOTS + '/p-supply-detail.png' });
  await p.click(S + ' button:has-text("Accept")'); await p.waitForTimeout(600);
  h.ok('P: after L1 → pending level 2, L2 not mine', await h.has(p, S, 'Pending Level 2') && await h.has(p, S, 'Only Sana Ahmed (Demo) can decide'));
  await actAs(p, 'Sana Ahmed'); await goTo(p, 'Approvals', 'Supply'); await p.click(S + ' tbody tr:has-text("PARCO-DSP-00081")'); await p.waitForTimeout(500);
  h.ok('P: L2 approver can accept', (await h.count(p, S + ' button:has-text("Accept")')) === 1 && !(await h.has(p, S, 'Simulate SAP GR')));
  await p.click(S + ' button:has-text("Accept")'); await p.waitForTimeout(600);
  h.ok('P: fully approved → awaiting SAP, not posted', await h.has(p, S, 'Approved · awaiting SAP') && await h.has(p, S, 'Awaiting goods receipt in SAP') && await h.has(p, S, 'Not available from SAP'));
  await actAs(p, 'Ayesha Khan'); await goTo(p, 'Approvals', 'Supply'); await p.click(S + ' button:has-text("All submissions")'); await p.waitForTimeout(300); await p.click(S + ' tbody tr:has-text("PARCO-DSP-00081")'); await p.waitForTimeout(500);
  await p.click(S + ' button:has-text("Simulate SAP GR confirmation")'); await p.waitForTimeout(600);
  h.ok('P: simulated GR confirmation → ready for invoice with SAP doc', await h.has(p, S, 'Ready for invoice') && await h.has(p, S, 'Goods receipt posted') && await h.has(p, S, '/ 2026'));
  await goTo(p, 'Activity', 'Audit & contact logs');
  const A = '[data-screen-label="08 Audit & Contact Logs"]';
  await p.fill(A + ' input[placeholder^="Search action"]', 'PARCO-DSP-00081'); await p.waitForTimeout(400);
  h.ok('P: audit has L1, L2 and SAP events for the dispatch', (await h.count(p, A + ' tbody tr')) >= 4 && await h.has(p, A, 'simulated SAP event'));
  await p.close();
}
async function sodAndServices(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p);
  await actAs(p, 'Hassan Malik'); await goTo(p, 'Approvals', 'Services');
  const S = '[data-screen-label="08 Service Approvals"]';
  await p.click(S + ' tbody tr:has-text("PARCO-SRV-000112")'); await p.waitForTimeout(500);
  h.ok('P: SoD — Hassan already decided L1, cannot act on L2', (await h.count(p, S + ' button:not(.dis):has-text("Accept")')) === 0 && (await h.count(p, S + ' .ux-dr-foot button.dis:has-text("Accept")')) === 1 && await h.has(p, S, 'Only Sana Ahmed (Demo) can decide') && await h.has(p, S, 'Client Request Number'));
  await actAs(p, 'Ayesha Khan'); await goTo(p, 'Approvals', 'Services');
  h.ok('P: client requests table lists 3 CRs', (await p.locator(S + ' table').nth(1).locator('tbody tr').count()) === 3);
  await p.click(S + ' button:has-text("Issue client request")'); await p.waitForTimeout(300);
  await p.selectOption(S + ' select >> nth=0', 'V-1000236'); await p.waitForTimeout(200);
  const svcOpts = await p.locator(S + ' select').nth(1).innerText(); h.ok('P: service options limited to the vendor’s enabled services', svcOpts.includes('Equipment Inspection') && !svcOpts.includes('Civil Maintenance'));
  await p.selectOption(S + ' select >> nth=1', 'SVC-MECH-01'); await p.fill(S + ' input[placeholder="45000124xx"]', '4500012440'); await p.locator(S + ' label:has-text("PARCO site") input').fill('Korangi Terminal (Demo site)'); await p.locator(S + ' button:text-is("Issue")').click(); await p.waitForTimeout(600);
  h.ok('P: client request issued by PARCO', (await p.locator(S + ' table').nth(1).locator('tbody tr').count()) === 4 && await h.has(p, S, 'PARCO (issued in portal)'));
  await goTo(p, 'Setup', 'Services master data');
  const M = '[data-screen-label="08 Services Master Data"]';
  const nSvc = await h.count(p, M + ' tbody tr'); h.ok('P: services master lists the SAP service master (100+)', nSvc >= 100);
  await p.click(M + ' tbody tr:has-text("SVC-MECH-01")'); await p.waitForTimeout(400);
  h.ok('P: SAP-owned service read-only with 2 eligible vendors', await h.has(p, M, 'SAP-owned master record') && (await h.count(p, M + ' a:has-text("V-1000")')) === 2);
  await p.click(M + ' button:has-text("Add service")'); await p.fill(M + ' label:has-text("Service name") input', 'Heliport Maintenance (Demo)'); await p.click(M + ' button:has-text("Save")'); await p.waitForTimeout(500);
  h.ok('P: PARCO-added service labelled and listed', (await h.count(p, M + ' tbody tr')) === nSvc + 1 && await h.has(p, M, 'Heliport Maintenance'));
  await p.screenshot({ path: h.SHOTS + '/p-services-master.png' });
  await p.close();
}
async function concernedPersonOnBehalf(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p);
  await actAs(p, 'Farhan Siddiqui');
  await goTo(p, 'Vendors');
  h.ok('P: concerned person nav is scoped', await h.has(p, 'header [role=tablist]', 'Assigned to me') && !(await h.has(p, 'aside nav', 'Finance')) && !(await h.has(p, 'aside nav', 'Approvals')));
  await goTo(p, 'Vendors', 'Assigned to me');
  const G = '[data-screen-label="08 Assigned Vendors"]';
  h.ok('P: Farhan sees only his 2 assigned vendors', (await h.count(p, G + ' button:has-text("Upload invoice on behalf")')) === 2 && await h.has(p, G, 'Karachi Industrial') && await h.has(p, G, 'Indus Technical') && !(await h.has(p, G, 'Sindh Field')));
  await p.locator(G + ' > div > div:has-text("Indus Technical") button:has-text("Upload invoice on behalf")').first().click(); await p.waitForTimeout(400);
  h.ok('P: on-behalf form opens with attribution warning', await h.has(p, G, 'Acting on behalf of a vendor') && await h.has(p, G, 'never as if the vendor uploaded it'));
  await p.click(G + ' button:has-text("Submit on behalf of vendor")'); await p.waitForTimeout(400);
  h.ok('P: validation blocks missing reference', await h.has(p, 'body', 'Invoice reference missing'));
  await p.fill(G + ' input[placeholder="Vendor\'s invoice number"]', 'INV-DEMO-2026-094'); await p.locator(G + ' label:has-text("Gross amount") input').fill('250000'); await p.locator(G + ' label:has-text("SAP PO") input').fill('4500012345');
  await p.click(G + ' button:has-text("Submit on behalf of vendor")'); await p.waitForTimeout(400);
  h.ok('P: validation requires PDF then reason', await h.has(p, 'body', 'Attach the invoice PDF'));
  await p.click(G + ' button:has-text("Attach invoice PDF")'); await p.click(G + ' button:has-text("Submit on behalf of vendor")'); await p.waitForTimeout(400);
  h.ok('P: reason required for on-behalf upload', await h.has(p, 'body', 'A reason is required'));
  await p.fill(G + ' input[placeholder^="e.g. Vendor requested help"]', 'Vendor finance user on leave — requested by phone'); await p.fill(G + ' input[placeholder^="e.g. Email from vendor admin"]', 'Call with Lena Marsh, 29-Oct-2026');
  await p.click(G + ' button:has-text("Submit on behalf of vendor")'); await p.waitForTimeout(800);
  const V = '[data-screen-label="08 Vendors"]';
  h.ok('P: on-behalf invoice created and attributed to Farhan', await h.has(p, V, 'INV-DEMO-2026-094') && await h.has(p, V, 'PARCO on behalf · Farhan Siddiqui'));
  await p.screenshot({ path: h.SHOTS + '/p-onbehalf-result.png' });
  await p.close();
}
async function financeAndPayments(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p);
  await actAs(p, 'Bilal Raza'); await goTo(p, 'Finance', 'Invoices');
  const F = '[data-screen-label="08 Finance & Invoices"]';
  h.ok('P: finance lists 3 invoices with ATL and WHT columns', (await h.count(p, F + ' tbody tr')) === 3 && await h.has(p, F + ' thead', 'ATL') && await h.has(p, F + ' thead', 'WHT'));
  await p.click(F + ' tbody tr:has-text("INV-DEMO-2026-092")'); await p.waitForTimeout(500);
  h.ok('P: on-behalf invoice shows attribution and awaiting SAP tax data', await h.has(p, F, 'Uploaded by PARCO on behalf of the vendor') && await h.has(p, F, 'Awaiting SAP tax data'));
  await p.click(F + ' button:has-text("Mark under review")'); await p.waitForTimeout(500);
  h.ok('P: finance status action works', await h.has(p, F, 'Under review'));
  await p.click(F + ' tbody tr:has-text("INV-DEMO-2026-093")'); await p.waitForTimeout(500);
  h.ok('P: WHT breakdown from SAP tax data', await h.has(p, F, '8.00 %') && await h.has(p, F, '754,400.00 PKR') && await h.has(p, F, 'SAP tax data (simulated)'));
  await p.screenshot({ path: h.SHOTS + '/p-finance-detail.png' });
  await goTo(p, 'Finance', 'Payment insight');
  const Y = '[data-screen-label="08 Payment Insight"]';
  h.ok('P: payment insight lists scheduled invoice with planned run', (await h.count(p, Y + ' tbody tr')) >= 1 && await h.has(p, Y, '05-Nov-2026 (planned)') && await h.has(p, Y, 'Not available from SAP'));
  await p.locator(Y + ' button:has-text("View PDF")').first().click(); await p.waitForTimeout(800);
  h.ok('P: payment PDF viewer opens', (await p.evaluate(() => { const f = document.querySelector('div[role=dialog] iframe'); return f ? f.getAttribute('src') : ''; })).startsWith('blob:'));
  await p.close();
}
module.exports = Object.assign(module.exports, { supplyTwoPersonApproval, sodAndServices, concernedPersonOnBehalf, financeAndPayments });

async function supplierSharedOnboardingStatus(ctx, h) {
  let p = await h.open(ctx, 'index.html'); await reset(p); await p.close();
  p = await h.open(ctx, 'index.html', '?onboarding=ONB-00041&channel=email');
  const E = '[data-screen-label="01 Onboarding · Email Action"]';
  h.ok('S: email action page shows PARCO invitation with prefilled SAP data', await h.has(p, E, 'Coastal Civil Works') && await h.has(p, E, 'Civil Maintenance') && await h.has(p, E, 'Missing in SAP') && (await h.count(p, E + ' button:has-text("Accept onboarding")')) === 1);
  h.ok('S: both channels pending on the email page', (await h.count(p, E + ' span:has-text("Pending")')) >= 2);
  await p.screenshot({ path: h.SHOTS + '/s-onboarding-email.png' });
  await p.click(E + ' button:has-text("Accept onboarding")'); await p.waitForTimeout(700);
  h.ok('S: accept via email locks the email page', await h.has(p, E, 'already accepted via Email') && (await h.count(p, E + ' button:has-text("Accept onboarding")')) === 0);
  await p.close();
  p = await h.open(ctx, 'index.html', '?onboarding=ONB-00041&channel=portal');
  const M = '[data-screen-label="01 Onboarding · Magic Link"]';
  h.ok('S: magic link now read-only: already accepted via Email', await h.has(p, M, 'already accepted via Email') && (await h.count(p, M + ' button:has-text("Accept onboarding")')) === 0 && await h.has(p, M, 'Locked · decided via Email'));
  await p.screenshot({ path: h.SHOTS + '/s-onboarding-portal-locked.png' });
  await p.close();
  p = await h.open(ctx, 'admin.html'); await goTo(p, 'Vendors', 'Onboarding');
  const A = '[data-screen-label="08 Vendor Onboarding"]';
  h.ok('A: admin immediately sees Vendor accepted · channel Email', await h.has(p, A + ' tbody tr:has-text("ONB-00041")', 'Vendor accepted') && await h.has(p, A + ' tbody tr:has-text("ONB-00041")', 'Accepted here'));
  await p.close();
  // second fixture: accept via magic link, then email is locked
  p = await h.open(ctx, 'index.html', '?onboarding=ONB-00040&channel=portal');
  h.ok('S: ONB-00040 was accepted via portal (fixture) → shown decided', await h.has(p, M, 'already accepted via Portal'));
  await p.close();
  p = await h.open(ctx, 'index.html', '?onboarding=ONB-00040&channel=email');
  h.ok('S: ONB-00040 email action cannot reject afterwards', (await h.count(p, E + ' button:has-text("Reject")')) === 0 && await h.has(p, E, 'already accepted via Portal'));
  await reset(p); await p.close();
}
async function supplierSupplyAndServices(ctx, h) {
  const p = await h.open(ctx, 'index.html'); await reset(p); await h.login(p);
  const D = '[data-screen-label="02 Dashboard"]';
  h.ok('S: dashboard shows PARCO supply & services panel', await h.has(p, D, 'Supply & services with PARCO') && await h.has(p, D, 'Supply + Services'));
  await p.click('aside nav a:has-text("Workflow")'); await p.waitForTimeout(800);
  const T = '[data-screen-label="03 Workflow"]';
  h.ok('S: one Workflow screen with SAP documents, Supply and Services tabs (Both capability)', (await h.count(p, T + ' [role=tab]')) === 3 && await h.has(p, T, 'Supply dispatches') && await h.has(p, T, 'Service work'));
  await p.click(T + ' [role=tab]:has-text("Supply dispatches")'); await p.waitForTimeout(800);
  const S = '[data-screen-label="03 Supply Workflow"]';
  h.ok('S: existing dispatch listed pending L1', await h.has(p, S + ' tbody tr:has-text("PARCO-DSP-00081")', 'Pending Level 1'));
  await p.click(S + ' button:has-text("New dispatch")'); await p.waitForTimeout(300);
  await p.click(S + ' button:has-text("PO 4500012345")'); await p.waitForTimeout(300);
  h.ok('S: PO lines prefilled from SAP read-only', await h.has(p, S, 'Stretch Wrap Film') && (await h.text(p, S)).toLowerCase().includes('undelivered'));
  await p.locator(S + ' tbody tr:has-text("Pallet Labels") input').fill('6000'); await p.waitForTimeout(200);
  h.ok('S: over-quantity flagged', (await p.locator(S + ' tbody tr:has-text("Pallet Labels") input').evaluate(e => getComputedStyle(e).borderColor)) === 'rgb(194, 65, 12)');
  await p.locator(S + ' tbody tr:has-text("Pallet Labels") input').fill('2000'); await p.fill(S + ' input[placeholder="e.g. DN-58940"]', 'DN-58940'); await p.click(S + ' button:has-text("Add file")'); await p.waitForTimeout(200);
  await p.click(S + ' button:has-text("Submit dispatch for PARCO approval")'); await p.waitForTimeout(800);
  h.ok('S: dispatch submitted and detail shows two-person approval pending L1', await h.has(p, S, 'PARCO-DSP-00082') && await h.has(p, S, 'Level 1 · Hassan Malik') && await h.has(p, S, 'Awaiting decision'));
  await p.screenshot({ path: h.SHOTS + '/s-supply-detail.png' });
  await p.click(T + ' [role=tab]:has-text("Service work")'); await p.waitForTimeout(800);
  const V = '[data-screen-label="03 Services Workflow"]';
  h.ok('S: services shows enabled services and 2 client requests', await h.has(p, V, 'Equipment Inspection') && (await p.locator(V + ' table').nth(0).locator('tbody tr').count()) === 2 && await h.has(p, V, 'Mehmoodkot'));
  await p.click(V + ' button:has-text("New service order")'); await p.waitForTimeout(300);
  await p.locator(V + ' .ux-drawer select').first().selectOption('SVC-INSP-03'); await p.fill(V + ' input[placeholder="e.g. PARCO-CR-000412"]', 'PARCO-CR-999999'); await p.click(V + ' button:has-text("Verify reference")'); await p.waitForTimeout(250);
  h.ok('S: wrong PARCO reference stops the vendor', await h.has(p, V, 'reference number is incorrect') && (await h.count(p, V + ' button:has-text("Submit for PARCO approval")')) === 0);
  await p.fill(V + ' input[placeholder="e.g. PARCO-CR-000412"]', 'PARCO-CR-000413'); await p.click(V + ' button:has-text("Verify reference")'); await p.waitForTimeout(250);
  h.ok('S: reference for another service is rejected', await h.has(p, V, 'not the service you selected'));
  await p.fill(V + ' input[placeholder="e.g. PARCO-CR-000412"]', 'parco-cr-000412'); await p.click(V + ' button:has-text("Verify reference")'); await p.waitForTimeout(250);
  h.ok('S: correct reference unlocks the order with SAP PO data', await h.has(p, V, 'Reference verified · PARCO-CR-000412') && await h.has(p, V, '4500012388 / 00020'));
  h.ok('S: ATL defaults to the PARCO record and asks which WHT applies', await h.has(p, V, 'Which withholding tax applies'));
  await p.click(V + ' button:has-text("Add file")'); await p.click(V + ' button:has-text("Submit for PARCO approval")'); await p.waitForTimeout(300);
  h.ok('S: ATL vendor must choose a WHT category', (await p.evaluate(() => PARCO.load().submissions.filter(s => s.crId === 'PARCO-CR-000412').length)) === 0);
  await p.locator(V + ' .ux-drawer select').nth(1).selectOption('WHT-S2'); await p.click(V + ' button:has-text("Submit for PARCO approval")'); await p.waitForTimeout(800);
  h.ok('S: service order stores ATL declaration and WHT', JSON.stringify(await p.evaluate(() => { const s = PARCO.load().submissions.find(x => x.crId === 'PARCO-CR-000412'); return s && [s.atlDeclared, s.wht.code, s.wht.rate]; })) === '[true,"WHT-S2",0.11]');
  h.ok('S: concurrent service submission created while supply pending', await h.has(p, V, 'PARCO-SRV-000113') && await h.has(p, V, 'Level 1 · Hassan Malik'));
  await p.close();
  const a = await h.open(ctx, 'admin.html'); await goTo(a, 'Approvals', 'Supply');
  h.ok('A: admin sees the new dispatch pending Level 1', await h.has(a, '[data-screen-label="08 Supply Approvals"]', 'PARCO-DSP-00082'));
  await reset(a); await a.close();
}
async function supplierInvoiceAttributionAndProfile(ctx, h) {
  const p = await h.open(ctx, 'index.html'); await reset(p); await h.login(p);
  await p.click('aside nav a:has-text("Workflow")'); await p.waitForTimeout(1000);
  const W = '[data-screen-label="03 Supplier Workflow"]';
  await p.fill(W + ' input[placeholder^="Search by SAP"]', 'INV-DEMO-2026-092'); await p.waitForTimeout(500);
  h.ok('S: on-behalf invoice visible in workflow with attribution', (await h.count(p, W + ' tbody tr')) === 1 && await h.has(p, W, 'Uploaded by PARCO on your behalf'));
  await p.click(W + ' tbody tr:has-text("INV-DEMO-2026-092")'); await p.waitForTimeout(900);
  const I = '[data-screen-label="05 Invoice Detail"]';
  h.ok('S: invoice detail shows real PARCO uploader attribution', await h.has(p, I, 'Uploaded by PARCO on your behalf') && await h.has(p, I, 'Farhan Siddiqui (Demo)') && await h.has(p, I, 'finance user on leave'));
  h.ok('S: WHT block present with awaiting SAP tax data', await h.has(p, I, 'WHT — Withholding Tax') && await h.has(p, I, 'Awaiting SAP tax data'));
  await p.screenshot({ path: h.SHOTS + '/s-invoice-onbehalf.png' });
  await p.click('text=Payment Insight'); await p.waitForTimeout(1000);
  const P = '[data-screen-label="06 Payment Insight"]';
  h.ok('S: payment insight lists registry invoice with PDF actions', (await h.count(p, P + ' tbody tr:has-text("INV-DEMO-2026-093") button:has-text("View PDF")')) === 1);
  await p.locator(P + ' tbody tr:has-text("INV-DEMO-2026-093") button:has-text("View PDF")').click(); await p.waitForTimeout(800);
  h.ok('S: View PDF opens blob viewer', (await p.evaluate(() => { const f = document.querySelector('div[role=dialog] iframe'); return f ? f.getAttribute('src') : ''; })).startsWith('blob:'));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('div[role=dialog] button:has-text("Download PDF")')]);
  h.ok('S: Download PDF produces file', !!dl && dl.suggestedFilename() === 'INV-DEMO-2026-093-payment-statement.pdf');
  await p.click('div[role=dialog] button[aria-label="Close"]'); await p.waitForTimeout(300);
  await p.click('text=Profile'); await p.waitForTimeout(800);
  const F = '[data-screen-label="07 Profile"]';
  h.ok('S: profile shows NTN, ATL and concerned person', await h.has(p, F, 'NTN') && await h.has(p, F, 'ATL — Active Taxpayer List') && await h.has(p, F, 'Farhan Siddiqui (Demo)') && await h.has(p, F, 'Vendor Organization Admin') && !(await h.has(p, 'body', 'ATS')));
  await p.click(F + ' button:has-text("Request help")'); await p.fill(F + ' textarea', 'Please upload INV-DEMO-2026-095 for us, our finance user is unavailable'); await p.click(F + ' button:has-text("Send request")'); await p.waitForTimeout(600);
  h.ok('S: help request logged', await h.has(p, F, 'Your help requests') && await h.has(p, F, 'INV-DEMO-2026-095'));
  await p.click('text=Notifications'); await p.waitForTimeout(800);
  h.ok('S: notifications include PARCO on-behalf event', await h.has(p, '[data-screen-label="07 Notifications"]', 'PARCO acted on your behalf'));
  await p.close();
  const a = await h.open(ctx, 'admin.html'); await actAs(a, 'Farhan Siddiqui'); await goTo(a, 'Vendors', 'Assigned to me');
  h.ok('A: concerned person sees the vendor help request', await h.has(a, '[data-screen-label="08 Assigned Vendors"]', 'help request') && await h.has(a, '[data-screen-label="08 Assigned Vendors"]', 'INV-DEMO-2026-095'));
  await reset(a); await a.close();
}
module.exports = Object.assign(module.exports, { supplierSharedOnboardingStatus, supplierSupplyAndServices, supplierInvoiceAttributionAndProfile });
async function quickSearch(ctx, h) {
  const a = await h.open(ctx, 'admin.html'); await reset(a); await a.reload(); await a.waitForTimeout(2500);
  await a.keyboard.press('Control+k'); await a.waitForTimeout(400);
  h.ok('P: Ctrl+K opens quick search with screens and actions', (await h.count(a, '.ux-cmd .ux-cmd-item')) >= 8 && await h.has(a, '.ux-cmd', 'Invite a vendor from SAP'));
  await a.keyboard.type('DSP-00081'); await a.waitForTimeout(300); await a.keyboard.press('Enter'); await a.waitForTimeout(900);
  h.ok('P: quick search opens the dispatch in Supply approvals', (await h.count(a, '.ux-cmd')) === 0 && await h.has(a, '[data-screen-label="08 Supply Approvals"]', 'SAP-prefilled data'));
  await a.close();
  const p = await h.open(ctx, 'index.html'); await h.login(p);
  await p.click('header .ux-search'); await p.waitForTimeout(400); await p.keyboard.type('4500012410'); await p.waitForTimeout(300);
  h.ok('S: vendor quick search finds the PO', await h.has(p, '.ux-cmd', 'PO 4500012410'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  h.ok('S: quick search opens the PO detail', (await h.count(p, '[data-screen-label="04 PO Detail"]')) === 1);
  await p.close();
}
module.exports = Object.assign(module.exports, { quickSearch });
async function flowGuideAndInviteStep3(ctx, h) {
  const p = await h.open(ctx, 'admin.html'); await reset(p); await p.reload(); await p.waitForTimeout(2500);
  await p.click('aside a:has-text("Flow guide")'); await p.waitForTimeout(600);
  const G = '[data-screen-label="08 Flow Guide"]';
  h.ok('P: flow guide lists the whole flow', (await h.count(p, G + ' .gd-step')) === 13 && await h.has(p, G, 'Invite a vendor from SAP'));
  await p.click(G + ' .gd-roles button:has-text("Approvers")'); await p.waitForTimeout(300);
  h.ok('P: flow guide filters by role', (await h.count(p, G + ' .gd-step')) === 4 && await h.has(p, G + ' .gd-det', 'The vendor submits work'));
  await p.click(G + ' .gd-det button:has-text("Next step")'); await p.waitForTimeout(300);
  h.ok('P: flow guide next step', await h.has(p, G + ' .gd-det', 'Level 1 approval') && (await h.text(p, G + ' .gd-det')).toLowerCase().includes('step 2 of 4'));
  await p.click(G + ' .gd-det button:has-text("Open approvals")'); await p.waitForTimeout(600);
  h.ok('P: flow guide opens the real screen', (await h.count(p, '[data-screen-label="08 Supply Approvals"]')) === 1);
  // invite wizard step 3: PARCO contact person dropdown, typed vendor contact and users, carried into activation
  await goTo(p, 'Vendors', 'Onboarding'); await p.click('button:has-text("Invite vendor")'); await p.waitForTimeout(400);
  const W = 'div[role=dialog]';
  await p.click(W + ' .ux-vcard:has-text("V-1000242")'); await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(250);
  await p.click(W + ' button:has-text("Supply —")'); await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(250);
  h.ok('P: step 3 has one PARCO contact dropdown with designations', (await p.locator(W + ' .ux-f3 > section').nth(0).locator('select').count()) === 1 && (await p.locator(W + ' .ux-f3 > section').nth(0).locator('select option').allInnerTexts()).some(t => t.includes('Vendor Relationship Officer')));
  await p.locator(W + ' .ux-f3 > section').nth(0).locator('select').selectOption('u-sana');
  await p.fill(W + ' input[placeholder="Name"]', 'Mehwish Ali (Demo)'); await p.fill(W + ' input[placeholder="email@example.com"]', 'mehwish.pqm@example.com'); await p.click(W + ' .seg button:has-text("Finance")'); await p.click(W + ' button:has-text("Add user")'); await p.waitForTimeout(200);
  await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(250); await p.click(W + ' button:has-text("Continue")'); await p.waitForTimeout(250);
  h.ok('P: review shows the PARCO contact person', await h.has(p, W, 'Sana Ahmed') && await h.has(p, W, 'Mehwish Ali'));
  await p.click(W + ' button:has-text("Send invitation")'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const d = PARCO.load(); const o = d.onboarding[0]; return { plan: o.concernedPlan, users: PARCO.vendor(o.vendorId).users.length }; });
  h.ok('P: invitation stores PARCO contact and both vendor users', r.plan === 'u-sana' && r.users === 2, JSON.stringify(r));
  await reset(p); await p.close();
}
module.exports = Object.assign(module.exports, { flowGuideAndInviteStep3 });
async function tableSearchAndFilters(ctx, h) {
  const a = await h.open(ctx, 'admin.html'); await reset(a); await a.reload(); await a.waitForTimeout(2500);
  await goTo(a, 'Vendors', 'Directory'); const V = '[data-screen-label="08 Vendors"]';
  const all = await h.count(a, V + ' tbody tr');
  await a.click(V + ' .ux-tbar .ux-cat:has-text("In SAP")'); await a.waitForTimeout(250);
  h.ok('P: vendor directory status filter', (await h.count(a, V + ' tbody tr')) === 7 && all === 11);
  await a.fill(V + ' .ux-tbar input', 'Port Qasim'); await a.waitForTimeout(250);
  h.ok('P: vendor directory search + filter combine', (await h.count(a, V + ' tbody tr')) === 1 && await h.has(a, V + ' .ux-tbar', '1 of 11'));
  await goTo(a, 'Setup', 'Services master data'); const M = '[data-screen-label="08 Services Master Data"]';
  await a.selectOption(M + ' .ux-tbar select', 'Marine'); await a.waitForTimeout(250);
  h.ok('P: long filters use a dropdown (services by category)', (await h.count(a, M + ' tbody tr')) === 6);
  await a.close();
  const p = await h.open(ctx, 'index.html'); await h.login(p);
  await p.click('aside nav a:has-text("Payment Insight")'); await p.waitForTimeout(800); const P = '[data-screen-label="06 Payment Insight"]';
  await p.fill(P + ' .ux-tbar input', '0856'); await p.waitForTimeout(300);
  h.ok('S: payment insight search', (await h.count(p, P + ' tbody tr')) === 1);
  await p.close();
}
module.exports = Object.assign(module.exports, { tableSearchAndFilters });
async function taxRulesAndLockedApproval(ctx, h) {
  const a = await h.open(ctx, 'admin.html'); await reset(a); await a.reload(); await a.waitForTimeout(2500);
  await goTo(a, 'Approvals', 'Supply'); const S = '[data-screen-label="08 Supply Approvals"]';
  await a.click(S + ' tbody tr:has-text("PARCO-DSP-00081")'); await a.waitForTimeout(600);
  h.ok('P: non-assigned user sees locked Accept/Reject and a demo switch', (await h.count(a, S + ' .ux-dr-foot button.dis')) === 2 && await h.has(a, S + ' .ux-dr-foot', 'Switch to Hassan'));
  await a.click(S + ' .ux-dr-foot button:has-text("Switch to Hassan")'); await a.waitForTimeout(600);
  h.ok('P: after switching, the assigned approver can decide', (await h.count(a, S + ' .ux-dr-foot button:not(.dis):has-text("Accept")')) === 1 && await h.has(a, 'header', 'Hassan Malik'));
  await actAs(a, 'Bilal Raza'); await goTo(a, 'Vendors', 'Directory'); const V = '[data-screen-label="08 Vendors"]';
  await a.click(V + ' tbody tr:has-text("V-1000236")'); await a.waitForTimeout(600);
  h.ok('P: vendor shows its tax code rule', await h.has(a, V + ' .ux-taxr', '2 of 4 tax codes') && await h.has(a, V + ' .ux-taxr', 'default V5'));
  await a.click(V + ' .ux-taxr button:has-text("Edit rule")'); await a.click(V + ' .ux-taxopt:has-text("V0")'); await a.fill(V + ' .ux-taxr input', 'Only VAT 5% invoices'); await a.click(V + ' .ux-taxr button:has-text("Save rule")'); await a.waitForTimeout(400);
  h.ok('P: finance saves a narrower tax rule', JSON.stringify(await a.evaluate(() => PARCO.vendor('V-1000236').taxRule.codes)) === '["V5"]');
  await a.close();
  const p = await h.open(ctx, 'index.html'); await h.login(p);
  await p.locator('.ux-row:has-text("Invoice PO 4500012345") button:has-text("Create invoice")').click(); await p.waitForTimeout(800);
  const C = '[data-screen-label="05 Create Invoice"]';
  await p.locator(C + ' :text("check_box_outline_blank")').first().click(); await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(400); await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(400);
  const opts = await p.evaluate(() => [...document.querySelectorAll('select')].map(x => [...x.options].map(o => o.text)).filter(a => a.some(t => /V5|V0|VE/.test(t)))[0] || []);
  h.ok('S: vendor invoice offers only the assigned tax code, preselected', opts.length === 2 && opts[1].startsWith('V5') && await h.has(p, C, 'PARCO Finance assigned'), JSON.stringify(opts));
  await reset(p); await p.close();
}
module.exports = Object.assign(module.exports, { taxRulesAndLockedApproval });
// Full lifecycle with a vendor that is not part of the fixtures: master data → routing → invite → accept → activate → client request → work → 2 approvals → SAP → invoice-ready.
async function fullFlowNewVendor(ctx, h) {
  const a = await h.open(ctx, 'admin.html'); await reset(a); await a.reload(); await a.waitForTimeout(2500);
  const ok = h.ok;
  // 1. tax rate master data
  await goTo(a, 'Setup', 'Tax rates'); const TX = '[data-screen-label="08 Tax Rates"]';
  const nTax = await h.count(a, TX + ' tbody tr');
  await a.click(TX + ' button:has-text("Add tax rate")'); await a.waitForTimeout(300);
  await a.fill(TX + ' input[placeholder="e.g. S2"]', 's2'); await a.fill(TX + ' input[placeholder="e.g. 17"]', '17'); await a.fill(TX + ' input[placeholder^="e.g. Sales tax"]', 'Sales tax 17%');
  await a.click(TX + ' button:has-text("Save tax rate")'); await a.waitForTimeout(400);
  ok('F: tax rate added to master data', (await h.count(a, TX + ' tbody tr')) === nTax + 1 && await h.has(a, TX, '17 %'));
  await a.click(TX + ' tbody tr:has-text("V5")'); await a.waitForTimeout(300); await a.click(TX + ' button:has-text("Remove")'); await a.waitForTimeout(300);
  ok('F: tax rate used in a vendor rule cannot be removed', (await h.count(a, TX + ' tbody tr')) === nTax + 1);
  await a.click(TX + ' .ux-dr-close'); await a.waitForTimeout(200);
  // 2. services master data add / remove
  await goTo(a, 'Setup', 'Services master data'); const M = '[data-screen-label="08 Services Master Data"]';
  const nSvc = await a.evaluate(() => PARCO.load().services.length);
  await a.click(M + ' button:has-text("Add service")'); await a.fill(M + ' label:has-text("Service name") input', 'Drone Inspection (Demo)'); await a.fill(M + ' label:has-text("Category") input', 'Inspection'); await a.click(M + ' button:has-text("Save")'); await a.waitForTimeout(400);
  ok('F: service added and active', await a.evaluate(() => PARCO.load().services.some(s => s.name === 'Drone Inspection (Demo)' && s.status === 'Active')));
  await a.fill(M + ' .ux-tbar input', 'Tug Services'); await a.waitForTimeout(250); await a.click(M + ' tbody tr:has-text("SVC-MAR-010")'); await a.waitForTimeout(300); await a.click(M + ' button:has-text("Remove from master data")'); await a.waitForTimeout(300);
  ok('F: unused service removed', !(await a.evaluate(() => PARCO.load().services.some(s => s.id === 'SVC-MAR-010'))) && (await a.evaluate(() => PARCO.load().services.length)) === nSvc);
  await a.fill(M + ' .ux-tbar input', 'SVC-MECH-01'); await a.waitForTimeout(250); await a.click(M + ' tbody tr:has-text("SVC-MECH-01")'); await a.waitForTimeout(300); await a.click(M + ' button:has-text("Remove from master data")'); await a.waitForTimeout(300);
  ok('F: service in use cannot be removed', await a.evaluate(() => PARCO.load().services.some(s => s.id === 'SVC-MECH-01')));
  // 3. approval routing
  await goTo(a, 'Setup', 'Approval routing'); const RT = '[data-screen-label="08 Approval Routing"]';
  await a.locator(RT + ' .rt-card').nth(1).locator('select').nth(0).selectOption('u-farhan'); await a.locator(RT + ' .rt-card').nth(1).locator('select').nth(1).selectOption('u-farhan'); await a.waitForTimeout(200);
  ok('F: routing refuses the same person twice', await h.has(a, RT, 'must be two different people') && (await h.count(a, RT + ' .rt-card >> nth=1 >> button.dis')) === 1);
  await a.locator(RT + ' .rt-card').nth(1).locator('select').nth(1).selectOption('u-bilal'); await a.locator(RT + ' .rt-card').nth(1).locator('button:has-text("Save routing")').click(); await a.waitForTimeout(300);
  ok('F: services routing saved', JSON.stringify(await a.evaluate(() => PARCO.approversFor(null, 'SERVICE'))) === '{"1":"u-farhan","2":"u-bilal","source":"default"}');
  // 4. invite a new vendor with services and vendor-specific Level 2
  await goTo(a, 'Vendors', 'Onboarding'); await a.click('button:has-text("Invite vendor")'); await a.waitForTimeout(300);
  const W = 'div[role=dialog]';
  await a.click(W + ' .ux-vcard:has-text("V-1000242")'); await a.click(W + ' button:has-text("Continue")'); await a.waitForTimeout(250);
  await a.click(W + ' button:has-text("Services —")'); await a.fill(W + ' .ux-svp input', 'drone'); await a.waitForTimeout(250); await a.click(W + ' .ux-svrow:has-text("Drone Inspection")'); await a.waitForTimeout(200);
  await a.click(W + ' button:has-text("Continue")'); await a.waitForTimeout(250);
  ok('F: people step shows services approvers prefilled with the default', await h.has(a, W, 'Approvers for this vendor') && await h.has(a, W, 'Who approves Service work') && (await a.locator(W + ' .va-ed select').nth(0).inputValue()) === 'u-farhan');
  await a.locator(W + ' .va-ed select').nth(1).selectOption('u-sana'); await a.click(W + ' button:has-text("Continue")'); await a.waitForTimeout(250);
  await a.click(W + ' button:has-text("Continue")'); await a.waitForTimeout(250);
  ok('F: review lists the approvers', await h.has(a, W, 'Farhan Siddiqui → Sana Ahmed'));
  await a.click(W + ' button:has-text("Send invitation")'); await a.waitForTimeout(500);
  const onb = await a.evaluate(() => PARCO.load().onboarding[0].id);
  // 5. vendor accepts by magic link
  const v = await h.open(ctx, 'index.html', '?onboarding=' + onb + '&channel=portal'); const MG = '[data-screen-label="01 Onboarding · Magic Link"]';
  await v.locator(MG + ' button:has-text("check_box_outline_blank")').first().click(); await v.waitForTimeout(200); await v.click(MG + ' button:has-text("Accept onboarding")'); await v.waitForTimeout(600);
  ok('F: vendor accepted through the magic link', await v.evaluate(id => PARCO.byId(PARCO.load().onboarding, id).status, onb) === 'VENDOR_ACCEPTED');
  await v.close();
  // 6. PARCO activates
  await a.reload(); await a.waitForTimeout(2500); await goTo(a, 'Vendors', 'Onboarding'); await a.click('tbody tr:has-text("' + onb + '")'); await a.waitForTimeout(500);
  await a.click('.ux-dr-foot button:has-text("Activate vendor")'); await a.waitForTimeout(500);
  ok('F: vendor activated with Concerned Person and its own approvers', await a.evaluate(() => { const x = PARCO.vendor('V-1000242'); return x.status === 'ACTIVE' && !!x.concerned.primary && x.approvers.SERVICE[2] === 'u-sana'; }));
  // 7. client request for the new service
  await goTo(a, 'Approvals', 'Services'); const SV = '[data-screen-label="08 Service Approvals"]';
  await a.click(SV + ' button:has-text("Issue client request")'); await a.waitForTimeout(300);
  await a.selectOption(SV + ' select >> nth=0', 'V-1000242'); await a.waitForTimeout(200);
  const svcId = await a.evaluate(() => PARCO.load().services.find(s => s.name === 'Drone Inspection (Demo)').id);
  await a.selectOption(SV + ' select >> nth=1', svcId); await a.fill(SV + ' input[placeholder="45000124xx"]', '4500012499'); await a.locator(SV + ' label:has-text("PARCO site") input').fill('Port Qasim Jetty (Demo site)'); await a.locator(SV + ' label:has-text("Units") input').fill('3'); await a.locator(SV + ' button:text-is("Issue")').click(); await a.waitForTimeout(500);
  const cr = await a.evaluate(() => PARCO.load().clientRequests.filter(c => c.vendorId === 'V-1000242')[0]); ok('F: client request issued to the new vendor', !!cr);
  // 8. the new vendor signs in and submits work
  const p = await h.open(ctx, 'index.html'); await p.evaluate(() => PARCO.setSession({ vendorUser: null })); await p.reload(); await p.waitForTimeout(2500);
  await p.click('.ux-dd-btn'); await p.waitForTimeout(200);
  ok('F: new vendor user is a demo account', await h.has(p, '.ux-dd-menu', 'Port Qasim Marine Services'));
  await p.click('.ux-dd-opt:has-text("Adnan Sheikh")'); await p.waitForTimeout(1200);
  ok('F: vendor portal shows the new company, not the demo one', await h.has(p, '[data-screen-label="02 Dashboard"]', 'Port Qasim Marine Services') && !(await h.has(p, '[data-screen-label="02 Dashboard"]', 'Indus Technical')));
  await p.click('aside nav a:has-text("Workflow")'); await p.waitForTimeout(600);
  ok('F: SAP documents are empty for the new vendor (no SAP sync yet)', !(await h.has(p, 'body', 'NIS-INV-2026-0871')));
  await p.click('[role=tab]:has-text("Service work")'); await p.waitForTimeout(600); const V = '[data-screen-label="03 Services Workflow"]';
  await p.click(V + ' tbody tr:has-text("' + cr.id + '") button:has-text("Create service order")'); await p.waitForTimeout(300);
  await p.fill(V + ' input[placeholder="e.g. PARCO-CR-000412"]', cr.id); await p.click(V + ' button:has-text("Verify reference")'); await p.waitForTimeout(250);
  ok('F: non-ATL vendor sees the non-ATL withholding note', await h.has(p, V, 'Not on the ATL'));
  await p.click(V + ' button:has-text("Add file")'); await p.click(V + ' button:has-text("Submit for PARCO approval")'); await p.waitForTimeout(700);
  const sub = await p.evaluate(() => PARCO.load().submissions.filter(s => s.vendorId === 'V-1000242')[0]);
  const tasks = await p.evaluate(id => PARCO.load().tasks.filter(t => t.submissionId === id).map(t => t.approverId), sub && sub.id);
  ok('F: work routed to the chosen approvers (Farhan → Sana)', !!sub && tasks.join(',') === 'u-farhan,u-sana', JSON.stringify(tasks));
  await p.close();
  // 9. two approvals by the routed people, then SAP
  await actAs(a, 'Farhan Siddiqui');
  ok('F: Concerned Person who is an approver gets Approvals', await h.has(a, 'aside nav', 'Approvals'));
  await goTo(a, 'Approvals', 'Services'); await a.click(SV + ' tbody tr:has-text("' + sub.id + '")'); await a.waitForTimeout(500); await a.click(SV + ' .ux-dr-foot button:not(.dis):has-text("Accept")'); await a.waitForTimeout(500);
  await actAs(a, 'Sana Ahmed'); await goTo(a, 'Approvals', 'Services'); await a.click(SV + ' button:has-text("All submissions")').catch(() => {}); await a.waitForTimeout(200); await a.click(SV + ' tbody tr:has-text("' + sub.id + '")'); await a.waitForTimeout(500); await a.click(SV + ' .ux-dr-foot button:not(.dis):has-text("Accept")'); await a.waitForTimeout(500);
  await actAs(a, 'Ayesha Khan'); await goTo(a, 'Approvals', 'Services'); await a.click(SV + ' button:has-text("All submissions")').catch(() => {}); await a.waitForTimeout(200); await a.click(SV + ' tbody tr:has-text("' + sub.id + '")'); await a.waitForTimeout(500); await a.click(SV + ' .ux-dr-foot button:has-text("Simulate SAP")'); await a.waitForTimeout(500);
  ok('F: approved by both levels and confirmed by SAP → ready for invoice', await a.evaluate(id => PARCO.byId(PARCO.load().submissions, id).status, sub.id) === 'READY_FOR_INVOICE');
  // 10. vendor sees the new tax rate on a standalone invoice
  const q = await h.open(ctx, 'index.html'); await q.evaluate(() => PARCO.setSession({ vendorUser: 'adnan.pqm@example.com' })); await q.reload(); await q.waitForTimeout(2500);
  await q.click('button:has-text("New document")'); await q.click('button:has-text("Standalone invoice")'); await q.waitForTimeout(600);
  const opts = await q.evaluate(() => [...document.querySelectorAll('select')].map(x => [...x.options].map(o => o.text)).filter(a => a.some(t => /V5|V0|S2/.test(t)))[0] || []);
  ok('F: new tax rate offered to a vendor without a tax rule', opts.some(t => t.startsWith('S2 · Sales tax 17%')), JSON.stringify(opts));
  await reset(q); await q.close(); await a.close();
}
module.exports = Object.assign(module.exports, { fullFlowNewVendor });
// SAP POs for new vendors, invoicing them, moving open approvals, service picker in the vendor profile.
async function sapPosRerouteAndProfilePicker(ctx, h) {
  const ok = h.ok;
  const a = await h.open(ctx, 'admin.html'); await reset(a); await a.reload(); await a.waitForTimeout(2500);
  // set up an active Supply + Services vendor (onboarding UI is covered elsewhere)
  await a.evaluate(() => { const r = PARCO.createOnboarding({ vendorId: 'V-1000242', capabilities: ['SUPPLY', 'SERVICES'], serviceIds: ['SVC-INSP-03'], contactName: 'Adnan Sheikh (Demo)', email: 'adnan.pqm@example.com', users: [{ name: 'Adnan Sheikh (Demo)', email: 'adnan.pqm@example.com', role: 'VENDOR_ORG_ADMIN' }], channels: ['PORTAL', 'EMAIL'], dueDays: 7, actorId: 'u-ayesha', concernedId: 'u-farhan' }); const o = r.request; PARCO.decideOnboarding(o.id, o.version, 'ACCEPT', 'PORTAL', 'Adnan Sheikh (Demo)', ''); PARCO.activateVendor(o.id, 'u-ayesha'); });
  const pos = await a.evaluate(() => PARCO.posFor('V-1000242').map(p => p.no));
  ok('M: activation syncs simulated SAP purchase orders', pos.length === 2, JSON.stringify(pos));
  // admin issues a client request → service PO line
  await a.evaluate(() => PARCO.createClientRequest({ vendorId: 'V-1000242', serviceId: 'SVC-INSP-03', site: 'Port Qasim Jetty (Demo site)', sapPo: '4500012777', units: 2, actorId: 'u-ayesha' }));
  ok('M: client request creates the service PO line', await a.evaluate(() => PARCO.posFor('V-1000242').some(p => p.no === '4500012777' && p.kind === 'Service' && p.lines.length === 1)));
  // vendor: SAP documents now list its POs, then dispatch against one
  const p = await h.open(ctx, 'index.html'); await p.evaluate(() => PARCO.setSession({ vendorUser: 'adnan.pqm@example.com' })); await p.reload(); await p.waitForTimeout(2500);
  await p.click('aside nav a:has-text("Workflow")'); await p.waitForTimeout(800);
  ok('M: new vendor sees its own POs in SAP documents', await h.has(p, '[data-screen-label="03 Supplier Workflow"]', pos[0]) && !(await h.has(p, '[data-screen-label="03 Supplier Workflow"]', '4500012345')));
  await p.click('[role=tab]:has-text("Supply dispatches")'); await p.waitForTimeout(600); const S = '[data-screen-label="03 Supply Workflow"]';
  await p.click(S + ' button:has-text("New dispatch")'); await p.waitForTimeout(300); await p.click(S + ' button:has-text("PO ' + pos[0] + '")'); await p.waitForTimeout(300);
  await p.locator(S + ' tbody tr:has-text("Gate Valve") input').fill('5'); await p.fill(S + ' input[placeholder="e.g. DN-58940"]', 'DN-PQ-001'); await p.click(S + ' button:has-text("Add file")'); await p.waitForTimeout(150);
  await p.click(S + ' button:has-text("Submit dispatch for PARCO approval")'); await p.waitForTimeout(600);
  const dsp = await p.evaluate(() => PARCO.load().submissions.find(s => s.vendorId === 'V-1000242' && s.type === 'SUPPLY'));
  ok('M: dispatch against a generated PO submitted', !!dsp && dsp.po === pos[0]);
  // reroute: change supply routing, move the open approvals
  await goTo(a, 'Setup', 'Approval routing'); const RT = '[data-screen-label="08 Approval Routing"]';
  await a.locator(RT + ' .rt-card').nth(0).locator('select').nth(0).selectOption('u-bilal'); await a.locator(RT + ' .rt-card').nth(0).locator('button:has-text("Save routing")').click(); await a.waitForTimeout(300);
  ok('M: routing shows open approvals still with the old approver', await h.has(a, RT, 'still with a different approver'));
  await a.locator(RT + ' .rt-card').nth(0).locator('button:has-text("Move them to these approvers")').click(); await a.waitForTimeout(300);
  ok('M: open approvals moved to the new Level 1', await a.evaluate(id => PARCO.load().tasks.find(t => t.submissionId === id && t.level === 1).approverId, dsp.id) === 'u-bilal' && await a.evaluate(() => PARCO.load().tasks.find(t => t.submissionId === 'PARCO-DSP-00081' && t.level === 1).approverId) === 'u-bilal');
  // approve, SAP confirm → goods receipt posted on the PO
  await a.evaluate(id => { const d = PARCO.load(); const t1 = d.tasks.find(t => t.submissionId === id && t.level === 1); PARCO.decideApproval(t1.id, t1.submissionVersion, 'APPROVE', 'APP', t1.approverId, ''); const t2 = PARCO.load().tasks.find(t => t.submissionId === id && t.level === 2); PARCO.decideApproval(t2.id, t2.submissionVersion, 'APPROVE', 'APP', t2.approverId, ''); PARCO.confirmSap(id, 'u-ayesha'); }, dsp.id);
  ok('M: SAP goods receipt adds the received quantity to the PO', await a.evaluate(no => PARCO.posFor('V-1000242').find(p => p.no === no).lines[0].rec, pos[0]) === 5);
  // vendor invoices the received quantity → real invoice for Finance
  await p.reload(); await p.waitForTimeout(2500);
  await p.click('button:has-text("New document")'); await p.click('button:has-text("Invoice against PO")'); await p.waitForTimeout(600);
  const C = '[data-screen-label="05 Create Invoice"]';
  await p.click(C + ' button:has-text("' + pos[0] + '")'); await p.waitForTimeout(300); await p.locator(C + ' :text("check_box_outline_blank")').first().click(); await p.waitForTimeout(150);
  await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(300); await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(300);
  await p.locator(C + ' input').first().fill('PQ-INV-0001'); await p.waitForTimeout(100);
  const taxSel = p.locator(C + ' select').first(); const opt = await taxSel.locator('option').nth(1).getAttribute('value'); await taxSel.selectOption(opt);
  await p.locator(C + ' button:has-text("Attach")').first().click().catch(() => {}); await p.locator(C + ' button:has-text("Upload")').first().click().catch(() => {}); await p.waitForTimeout(200);
  await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(300);
  await p.locator(C + ' :text("check_box_outline_blank")').first().click().catch(() => {}); await p.waitForTimeout(150);
  await p.locator(C + ' button:has-text("Submit")').last().click(); await p.waitForTimeout(600);
  const inv = await p.evaluate(() => PARCO.load().invoices.find(i => i.id === 'PQ-INV-0001'));
  ok('M: vendor invoice for a generated PO reaches PARCO Finance', !!inv && inv.vendorId === 'V-1000242' && inv.po === pos[0], JSON.stringify(inv && inv.status));
  ok('M: invoiced quantity is recorded on the PO', await p.evaluate(no => PARCO.posFor('V-1000242').find(p => p.no === no).lines[0].inv, pos[0]) === 5);
  await p.close();
  // vendor profile: searchable service picker
  await goTo(a, 'Vendors', 'Directory'); const V = '[data-screen-label="08 Vendors"]';
  await a.click(V + ' tbody tr:has-text("V-1000242")'); await a.waitForTimeout(500);
  await a.click(V + ' button:has-text("Change capability")'); await a.waitForTimeout(300);
  ok('M: vendor profile uses the searchable service picker', (await h.count(a, V + ' .ux-svp input')) === 1 && await h.has(a, V + ' .ux-svp', 'of 105') );
  await a.fill(V + ' .ux-svp input', 'diving'); await a.waitForTimeout(200); await a.click(V + ' .ux-svrow:has-text("Diving Services")'); await a.fill(V + ' input[placeholder="Reason (required for audit)"]', 'Adds diving work'); await a.click(V + ' button:has-text("Save change")'); await a.waitForTimeout(400);
  ok('M: service added from the profile picker', await a.evaluate(() => PARCO.vendor('V-1000242').serviceIds.some(id => /MAR-04/.test(id))));
  await reset(a); await a.close();
}
module.exports = Object.assign(module.exports, { sapPosRerouteAndProfilePicker });
async function usersAndRbac(ctx, h) {
  const ok = h.ok;
  const a = await h.open(ctx, 'admin.html'); await reset(a); await a.reload(); await a.waitForTimeout(2500);
  await goTo(a, 'Setup', 'Users'); const U = '[data-screen-label="08 Users"]';
  ok('R: Users screen lists PARCO staff', (await h.count(a, U + ' tbody tr')) === 5);
  await a.click(U + ' button:has-text("Add user")'); await a.fill(U + ' input[placeholder="e.g. Zara Khan"]', 'Zara Khan (Demo)'); await a.fill(U + ' input[placeholder="name@parco.example"]', 'zara@example.com'); await a.fill(U + ' input[placeholder="e.g. Plant Manager"]', 'Plant Manager'); await a.locator(U + ' .ux-drawer select').selectOption('PARCO_APPROVER_1'); await a.click(U + ' button:has-text("Save user")'); await a.waitForTimeout(400);
  ok('R: user added and offered as an approver', (await h.count(a, U + ' tbody tr')) === 6 && await a.evaluate(() => PARCO.accounts().parco.some(x => x.name === 'Zara Khan (Demo)')));
  await a.click(U + ' tbody tr:has-text("Hassan Malik")'); await a.waitForTimeout(300); await a.click(U + ' .seg button:has-text("Inactive")'); await a.click(U + ' button:has-text("Save user")'); await a.waitForTimeout(300);
  ok('R: a user who is still an approver cannot be deactivated', await a.evaluate(() => PARCO.staff('u-hassan').active !== false) && await h.has(a, U, 'Reassign these before deactivating'));
  await a.click(U + ' .ux-dr-close'); await a.waitForTimeout(200);
  await goTo(a, 'Setup', 'Roles & permissions'); const RL = '[data-screen-label="08 Roles"]';
  await a.locator(RL + ' .rb tbody tr:has-text("Approval routing") .rb-cell').nth(1).click(); await a.waitForTimeout(300);
  ok('R: permission granted from the matrix', await a.evaluate(() => PARCO.can('u-bilal', 'routing')));
  await actAs(a, 'Bilal Raza'); await goTo(a, 'Setup');
  ok('R: Finance now sees Approval routing, but not Users', await h.has(a, 'header [role=tablist]', 'Approval routing') && !(await h.has(a, 'header [role=tablist]', 'Users')));
  await actAs(a, 'Zara Khan');
  ok('R: new approver signs in with the approver screens only', await h.has(a, 'aside nav', 'Approvals') && !(await h.has(a, 'aside nav', 'Finance')) && !(await h.has(a, 'aside nav', 'Setup')));
  await reset(a); await a.close();
}
module.exports = Object.assign(module.exports, { usersAndRbac });
async function atlWhtAndVendorOrders(ctx, h) {
  const ok = h.ok;
  const p = await h.open(ctx, 'index.html'); await reset(p); await h.login(p);
  // supply dispatch: ATL toggle stored
  await p.click('aside nav a:has-text("Workflow")'); await p.waitForTimeout(500); await p.click('[role=tab]:has-text("Supply dispatches")'); await p.waitForTimeout(500); const S = '[data-screen-label="03 Supply Workflow"]';
  await p.click(S + ' button:has-text("New dispatch")'); await p.click(S + ' button:has-text("PO 4500012345")'); await p.waitForTimeout(300);
  ok('W: dispatch asks for ATL status', await h.has(p, S, 'Active Taxpayer List'));
  await p.click(S + ' .so-atl button:has-text("No")'); await p.locator(S + ' tbody tr:has-text("Pallet Labels") input').fill('100'); await p.fill(S + ' input[placeholder="e.g. DN-58940"]', 'DN-ATL-1'); await p.click(S + ' button:has-text("Add file")'); await p.click(S + ' button:has-text("Submit dispatch for PARCO approval")'); await p.waitForTimeout(500);
  const dsp = await p.evaluate(() => PARCO.load().submissions.find(s => s.deliveryNote === 'DN-ATL-1'));
  ok('W: dispatch stores "not on ATL" with the non-ATL goods rate', !!dsp && dsp.atlDeclared === false && dsp.wht && dsp.wht.code === 'WHT-G1' && dsp.wht.rate === 0.11);
  // service order with WHT
  await p.click('[role=tab]:has-text("Service work")'); await p.waitForTimeout(500); const V = '[data-screen-label="03 Services Workflow"]';
  await p.click(V + ' button:has-text("New service order")'); await p.locator(V + ' .ux-drawer select').first().selectOption('SVC-INSP-03'); await p.fill(V + ' input[placeholder="e.g. PARCO-CR-000412"]', 'PARCO-CR-000412'); await p.click(V + ' button:has-text("Verify reference")'); await p.waitForTimeout(250);
  await p.locator(V + ' .ux-drawer select').nth(1).selectOption('WHT-S1'); await p.click(V + ' button:has-text("Add file")'); await p.click(V + ' button:has-text("Submit for PARCO approval")'); await p.waitForTimeout(600);
  const so = await p.evaluate(() => PARCO.load().submissions.find(s => s.crId === 'PARCO-CR-000412'));
  await p.close();
  const a = await h.open(ctx, 'admin.html'); await a.waitForTimeout(300);
  // vendor list shows service orders
  await goTo(a, 'Vendors', 'Directory'); const VD = '[data-screen-label="08 Vendors"]';
  ok('W: vendor list shows service orders per vendor', (await h.text(a, VD + ' thead')).toLowerCase().includes('service orders') && await h.has(a, VD + ' tbody tr:has-text("V-1000236")', '2 orders · 2 open'));
  // approval panel shows declaration + mismatch for the dispatch
  await goTo(a, 'Approvals', 'Supply'); const SA = '[data-screen-label="08 Supply Approvals"]'; await a.click(SA + ' tbody tr:has-text("' + dsp.id + '")'); await a.waitForTimeout(500);
  ok('W: approver sees the ATL declaration and the mismatch with PARCO record', await h.has(a, SA, 'NOT on the Active Taxpayer List') && await h.has(a, SA, 'does not match'));
  await goTo(a, 'Approvals', 'Services'); const SV = '[data-screen-label="08 Service Approvals"]'; await a.click(SV + ' tbody tr:has-text("' + so.id + '")'); await a.waitForTimeout(500);
  ok('W: service approval shows WHT category and rate', await h.has(a, SV, 'WHT-S1') && await h.has(a, SV, '8% (ATL rate)'));
  // concerned person sees the orders on assigned vendors
  await actAs(a, 'Farhan Siddiqui'); await goTo(a, 'Vendors', 'Assigned to me');
  ok('W: Concerned Person sees the vendor\'s service orders', await h.has(a, '[data-screen-label="08 Assigned Vendors"]', so.id));
  // WHT master maintained by Finance
  await actAs(a, 'Bilal Raza'); await goTo(a, 'Setup', 'Tax rates'); const TX = '[data-screen-label="08 Tax Rates"]';
  await a.click(TX + ' button:has-text("Add WHT category")'); await a.fill(TX + ' input[placeholder="e.g. WHT-S4"]', 'WHT-S4'); await a.fill(TX + ' input[placeholder="e.g. Services — construction"]', 'Services — construction'); await a.fill(TX + ' input[placeholder="e.g. 8"]', '7'); await a.fill(TX + ' input[placeholder="e.g. 16"]', '14'); await a.click(TX + ' button:has-text("Save WHT category")'); await a.waitForTimeout(300);
  ok('W: Finance adds a WHT category that vendors can pick', await a.evaluate(() => PARCO.whtCodes().some(w => w.code === 'WHT-S4' && w.atlRate === 0.07)));
  await reset(a); await a.close();
}
module.exports = Object.assign(module.exports, { atlWhtAndVendorOrders });
