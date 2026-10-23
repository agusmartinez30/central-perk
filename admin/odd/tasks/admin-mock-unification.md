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
- [x] T4 Remove dead per-screen mocks, update README and the "known mock gaps" in previous feature docs. Route: delegated.

## Acceptance criteria
- Invariant tests pass, e.g.: every table's status in 02 agrees with its orders (03) and bill requests (04); overview KPIs equal the sums of the underlying rows; today's collections (05) include every finalized bill request (04) with the same total; method names match 06.
- All screens render, `?state=` variants work.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build, screenshots of every module.

## Progress / Evidence
- T1 done: `src/mocks/service-day/` — `types.ts` (Product, TableSession, ServiceOrder, ServiceBillRequest, ServiceCollection, ServiceDay), `catalog.ts` (11 products priced from 03, staff Sofía M./María G./Martín A./Mariana/Lucas, 06 payment methods Efectivo/Tarjeta/Transferencia/Otro and request modes En mesa/En caja/Por transferencia with the short "Transferencia" chip), `day.ts` (`SERVICE_DAY`: 21/10/2026 at 14:42, 15 sessions today — 5 closed, 10 seated —, 36 orders today, 6 bill requests, 5 collections today plus 21 single-order accounts of the six previous days), `time.ts`, `derive.ts` (pure: `deriveTable`, `getTablesBoard`, `getOrdersBoard`, `getBillRequestsBoard`, `getCollectionsHistory`, `getOverviewSnapshot`, `getBestSellers`) and `index.ts` (derived `TABLES_BOARD`, `ORDERS_BOARD`, `BILL_REQUESTS_BOARD`, `COLLECTIONS_HISTORY`, `OVERVIEW_SNAPSHOT`). Rules: a table is available without an open session, bill-requested with a pending/attending request, else occupied; pending kitchen = received + preparing orders; 10A "preparando" = tables with pending kitchen orders; the 03 board shows seated tables' orders oldest first and drops delivered ones after 30 min; waits are measured to `now` (finalized: to the collection). Route: delegated (writer). Test-first: `service-day.test.ts` RED (missing `./index`), GREEN 24/24. Invariants: catalogue prices, unique ids, orders inside their session, no overlapping sessions, no customer at two seated tables, bill request customer belongs to the session, 02 status/counts/total from orders and requests, 02 = 04 (total, orders, kitchen, preference, wait), kitchen board = unfinished orders of seated tables, 10A tables summary and four KPIs = 02/03/04/05 rows, 10A attention orders and bills = 03 received / 04 pending, 10A chart/total = today's 05 collections, confirmed orders and best sellers from orders, one sync time, finalized request ↔ collection (total, preference, staff, wait), collections only on closed sessions and settled by their orders, "Transferencias" = sum of transfers, methods/modes enabled in 06 with the 06 names, staff membership. Commit 69a09c3. Checks: tsc OK, lint OK, vitest 237/237.
- T2 done: `OverviewScreen` and `TablesScreen` read `OVERVIEW_SNAPSHOT` / `TABLES_BOARD` from `@/mocks/service-day`; `overview-view` and `tables-view` take the request-mode chip labels from the canonical catalogue (`getRequestModeShortLabel`). Tests: behaviour tests kept; the export-number blocks now assert the derived service-day values (10A KPIs 2/3/10/$100.900, attention orders, pending bills, tables line, hourly bars, financial summary; 02 metrics, twelve cards, Mesa 05 quick detail, sync time), cross-screen agreement stays in `service-day.test.ts`. RED not applicable (data migration: assertions rewritten to the derived values, then observed passing). Route: delegated (writer). Commit bcd234e. Checks: tsc OK, lint OK, vitest 237/237.
- T3 done: `OrdersScreen` (`ORDERS_BOARD`, `TABLES_BOARD`), `BillRequestsScreen` (`BILL_REQUESTS_BOARD`) and `CollectionsScreen` (`COLLECTIONS_HISTORY`) read from `@/mocks/service-day`. Names aligned with 06 through the catalogue: 05 "Medio real" and the method select use `PAYMENT_METHODS` (Efectivo/Tarjeta/Transferencia), the 04 payment chips/labels and 05 "Preferencia cliente" use the request modes' short chip, 06 `PAYMENT_METHOD_OPTIONS` and `REQUEST_MODE_OPTIONS` take their names from the same catalogue. In-memory actions untouched (advance/cancel orders, mark attending, save payment settings); each screen keeps its own session state seeded from the service day — cross-screen live propagation is not implemented. Tests: export-number blocks rewritten to the derived values (03 board order oldest first, "#105" search, bill-requested tables 4/5/7/10/12; 04 drawer "Hoy, 14:24", "lucia" search; 05 today rows, finalized SC-009 ↔ COB-0022, table/number searches, staff options, COB-0026 orders); reducers tests only switched import (plus one lookup by id). RED not applicable (data migration). Route: delegated (writer). Commit f73b2e5. Checks: tsc OK, lint OK, vitest 236/236.
- T4 done: deleted `src/mocks/{overview,tables,orders,bill-requests,collections}.ts` (types kept in `src/mocks/types.ts`; `payments.ts`, `staff.ts`, `auth.ts` stay). README documents `src/mocks/service-day`. The "known mock gaps" notes of admin-orders, admin-bill-requests and admin-collections now point here; admin-foundation, admin-tables and admin-payments got a pointer line. Route: delegated (writer). Checks: tsc OK, lint OK, vitest 236/236, build OK (20 static routes). Screenshots at 1440×900 (`uni-overview`, `uni-tables`, `uni-orders`, `uni-orders-detail`, `uni-bill`, `uni-bill-selected`, `uni-history`, `uni-history-selected`, `uni-payments`): layouts unchanged, only data changed.

