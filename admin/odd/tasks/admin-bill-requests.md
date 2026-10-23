# Feature: admin-bill-requests

## Objective
Implement module 04 "Solicitudes de Cuenta" from the exports:
- `exports/ADMIN 04 · Solicitudes de Cuenta · Desktop-export.html`
- `exports/ADMIN 04 · Solicitud seleccionada · Desktop-export.html`

## Problem / Why
The sidebar "Solicitudes de cuenta" entry shows the "Próximamente" placeholder. Staff need to see which tables asked for the bill, how long they have been waiting, their payment preference and pending kitchen items, and act on a selected request.

## Scope
- In scope: bill requests list screen (metrics, filters, search, request list as in the export), selected-request view/panel, typed mock bill requests consistent with the tables (02), orders (03) and overview (10A) mocks where they overlap (Mesa 10, Mesa 05, Mesa 07 with their totals and payment preferences), pure helpers (counts, wait times, filtering, totals, actions) with tests, in-memory actions shown in the export (e.g. mark as attended / collected).
- Out of scope: collections history (05), payment settings (06), real backend.

## Constraints
- Conventions of the previous feature docs (`admin-foundation`, `admin-tables`, `admin-orders`).
- Type scale: 02/03 is the admin-wide reference (labels 11px, body 12px, row titles 13px, panel titles 14px).
- Branch `feat/admin-bill-requests`, stacked on `feat/admin-orders` (PR chain strategy still pending the user's decision).

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [ ] T1 Bill requests mock + pure helpers test-first. Route: delegated (preparation + 2+ non-trivial files).
- [ ] T2 Bill requests screen at the sidebar "Solicitudes de cuenta" route. Route: delegated (2+ non-trivial files).
- [ ] T3 Selected request view with in-memory actions updating list and metrics. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens visually match both 04 exports at 1440×900.
- Selecting a request shows its detail; actions update the list and metrics.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
