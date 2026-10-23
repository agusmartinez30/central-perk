# Feature: admin-tables

## Objective
Implement module 02 "Gestión de Mesas" from `exports/ADMIN 02 · Gestión de Mesas · Desktop-export.html` inside the admin shell built in `admin-foundation`.

## Problem / Why
The sidebar entry for tables currently shows the "Próximamente" placeholder. Staff need a live view of every table: status, orders, account total, alerts and payment preference.

## Scope
- In scope: tables management screen (summary metrics, status chips filter, search, grid/list view toggle, table cards with status badge, order count, account total, alerts and payment preference, and any side panel shown in the export), typed mock data, pure filtering/aggregation helpers with tests, `?state=` variants for empty/no-results if they make sense.
- Out of scope: 09A–09F (QR management), orders module (03), bill requests (04), real backend.

## Constraints
- Same conventions as `odd/tasks/admin-foundation.md`: Next 16.4.2 (read `node_modules/next/dist/docs/` before using APIs), Tailwind v4 tokens in `src/app/globals.css`, feature folders, container/presentational split, Spanish UI copy, English code.
- Reuse existing shell, tokens and `src/shared/ui` primitives; add new primitives there only when reusable.
- Branch `feat/admin-tables`, stacked on `feat/admin-foundation` (chain strategy for PRs still pending the user's decision).

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [x] T1 Tables mock data + pure helpers (status counts, summary metrics, filter by status/search) test-first. Route: delegated (preparation + 2+ non-trivial files). Commit: 60cab81
- [x] T2 Tables management screen (metrics, chips, search, grid/list toggle, table cards, side panel) wired to the sidebar route. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- The route renders inside the admin shell and visually matches the 02 export at 1440×900.
- Filters, search and grid/list toggle work against the mock data.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- T1 done: `ManagedTable`/`TablesBoard` types and `TABLES_BOARD` mock (12 tables of 02, Mesa 05 selected, synced 10:42:18) in `src/mocks`; pure helpers in `src/features/tables/tables-view.ts` (activity partition available/occupied/preparing/bill-requested, summary metrics, chip filters and counts, search by label or unpadded number, card copy, payment preference, quick-detail stats). Decision: "En preparación" = occupied tables with kitchen orders and a bill request wins over the kitchen, which is the only partition that reproduces 4/3/2/3 with the cards. Test-first: RED (missing `@/mocks/tables`), GREEN 24/24 on first implementation. Checks: tsc OK, lint OK, vitest 72/72.

- T2 done: `/tables` (the sidebar "Mesas" item, which is the active item in the 02 export) renders `TablesScreen` (container) with `TablesHeader` (realtime status), `SummaryMetrics`, `SearchAndFilters` (search, status chips, "Selector de vista"), `TableBoard` (flex rows of four cards like "Fila de mesas", or a list) and `TableDetailPanel` ("Detalle seleccionado", opens on card click, Mesa 05 by default; the board shrinks to 860px while it is open). Shell: `NavItem.topbar` selects the 02 `location` top bar ("Café Central · Sede Centro · Turno mañana", round notifications button with unread dot, 34px profile) only for `/tables`; 10A keeps its section top bar (`getTopbarConfig` test-first: RED missing function, GREEN 9/9). The shell `main` padding moved into each screen because 02 uses 20/28/12px and 10A 14/24px. `?state=empty|no-results` added. Checks: tsc OK, lint OK, vitest 74/74, build OK (20 static routes), headless screenshots at 1440×900: `/tables` matches 02 (cards, metrics, chips, panel); `/` unchanged vs 10A; list, empty and no-results variants render.
- Deviations: sidebar stays the shared 10A sidebar (02 shows a reduced 6-item sidebar with "Actualización en vivo"); staff profile shows the session user "Sofía M." instead of "María G."; the fourth summary tile and the view selector sit under the open panel exactly as in the export; list view layout, selected-card outline in the status tone, empty/no-results copy, "Ver detalle de mesa" with no destination yet, and kitchen counts / bill wait times for tables other than Mesa 05 are not in the export. `/tables/management` ("Gestión de mesas" nav item) keeps its placeholder.

## Next step
Human review of the branch; decide whether `/tables/management` should alias the 02 screen; chain strategy before opening PRs.
