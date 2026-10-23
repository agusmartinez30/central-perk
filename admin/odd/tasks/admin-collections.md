# Feature: admin-collections

## Objective
Implement module 05 "Historial de Cobros" from the exports:
- `exports/ADMIN 05 · Historial de Cobros · Desktop-export.html`
- `exports/ADMIN 05 · Cobro seleccionado · Desktop-export.html`

## Problem / Why
The sidebar "Historial" entry shows the "Próximamente" placeholder. Staff need to review collected payments (method, amount, table, status, time), filter and search them, and inspect a selected collection.

## Scope
- In scope: collections history screen (metrics, filters, search, period, table/list as in the export), selected-collection view, typed mock collections consistent with the existing mocks where they overlap (overview 10A "Total cobrado" $100.900, "Cuentas cerradas", "Ticket promedio", bill requests 04 finalized Mesa 09), pure helpers (totals by method, filtering, search, sorting, formatting) with tests, any in-memory actions shown in the export.
- Out of scope: payment settings (06), real backend, real exports/downloads (a download action may be a no-op or a client-side CSV only if trivially supported without new dependencies).

## Constraints
- Conventions of the previous feature docs (`admin-foundation`, `admin-tables`, `admin-orders`, `admin-bill-requests`).
- Type scale: 02/03 is the admin-wide reference (labels 11px, body 12px, row titles 13px, panel titles 14px).
- Branch `feat/admin-collections`, stacked on `feat/admin-bill-requests` (PR chain strategy still pending the user's decision).

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [ ] T1 Collections mock + pure helpers test-first. Route: delegated (preparation + 2+ non-trivial files).
- [ ] T2 Collections history screen at the sidebar "Historial" route. Route: delegated (2+ non-trivial files).
- [ ] T3 Selected collection view (and actions shown in the export). Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens visually match both 05 exports at 1440×900.
- Filters/search/period work against the mock; selecting a collection shows its detail.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
