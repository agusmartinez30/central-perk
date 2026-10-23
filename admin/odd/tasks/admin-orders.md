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
- [ ] T2 Orders management screen at the sidebar "Pedidos" route. Route: delegated (2+ non-trivial files).
- [ ] T3 Selected-order drawer and cancel confirmation modal with in-memory status changes. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens visually match the three 03 exports at 1440×900.
- Selecting an order opens the drawer; status changes and cancellation (after confirming) update the list and metrics.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan commit: a77fb91.
- T1 done (d6c2df5): `ManagedOrder`/`OrdersBoard` types and `ORDERS_BOARD` mock (the five orders of 03: #1051/#1052 received, #1050/#1048 preparing, #1047 delivered) in `src/mocks`; #1051/#1052 keep the 10A tables, customers and products, every table is seated in the 02 board. Pure helpers in `src/features/orders/orders-view.ts`: column counts and metrics (cancelled orders leave the board), kanban grouping with "Mostrar entregados", table selector options, search by order number (`#105`) or table (`Mesa 3`), totals, status badges, forward-only transitions (received → preparing → delivered), cancel only before delivery with a reason, history labels. Test-first: RED (missing `@/mocks/orders`), GREEN 22/22 on first implementation. Checks: tsc OK, lint OK, vitest 96/96.
- Known mock gap: 02 fixes kitchen counts per table to keep its 4/3/2/3 metrics, so Mesa 02 and Mesa 07 show 0 pending kitchen orders there while 03 has #1050/#1048 in preparation; changing 02 would break its export match.

## Next step
T2.
