# Feature: admin-orders

## Objective
Implement module 03 "Gestión de Pedidos" from the exports:
- `exports/ADMIN 03 · Gestión de Pedidos · Desktop-export.html`
- `exports/ADMIN 03 · Pedido seleccionado · Drawer-export.html`
- `exports/ADMIN 03 · Confirmar cancelación-export.html`

## Problem / Why
The sidebar "Pedidos" entry shows the "Próximamente" placeholder. Staff need to see incoming orders, open one in a drawer, advance its status and cancel it with confirmation.

## Scope
- In scope: orders list screen (metrics, filters, search, order list/board as in the export), selected-order drawer, cancel confirmation modal, typed mock orders consistent with the tables mock (same table numbers/customers where they overlap), pure helpers (filtering, counts, status transitions, totals) with tests, in-memory status changes (advance, cancel).
- Out of scope: bill requests (04), payments (05/06), real backend, persistence beyond the session.

## Constraints
- Conventions of `odd/tasks/admin-foundation.md` and `odd/tasks/admin-tables.md`.
- Type scale: the 02/03 scale is the admin-wide reference (labels 11px, body 12px, row titles 13px, panel titles 14px).
- Branch `feat/admin-orders`, stacked on `feat/admin-tables` (PR chain strategy still pending the user's decision).

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [x] T1 Orders mock + pure helpers (metrics, filters/search, status transitions, totals) test-first. Route: delegated (preparation + 2+ non-trivial files). Commit: d6c2df5
- [x] T2 Orders management screen at the sidebar "Pedidos" route. Route: delegated (2+ non-trivial files). Commit: ebc6b18
- [x] T3 Selected-order drawer and cancel confirmation modal with in-memory status changes. Route: delegated (2+ non-trivial files). Commit: bd649fe

## Acceptance criteria
- Screens visually match the three 03 exports at 1440×900.
- Selecting an order opens the drawer; status changes and cancellation (after confirming) update the list and metrics.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan commit: a77fb91.
- T1 done (d6c2df5): `ManagedOrder`/`OrdersBoard` types and `ORDERS_BOARD` mock (the five orders of 03: #1051/#1052 received, #1050/#1048 preparing, #1047 delivered) in `src/mocks`; #1051/#1052 keep the 10A tables, customers and products, every table is seated in the 02 board. Pure helpers in `src/features/orders/orders-view.ts`: column counts and metrics (cancelled orders leave the board), kanban grouping with "Mostrar entregados", table selector options, search by order number (`#105`) or table (`Mesa 3`), totals, status badges, forward-only transitions (received → preparing → delivered), cancel only before delivery with a reason, history labels. Test-first: RED (missing `@/mocks/orders`), GREEN 22/22 on first implementation. Checks: tsc OK, lint OK, vitest 96/96.
- Known mock gaps: resolved by admin-mock-unification — every screen now derives from the single service day in `src/mocks/service-day` (cross-screen invariants in `service-day.test.ts`); the values that changed versus the exports are listed in `odd/tasks/admin-mock-unification.md`.
- T2 done (ebc6b18): `/orders` (sidebar "Pedidos") renders `OrdersScreen` (container, in-memory orders) with `OrdersHeader` ("Page Header" + "Sound Control"), `OrderMetrics`, `OrderFilters` ("Table Selector" native select, "Order Search", "Delivered Toggle" switch) and `KanbanBoard` (three "Columna · …" columns that scroll on their own, "Pedido #NNNN" cards with stretched open button, "Card Customization" and "Primary Status Action" advancing the order). Shell: new `live-location` top bar variant for `/orders` only ("En vivo" pill with 8px radius, 7px unread dot, 12/10px staff copy 16px from the avatar), test-first in `navigation.test.ts` (RED 1 failing, GREEN 10/10); `/` and `/tables` keep `section`/`location`. Card notice helper test-first (`getCardNotice`, `getBillRequestedTables`: RED not a function, GREEN). `?state=empty|no-results`. Checks: tsc OK, lint OK, vitest 101/101, build OK (20 static routes), screenshots at 1440×900 match 03 list; `/` and `/tables` unchanged.
- T2 deviations: shared 10A sidebar instead of the 03 six-item one; session user "Sofía M." instead of "Martín A."; status pills use each stage's label/tone (the export repeats a blue "Recibido" on every card); product rows use real quantities (export: "1× 2× Tostados clásicos", "1× Medialunas" vs 10A "2 Medialunas") and skip the empty placeholder rows; customization block tinted red with "Personalización · Cuenta solicitada" on #1048 because Mesa 07 requested the bill (layer name), and the customizations of #1048/#1047 are invented ("Sin tomate", "Sin mayonesa"); "Sonido desactivado" and the empty/no-results copy are invented.
- T2 docs commit: f568fc0.
- T3 done (bd649fe): pure `ordersReducer` in `orders-state.ts` (open/close detail, advance, two-step cancel: `request-cancel` only for cancellable orders, `confirm-cancel` applies the reason and closes the dialog and that order's drawer, `dismiss-cancel` changes nothing) plus `formatClock`, test-first (RED missing module, GREEN 9/9); `getHistoryTone` test-first (RED not a function, GREEN). `OrderDetailDrawer` ("Order Detail · #NNNN", 380px, light backdrop over the main area, Escape/backdrop close, focus on close) and `CancelOrderDialog` ("Cancellation Confirmation", alertdialog with reason select, Escape/backdrop/"Volver" dismiss, focus on "Volver"). Container uses `useReducer`; `?state=detail|cancel` reproduce the drawer and dialog exports (#1051); README lists the route and variants. Checks: tsc OK, lint OK, vitest 111/111, build OK (20 static routes). Screenshots at 1440×900: list, drawer and cancel match the 03 exports; interactive run (advance #1052, cancel #1051 with "Solicitado por el cliente") updates columns and metrics (Recibidos 0, En preparación 3); empty/no-results render; `/` and `/tables` unchanged.
- T3 deviations: the drawer lists every product (export shows only the first line of #1051) with line totals; history labels after "Recibido en cocina" ("Preparación iniciada", "Pedido entregado", "Pedido cancelado") and their timestamps (current local time) are invented; the "Opciones: …" caption under the reason selector is a design annotation rendered as the native select's options, so the dialog is ~30px shorter; drawer cancel action hidden for delivered orders.
- RDD for T1–T3 (committed-only vs feat/admin-tables): assessed medium, `slice_budget_reached`; the user declined review for this candidate. Parent spot check: vitest 111/111.

## Next step
Human review of the branch; chain strategy before opening PRs. Next module: 04 Solicitudes de cuenta.
