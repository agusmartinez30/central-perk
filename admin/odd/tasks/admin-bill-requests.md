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
- [x] T1 Bill requests mock + pure helpers test-first. Route: delegated (preparation + 2+ non-trivial files). Commit: 94d4172
- [x] T2 Bill requests screen at the sidebar "Solicitudes de cuenta" route. Route: delegated (2+ non-trivial files). Commit: ac2d893
- [ ] T3 Selected request view with in-memory actions updating list and metrics. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens visually match both 04 exports at 1440×900.
- Selecting a request shows its detail; actions update the list and metrics.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan commit: e9a60a2.
- T1 done (94d4172): `ManagedBillRequest`/`BillRequestsBoard` types and `BILL_REQUESTS_BOARD` mock (five active requests of 04 in the export order: Mesa 10/05/07 pending, Mesa 12/04 in attention, plus Mesa 09 finalized today; Mesa 10 selected). Mesa 10/05/07 keep the 10A totals, payment preferences, wait times (18/12/7 min) and kitchen counts and the 02 account totals; Mesa 10 customer "Lucía", "Hoy, 12:42" and "3 confirmados" from the 04 drawer; Mesa 07 customer from order #1048. Pure helpers in `src/features/bill-requests/bill-requests-view.ts`: metrics (Pendientes 3, En atención 2, Transferencias activas 2, Finalizadas hoy 1), status/payment chips, search by table (padded or not), customer or `#SC-NNN` ignoring case/accents, sort ("Mayor espera" / "Mayor total", finalized last), wait formatting and tone (danger from 20 min, neutral when finalized), status badges, kitchen note, footer count, drawer info rows, assignee, row actions and `markAttending` (pending → attending, assigns the staff member; no finalize transition because closing needs authorization). Test-first: RED (missing `@/mocks/bill-requests`), GREEN 25/25 after fixing one test assertion (`toMatchObject` with an `undefined` key). Checks: tsc OK, lint OK, vitest 136/136.
- Known mock gaps: 02 shows Mesa 05 at 2 min with 1 kitchen order and Mesa 10 with 4 confirmed orders (10A/04 win here); 02 shows Mesa 12 and 04 available while 04 lists them in attention; the 04 rows repeat "18 min", "Transferencia" and "Pendiente" (copy-paste leftovers), so wait times, preferences, customers and assignees of Mesa 12/04 are illustrative and chosen to keep the 04 metrics and sort order; the 04 drawer shows "1 pedido en preparación" for Mesa 10 while the 04 list and 10A only flag Mesa 07, so the kitchen warning follows the data (leftover).

- T2 done (ac2d893): `/bill-requests` (sidebar "Solicitudes de cuenta") renders `BillRequestsScreen` (container, in-memory requests, filters and sort) with `BillRequestsHeader` ("Page Header" + "Realtime Note"), `RequestMetrics`, `RequestFilters` ("Request Search", "Sort Control" native select, "Status Filters", "Payment Filters") and `RequestsTable` (semantic table with the 04 column widths, "Solicitud · Mesa NN" rows, "Waiting Indicator", "Payment Preference", "Request Status", "Row Actions", "Table Footer" with "Table Count" and "Authority Note"). "Marcar en atención" already updates list and metrics through `markAttending`. Shell: `/bill-requests` reuses the 03 `live-location` top bar, test-first in `navigation.test.ts` (RED 1 failing, GREEN 11/11; the old default-variant assertion moved to `/history`); `/`, `/tables`, `/orders` unchanged. `?state=empty|no-results`. Checks: tsc OK, lint OK, vitest 137/137, build OK (20 static routes). Screenshot `br-list.png` at 1440×900 matches the 04 list export.
- T2 deviations: shared 10A sidebar instead of the 04 six-item one with "Conectado"; session user "Sofía M." instead of "María G."; the 04 top bar has no unread dot and a 17px bell, but `live-location` is reused (only notification state differs; the 11/9px profile copy maps to 12/10px); type scale mapped by role (10px header labels, payment chips, realtime note, kitchen note and footer → 11px); per-row wait times, payment preferences, statuses and the "En mesa"/"En caja" icons (CreditCard/Store) are ours because the export repeats the transfer row; wait chips turn red from 20 min (invented threshold); "Mayor total" sort option, empty/no-results copy are invented.

## Next step
T3.
