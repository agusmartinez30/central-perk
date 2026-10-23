# Feature: admin-mock-unification

## Objective
Replace the per-screen mocks (overview, tables, orders, bill requests, collections, payments) with a single "service day" source of truth so the same table, order, bill request or collection shows the same data on every admin screen.

## Problem / Why
Each module copied the numbers of its own export, and the exports contradict each other: Mesa 05 waits 2 min in 02 and 12 min in 04/10A, Mesa 12/04 are free in 02 but in attention in 04, Mesa 02/07 have 0 kitchen orders in 02 but orders in preparation in 03, 04's finalized Mesa 09 has no 05 collection, and 10A's individual payments differ from 05. The prototype must tell one coherent story.

## Decision
User decision (2026-10-23): **cross-screen coherence wins over per-export fidelity**. Metrics and rows are derived from the single source; some numbers will no longer match their export. Layout, copy and visual design stay as they are.

## Scope
- In scope: one canonical dataset in `src/mocks` (staff, tables, customers, orders with items, bill requests, collections, payment methods/request modes), pure derivation helpers (table status from orders/bill requests, overview KPIs, metrics), migrating every feature to read from it, updating tests to assert coherence (cross-screen invariants), updating feature docs' "known mock gaps" notes.
- Out of scope: visual changes, new screens, backend.

## Constraints
- Conventions of the previous feature docs. Pure functions tested first.
- Keep each screen's export as close as possible while staying coherent (prefer reusing export values when they don't conflict).
- Keep `?state=` variants working.
- Branch `feat/admin-mock-unification`, stacked on `feat/admin-payments`.

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [x] T1 Canonical service-day dataset + derivation helpers + cross-screen invariant tests (test-first). Route: delegated (preparation + 2+ non-trivial files).
- [x] T2 Migrate overview (10A) and tables (02) to the canonical source. Route: delegated (2+ non-trivial files).
- [x] T3 Migrate orders (03), bill requests (04), collections (05) and payments method names (06). Route: delegated (2+ non-trivial files).
- [ ] T4 Remove dead per-screen mocks, update README and the "known mock gaps" in previous feature docs. Route: delegated.

## Acceptance criteria
- Invariant tests pass, e.g.: every table's status in 02 agrees with its orders (03) and bill requests (04); overview KPIs equal the sums of the underlying rows; today's collections (05) include every finalized bill request (04) with the same total; method names match 06.
- All screens render, `?state=` variants work.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build, screenshots of every module.

## Progress / Evidence
- T1 done: `src/mocks/service-day/` — `types.ts` (Product, TableSession, ServiceOrder, ServiceBillRequest, ServiceCollection, ServiceDay), `catalog.ts` (11 products priced from 03, staff Sofía M./María G./Martín A./Mariana/Lucas, 06 payment methods Efectivo/Tarjeta/Transferencia/Otro and request modes En mesa/En caja/Por transferencia with the short "Transferencia" chip), `day.ts` (`SERVICE_DAY`: 21/10/2026 at 14:42, 15 sessions today — 5 closed, 10 seated —, 36 orders today, 6 bill requests, 5 collections today plus 21 single-order accounts of the six previous days), `time.ts`, `derive.ts` (pure: `deriveTable`, `getTablesBoard`, `getOrdersBoard`, `getBillRequestsBoard`, `getCollectionsHistory`, `getOverviewSnapshot`, `getBestSellers`) and `index.ts` (derived `TABLES_BOARD`, `ORDERS_BOARD`, `BILL_REQUESTS_BOARD`, `COLLECTIONS_HISTORY`, `OVERVIEW_SNAPSHOT`). Rules: a table is available without an open session, bill-requested with a pending/attending request, else occupied; pending kitchen = received + preparing orders; 10A "preparando" = tables with pending kitchen orders; the 03 board shows seated tables' orders oldest first and drops delivered ones after 30 min; waits are measured to `now` (finalized: to the collection). Route: delegated (writer). Test-first: `service-day.test.ts` RED (missing `./index`), GREEN 24/24. Invariants: catalogue prices, unique ids, orders inside their session, no overlapping sessions, no customer at two seated tables, bill request customer belongs to the session, 02 status/counts/total from orders and requests, 02 = 04 (total, orders, kitchen, preference, wait), kitchen board = unfinished orders of seated tables, 10A tables summary and four KPIs = 02/03/04/05 rows, 10A attention orders and bills = 03 received / 04 pending, 10A chart/total = today's 05 collections, confirmed orders and best sellers from orders, one sync time, finalized request ↔ collection (total, preference, staff, wait), collections only on closed sessions and settled by their orders, "Transferencias" = sum of transfers, methods/modes enabled in 06 with the 06 names, staff membership. Commit 69a09c3. Checks: tsc OK, lint OK, vitest 237/237.
- T2 done: `OverviewScreen` and `TablesScreen` read `OVERVIEW_SNAPSHOT` / `TABLES_BOARD` from `@/mocks/service-day`; `overview-view` and `tables-view` take the request-mode chip labels from the canonical catalogue (`getRequestModeShortLabel`). Tests: behaviour tests kept; the export-number blocks now assert the derived service-day values (10A KPIs 2/3/10/$100.900, attention orders, pending bills, tables line, hourly bars, financial summary; 02 metrics, twelve cards, Mesa 05 quick detail, sync time), cross-screen agreement stays in `service-day.test.ts`. RED not applicable (data migration: assertions rewritten to the derived values, then observed passing). Route: delegated (writer). Commit bcd234e. Checks: tsc OK, lint OK, vitest 237/237.
- T3 done: `OrdersScreen` (`ORDERS_BOARD`, `TABLES_BOARD`), `BillRequestsScreen` (`BILL_REQUESTS_BOARD`) and `CollectionsScreen` (`COLLECTIONS_HISTORY`) read from `@/mocks/service-day`. Names aligned with 06 through the catalogue: 05 "Medio real" and the method select use `PAYMENT_METHODS` (Efectivo/Tarjeta/Transferencia), the 04 payment chips/labels and 05 "Preferencia cliente" use the request modes' short chip, 06 `PAYMENT_METHOD_OPTIONS` and `REQUEST_MODE_OPTIONS` take their names from the same catalogue. In-memory actions untouched (advance/cancel orders, mark attending, save payment settings); each screen keeps its own session state seeded from the service day — cross-screen live propagation is not implemented. Tests: export-number blocks rewritten to the derived values (03 board order oldest first, "#105" search, bill-requested tables 4/5/7/10/12; 04 drawer "Hoy, 14:24", "lucia" search; 05 today rows, finalized SC-009 ↔ COB-0022, table/number searches, staff options, COB-0026 orders); reducers tests only switched import (plus one lookup by id). RED not applicable (data migration). Route: delegated (writer). Checks: tsc OK, lint OK, vitest 236/236.

## Next step
T1.
