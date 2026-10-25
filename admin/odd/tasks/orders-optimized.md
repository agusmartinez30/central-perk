# Feature: orders-optimized

## Objective
Update the admin `/orders` screen to the optimized proposal in `web/exports/ADMIN 03 · Propuesta optimizada · Desktop-export.html`.

## Problem / Why
The current `/orders` screen follows the original 03 exports. The new proposal reorganizes it: alert metrics with context sublabels, quick filter chips (Todos, Demorados), delay detection against a 20-minute target, "NUEVO" badge, per-item notes, and a persistent detail panel with a timeline.

## Scope
- In: `admin/src/features/orders/**`, `admin/src/mocks/**` (orders/service-day data), `admin/src/app/(admin)/orders/**`, related tests and README.
- Out: shared sidebar/shell (keeps the shared admin navigation, consistent with previous screens), other admin screens.

## Constraints
- English identifiers/comments; UI copy in Spanish as in the export.
- Test-first for pure helpers (vitest).
- Existing interactions (advance status, cancel with reason, empty/no-results states) keep working.

## Delivery strategy
`ask-on-risk`. Forecast ~500–700 authored lines; chain strategy for PRs is asked before opening PRs (local work-unit commits only).

## Tasks
- [x] T1 Pure helpers + mock data test-first: delay detection (20 min target, "+N min"), "new" order flag, quick filters (all / delayed) and delivered visibility, search by order, table or customer, item notes, column sublabels, timeline entries. Route: delegated (preparation + 2+ non-trivial files). Commit: 9eb9a10
- [x] T2 Screen redesign: header + "Alertas activas" metrics, toolbar (search, chips, delivered toggle, "Actualizado ahora"), redesigned kanban cards, persistent detail panel (selected order, products with notes, timeline, delay alert, cancel / advance actions). Route: delegated (2+ non-trivial files). Commit: 4b3dcfa

## Acceptance criteria
- `/orders` visually matches the optimized export at 1440×900.
- Selecting an order shows it in the detail panel; advance and cancel (after confirming) update columns, metrics and alerts.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass in `admin/`.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Branch `feat/orders-optimized` from main `ef0f81d`.
- T1 done: new `src/features/orders/order-alerts.ts` (time-aware, `now` passed in as "HH:MM" from `SERVICE_DAY.now`): `DELAY_TARGET_MINUTES` 20, elapsed/delay minutes (only received/preparing can be delayed), `isNewOrder` (received ≤ 5 min), elapsed badge ("hace N min", red when delayed, green when delivered), panel received line, `getAlertMetrics` with sublabels ("N nuevo(s)" / "sin nuevos", "N demorado(s)" / "a tiempo", "últimos 30 min"), quick filters (`all` / `delayed`) + chip counts, `filterBoardOrders` (search by order number, "Mesa N", customer or space, accent-insensitive, combined with the quick filter and delivered visibility), `formatOrderLocation` ("Mesa 03 - Salón · Martina"), `getItemNote`, `getPanelAction` ("Marcar como entregado"), `getDefaultSelectedOrderId` (oldest delayed, else oldest received), `getOrderTimeline` (history + "Ahora · Demorado +N min"). Mocks: `ManagedOrder.spaceName` derived from the 09A table/space in `getOrdersBoard`; the "received" history event records `by: "María G."`. Test-first: RED (`order-alerts.test.ts`: missing module), GREEN 21/21 on first implementation. Checks: lint OK, tsc OK, vitest 43 files / 591 tests.
- T1 deviations (data kept per service-day invariants): elapsed times come from the 14:42 service day (#1051 6 min, #1052 4 min, #1050 18 min, #1048 38 min → "+18 min", #1047 46 min) instead of the export's 2/4/16/34/42; so "NUEVO" falls on #1052 (newest) instead of #1051; spaces follow 09A (Mesa 03/02/07 Salón, 08/06 Terraza; export: 03/07 Terraza, 06 Vereda); #1048 is Julieta's; item notes are the existing customizations ("Leche deslactosada", "Sin hielo", "Sin tomate", "Sin mayonesa") instead of the export's (avena, sin TACC, …); "Pedido recibido" and "Confirmado por María" share the confirmation time.
- T2 done: `/orders` follows the optimized export. `OrdersHeader` (24px title, new subtitle, "Alertas activas" toggle) + `OrderMetrics` (tinted tiles with sublabels from `getAlertMetrics`); `OrderToolbar` (replaces `OrderFilters`: unified search "Pedido, mesa o cliente…", "Todos" / "Demorados N" chips, "Entregados visibles" toggle, "Actualizado ahora"); `KanbanBoard` (tinted columns, newest order on top, cards with elapsed badge, "NUEVO", per-item notes, primary action or "Entregado", "Ver detalle"; selected card outlined in brand; "Desplazar para ver más ↓" appears only while a column overflows and scrolls it); `OrderDetailPanel` (replaces the overlay `OrderDetailDrawer`: persistent 362px panel with status badge, location + received line, products with notes, customer note, "Cronología", delay alert, "Cancelar pedido" → existing `CancelOrderDialog`, "Comenzar preparación" / "Marcar como entregado"; "Cerrar detalle" clears the selection and shows a placeholder). The panel opens on the oldest delayed order (#1048). Status changes and cancellations are stamped with the service-day clock (`SERVICE_DAY.now`) so the timeline stays coherent. Test-first addition: `sortNewestFirst` (RED not a function, GREEN). Dead code removed: table selector/options, old `filterOrders`, `getOrderMetrics`, `getCardNotice`, `getBillRequestedTables`, `formatOrderMeta`, `formatOrderTotal`, history label/tone helpers, `formatClock`, `StatusPill`, `CustomizationNotice` and their tests. `?state=detail` now selects #1051 in the panel; `cancel`, `empty`, `no-results` unchanged. README updated.
- T2 checks: lint OK, tsc OK, vitest 43 files / 578 tests, build OK (`/orders` static). Screenshots at 1440×1024 and 1440×900 compared side by side with the export (header, metrics, toolbar, columns, cards, panel match in layout, colors, radii and type scale); `?state=detail|cancel|empty|no-results` render. Interactive run: "Marcar como entregado" on #1048 → En preparación 1 "a tiempo", Entregados 2, "Demorados 0"; cancel #1052 with "Solicitado por el cliente" → Recibidos 1 "sin nuevos", panel placeholder; search "martina" → 1 card; hiding delivered drops the column.
- T2 deviations: shared admin sidebar and the existing `live-location` top bar (no "Operación en línea · Turno mañana" footer, user "Sofía M." instead of "María · Encargada"); data deviations from T1 (times, NUEVO on #1052, spaces, customer, notes), so long locations like "Mesa 08 - Terraza · Tomás" wrap to two lines where the export fits one; "Desplazar para ver más ↓" hidden when the column does not overflow (the export always draws it); panel shows the product variant ("Grande · caliente") and the customer note ("Sin azúcar."), which the export does not include; no totals on cards or panel (as in the export); invented copy: "Alertas silenciadas", "Entregados ocultos", "sin nuevos", "a tiempo", panel placeholder, updated no-results description.

- RDD (committed-only vs main, export excluded as untracked design input): assessed medium, `slice_budget_reached`; the user declined review for this candidate. Parent spot check: vitest 578/578.

## Next step
Human review; chain strategy before opening PRs (T1 9eb9a10: +467/−5; T2 4b3dcfa: +562/−685 code plus docs; above the ~400 budget, mostly replaced code).
