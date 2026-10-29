/* Regression + PARCO scenario suite for the built prototype in public/.
   Run: node tests/e2e.js            (needs playwright-core; see PW_CORE below, and a local Chrome) */
const path = require('path');
const PW_CORE = process.env.PW_CORE || '/Users/mustafaalitayabani/Documents/GitHub/diagora/node_modules/playwright-core';
const pw = require(PW_CORE);
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots');
require('fs').mkdirSync(SHOTS, { recursive: true });
const R = []; const errs = [];
const ok = (name, cond, info = '') => R.push((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  [' + info + ']' : ''));
const file = (f) => 'file://' + path.resolve(__dirname, '..', 'public', f);
const count = (p, sel) => p.locator(sel).count();
const text = (p, sel) => p.locator(sel).first().innerText({ timeout: 4000 }).catch(() => '');
const has = async (p, sel, t) => (await text(p, sel)).includes(t);
const tipText = (p) => p.evaluate(() => { const t = document.querySelector('[role=tooltip]'); return t ? t.innerText : ''; });
async function open(ctx, f, q = '') { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(f + ': pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(f + ': ' + m.type() + ': ' + m.text().slice(0, 160)); }); await p.goto(file(f) + q, { waitUntil: 'load' }); await p.waitForTimeout(2500); if (/^admin/.test(f) && !q.includes('task=') && !(await has(p, 'header', 'Ayesha Khan'))) await actAs(p, 'Ayesha Khan'); return p; }
// Demo sign-in: the admin shows account cards until someone signs in; "Switch account" in the header menu returns to them.
async function actAs(p, name) { if (!(await p.$('[data-screen-label="00 Sign in"]'))) { await p.click('button[aria-label="Account menu"]'); await p.waitForTimeout(200); await p.click('button:has-text("Switch account")'); await p.waitForTimeout(400); } await p.click('[data-screen-label="00 Sign in"] button:has-text("' + name + '")'); await p.waitForTimeout(700); }
// Admin navigation: six sidebar sections, each with tabs under the header.
async function goTo(p, section, tab) { await p.locator('aside nav a:has-text("' + section + '")').first().click(); await p.waitForTimeout(500); if (tab) { await p.locator('header [role=tablist] a:has-text("' + tab + '")').first().click(); await p.waitForTimeout(600); } }
async function login(p) { if (!(await p.$('button:has-text("Log in")'))) { if (!(await has(p, 'header', 'Lena Marsh'))) { await p.click('button[aria-label="Account menu"]'); await p.click('button:has-text("Switch account")'); await p.waitForTimeout(400); await p.click('button:has-text("Lena Marsh")'); await p.waitForTimeout(700); } return; } await p.click('button:has-text("Log in")'); await p.waitForTimeout(600); for (const [i, el] of (await p.$$('input[inputmode=numeric]')).entries()) await el.type(String(i + 1)); const v = await p.$('button:has-text("Verify")'); if (v) await v.click(); await p.waitForTimeout(1000); }
async function dock(p, label) { if (!(await p.$('text=Prototype controls'))) { await p.click('button:has-text("Prototype")'); await p.waitForTimeout(300); } await p.locator('div:has(> span:text("Table state (all lists)")) button:has-text("' + label + '"), div:has(> span:text("SAP sync")) button:has-text("' + label + '")').first().click(); await p.waitForTimeout(1100); await p.locator('div:has(> b:text("Prototype controls")) button').first().click().catch(() => {}); await p.waitForTimeout(200); }

async function supplierRegression(ctx) {
  const p = await open(ctx, 'index.html');
  ok('S: login page branded PARCO', await has(p, 'body', 'PARCO'));
  await login(p);
  const D = '[data-screen-label="02 Dashboard"]';
  ok('S: dashboard reached with a personal greeting', /Good (morning|afternoon|evening), Lena/.test(await text(p, D + ' h1')));
  ok('S: vendor identity Indus / V-1000236', await has(p, D, 'Indus Technical Trading & Services (Demo)') && await has(p, D, 'V-1000236'));
  ok('S: 4 KPI tiles', (await count(p, D + ' .ux-tile')) === 4 && await has(p, D + ' .ux-tile.crit', 'Needs your action'));
  await p.hover(D + ' .ux-tile:has-text("Needs your action")'); await p.waitForTimeout(300); ok('S: KPI tooltip', (await tipText(p)).includes('returned or blocked'));
  ok('S: next steps lead with the returned and blocked invoices', (await text(p, D + ' .ux-card:has-text("Your next steps") .ux-row >> nth=0')).includes('was returned to you') && (await count(p, D + ' .ux-card:has-text("Your next steps") .ux-row')) >= 4);
  ok('S: how-you-get-paid flow with 6 stages', (await count(p, D + ' .ux-step')) === 6);
  ok('S: PARCO work shows approval progress', (await count(p, D + ' .ux-prog')) === 2 && (await count(p, D + ' .ux-ps.cur')) === 2);
  await p.click('aside nav a:has-text("Workflow")'); await p.waitForTimeout(1200);
  const W = '[data-screen-label="03 Supplier Workflow"]';
  ok('S: workflow 10 rows / 14 headers', (await count(p, W + ' tbody tr')) === 10 && (await count(p, W + ' thead th')) === 14);
  await p.click('button:has-text("Filters")'); await p.waitForTimeout(300);
  await p.locator(W + ' input[placeholder^="e.g."]').first().fill('01-Oct-2026'); await p.waitForTimeout(500);
  ok('S: date filter typed in tenant format', (await count(p, W + ' tbody tr')) === 8 && await has(p, W, 'From 01-Oct-2026'));
  await p.locator(W + ' input[placeholder^="e.g."]').first().fill(''); await p.waitForTimeout(300);
  await p.click(W + ' button:has-text("Action Required")'); await p.waitForTimeout(500);
  await p.click(W + ' tbody tr:has-text("NIS-INV-2026-0856")'); await p.waitForTimeout(1000);
  ok('S: Date Variance invoice detail', await has(p, '[data-screen-label="05 Invoice Detail"]', 'DATE VARIANCE'));
  await p.click('text=Payment Insight'); await p.waitForTimeout(1000);
  const P = '[data-screen-label="06 Payment Insight"]';
  ok('S: payments headers + rows', (await count(p, P + ' thead th')) === 13 && (await count(p, P + ' tbody tr')) === 9);
  await dock(p, 'Error'); ok('S: payments error state', await has(p, P, 'We couldn’t load payments from SAP')); await dock(p, 'Data');
  await p.click('text=Documentation'); await p.waitForTimeout(800);
  ok('S: documentation guides', (await count(p, '[data-screen-label="07 Documentation"] nav a')) === 9 && await has(p, 'body', 'info@qbsco.net'));
  await p.click('text=Home'); await p.waitForTimeout(600);
  await p.locator(D + ' .ux-row:has-text("Invoice PO 4500012345") button:has-text("Create invoice")').click(); await p.waitForTimeout(800);
  const C = '[data-screen-label="05 Create Invoice"]';
  await p.locator(C + ' :text("check_box_outline_blank")').first().click(); await p.waitForTimeout(200);
  await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(400); await p.click(C + ' button:has-text("Continue")'); await p.waitForTimeout(400);
  ok('S: wizard step 3 date prefilled 29-Oct-2026', (await p.locator(C + ' input[placeholder^="DD-MMM"]').first().inputValue()) === '29-Oct-2026');
  await p.screenshot({ path: SHOTS + '/s-dashboard.png' }); await p.close();
}
async function adminRegression(ctx) {
  const p = await open(ctx, 'admin.html');
  ok('A: admin loads PARCO', await has(p, 'aside', 'PARCO'));
  await goTo(p, 'Setup', 'Monitoring');
  ok('A: monitoring queue', (await count(p, '[data-screen-label="08 Monitoring"] tbody tr')) >= 5);
  await goTo(p, 'Setup', 'SAP connection');
  ok('A: sync log', (await count(p, '[data-screen-label="08 SAP Connection"] tbody tr')) >= 6);
  await p.close();
}
async function designSystem(ctx) { const p = await open(ctx, 'design-system.html'); await p.waitForTimeout(3000); ok('D: theme demos render', (await count(p, '[data-screen-label="09 Theme Demo"] [data-screen-label]')) >= 6); await p.close(); }

(async () => {
  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const scenarios = { supplierRegression, adminRegression, designSystem };
  try { Object.assign(scenarios, require('./parco.scenarios.js')); } catch (e) { if (process.env.DEBUG) console.log('no parco scenarios:', e.message); }
  const only = process.argv[2];
  for (const [name, fn] of Object.entries(scenarios)) { if (only && name !== only) continue; try { await fn(ctx, { open, login, ok, count, text, has, tipText, dock, SHOTS, file, actAs, goTo }); } catch (e) { R.push('ABORT ' + name + ': ' + e.message.slice(0, 1500)); } }
  await browser.close();
  console.log(R.filter(r => !r.startsWith('PASS')).join('\n'));
  console.log('errors:', errs.length ? '\n' + errs.join('\n') : 'none');
  console.log('SUMMARY:', R.filter(r => r.startsWith('PASS')).length, 'pass,', R.filter(r => !r.startsWith('PASS')).length, 'fail');
  if (process.env.VERBOSE) console.log(R.join('\n'));
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