## Changed versus the exports
Common: one clock for every live screen, 21/10/2026 at 14:42 (sync "14:42:18"); 03/04 times moved to this service keeping 10A's waits.
- 10A: "Mesas ocupadas" 8 → 10; tables line "4 libres · 8 ocupadas · 3 con cuenta · 2 preparando" → "2 libres · 10 ocupadas · 5 con cuenta · 4 preparando" (Mesa 04 and 12 seated with a bill request in attention; "preparando" = tables with orders received or in preparation: 02, 03, 07, 08); last sync 14:32:08 → 14:42:18; notes now the first customization (unchanged text); "Pedidos confirmados" 12 → 36 (today's orders); best sellers Cappuccino 48 / Medialunas 42 / Tostado clásico 28 / Limonada 24 / Tostón de palta 19 → Cappuccino grande 10 / Medialuna 10 / Cappuccino 9 / Café latte 8 / Café con leche 5 (counted from today's orders, singular product names); individual payments $14.300 12:24, $19.800 13:05, $18.500 13:48, $26.800 14:12, $21.500 14:29 → the 05 rows (same hourly bars $14.300 / $38.300 / $48.300, same $100.900, 5 accounts, $20.180). Unchanged: 2 new orders, 3 pending bills (Mesa 10/05/07 with 18/12/7 min, totals and kitchen warning).
- 02: metrics 4/3/2/3 → 2/2/3/5; Mesa 02 "En preparación" (has #1050); Mesa 03 "2 en preparación" → "En preparación" (only #1051 pending); Mesa 04 available → bill requested, 2 pedidos $14.200, "En mesa"; Mesa 10 "4 pedidos" → "3 pedidos" (04 drawer wins); Mesa 12 available → bill requested, 3 pedidos $27.600, "Transferencia"; Mesa 05 quick detail "Pendientes en cocina" 1 → 0 and "Hace 2 min" → "Hace 12 min"; sync 10:42:18 → 14:42:18. Totals of the other tables unchanged.
- 03: times 12:02–12:44 → 13:56–14:38 (+1h54); board sorted oldest first, so the "En preparación" column shows #1048 before #1050; #1048's customer Lucía → Julieta (Lucía asked for Mesa 10's bill); #1050 "Tostón palta" → "Tostón de palta". Counts 2/2/1, products, prices, customizations and totals unchanged.
- 04: request times 12:42–12:57 → 14:24–14:39 (drawer "Hoy, 12:42" → "Hoy, 14:24"); Mesa 07's customer Lucía → Julieta. Metrics 3/2/2/1, waits, totals, preferences, assignees and the finalized Mesa 09 unchanged.
- 05: today's rows now close sessions that are free or reseated, so tables change: COB-0026 Mesa 07 → Mesa 09, COB-0025 Mesa 03 → Mesa 01, COB-0024 Mesa 05 → Mesa 04, COB-0023 Mesa 02 → Mesa 01, COB-0022 Mesa 11 12:40 Mariana → Mesa 09 12:24 María G. (it is 04's finalized SC-009); COB-0026's orders #1042 Agustín / #1048 Lucía → #1027 Ignacio / #1036 Rocío; all today's order lines are new (catalogue priced). Amounts, methods, metrics ($100.900, 5, $20.180, $42.700) and other times unchanged. Previous days: order numbers #1001–#1021 → #901–#921 and amounts recomputed from catalogue prices.
- 06: no visible change; method and request-mode names now come from the shared catalogue.
- Not done: in-memory actions (advance/cancel orders, mark attending, save settings) stay local to each screen; no cross-screen live propagation.

- T4 done (1b5f230): per-screen mocks removed, README and previous feature docs point here. Checks: tsc OK, lint OK, vitest 236/236, build OK (20 static routes).
- RDD for T1–T4 (committed-only vs feat/admin-payments): assessed high (`high_risk`); the user declined review for this candidate. Parent spot check: vitest 236/236.

## Next step
Monorepo layout (see the root `odd/tasks/monorepo-layout.md` in central-perk).
