# WaslHub Supplier Invoicing Portal — PARCO prototype

Clickable, data-backed prototype of a multi-tenant supplier invoicing portal for SAP S/4HANA buyers, configured for the PARCO (Pakistan) vendor onboarding, supply and services workflow.

- `public/index.html` — Supplier Portal (vendor side; sign in as one of the three vendor demo accounts, or use the plain login form)
- `public/admin.html` — Tenant Admin (PARCO side; sign in as one of the five PARCO demo accounts, switch from the account menu in the header)
- `public/design-system.html` — status tags, theme tokens, change log, acceptance checklist

## Build and run

```bash
python3 build.py . "WaslHub Supplier Portal.html" public   # regenerates public/ from the .dc.html sources
python3 -m http.server 4173 --directory public             # http://127.0.0.1:4173/
node tests/e2e.js                                          # headless Chrome suite (needs playwright-core + Chrome)
```

Vercel serves `public/` (see `vercel.json`). The pages are self-contained bundles; the shared PARCO demo data layer is `parco-store.js` and persists in the browser (localStorage, shared by both portals). Use *Reset PARCO demo data* in either Prototype dock to return to the fixtures.

## Documentation

- [docs/parco-implementation.md](docs/parco-implementation.md) — what is live vs simulated, roles, integration contracts, configurable decisions, acceptance checklist
- [docs/prototype-flow.md](docs/prototype-flow.md) — screen inventory and flows with Mermaid diagrams

All companies, people, documents and amounts are fictional demo fixtures.
