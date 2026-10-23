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
- [x] T1 Collections mock + pure helpers test-first. Route: delegated (preparation + 2+ non-trivial files). Commit: ba9850a
- [x] T2 Collections history screen at the sidebar "Historial" route. Route: delegated (2+ non-trivial files). Commit: bf6e7ca
- [x] T3 Selected collection view (and actions shown in the export). Route: delegated (2+ non-trivial files). Commit: see git log (`feat(collections): add read-only selected collection drawer`)

## Acceptance criteria
- Screens visually match both 05 exports at 1440×900.
- Filters/search/period work against the mock; selecting a collection shows its detail.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan commit: 9807230.
- T1 done (ba9850a): `ManagedCollection`/`CollectionsHistory` types and `COLLECTIONS_HISTORY` mock (`src/mocks/collections.ts`): today's five 05 rows (COB-0026..0022, Mesa 07/03/05/02/11, $100.900 in 5 accounts) plus 21 illustrative single-order accounts over the previous six days so "Ayer" and "Últimos 7 días" paginate; COB-0026 selected. Pure helpers in `src/features/collections/collections-view.ts`: quick date ranges and "Custom Date Range" label, metrics (Total cobrado $100.900, Cuentas cerradas 5, Ticket promedio $20.180, Transferencias $42.700), totals by method, method/staff/period filters, search by table, account or operation (ignoring case, padding, accents and "#"), sorting ("Más recientes" default), pagination of 5 with "…" page items and the result count, drawer facts, order summaries, account totals with adjustments and the audit timeline. Test-first: RED (missing `@/mocks/collections`), GREEN 24/24. Checks: tsc OK, lint OK, vitest 166/166.
- Known mock gaps (05 wins): 10A's individual payments differ from the 05 rows (only totals, count and average match); the 05 rows all read "Efectivo" (copy-paste leftover) while "Transferencias" is $42.700, so Mesa 03 and Mesa 11 are transfers, Mesa 05 card and Mesa 02 cash are illustrative; 04's finalized Mesa 09 ($14.300, 12:15) has no 05 row (05 lists $14.300 for Mesa 11 at 12:40); "Mostrando 1–5 de 128 operaciones" / 26 pages contradicts "Cuentas cerradas 5" for "Hoy", so the count and pages follow the data; the drawer's "1 Tostado" shortens order #1048's "Tostado de jamón y queso"; orders other than Mesa 07's, "Tarjeta" as a method and the previous days are illustrative.
- T2 done (bf6e7ca): `/history` (sidebar "Historial", placeholder replaced) renders `CollectionsScreen` (container with `useReducer`) with `PaymentHistoryHeader` ("Payment History Header" + "History Read Only Notice"), `PaymentMetrics` (four tiles over the selected period), `PaymentHistoryFilters` ("Quick Date Filters", "Custom Date Range", "Payment History Search", "Payment Select Filters" as native selects) and `PaymentHistoryTable` (semantic table with the 05 column widths, "History · COB-NNNN" rows, "Row Payment Method", "Row Payment Status", "View Payment Detail", "History Pagination" with "History Result Count" and "Server Pagination"). Pure `collectionsReducer` in `collections-state.ts` (period, search, method, staff, sort, page; filter changes reset the page; "clear-filters" keeps the period) plus `getVisibleCollections` (metrics and staff options use the whole period), test-first (RED missing module, GREEN 5/5). Shell: new `verified-location` top bar (03 layout with a "Datos verificados" pill and a dot-less 17px bell), test-first in `navigation.test.ts` (RED 1 failing, GREEN 12/12; the default-variant assertion moved to `/payments`). `?state=empty|no-results`. Checks: tsc OK, lint OK, vitest 172/172, build OK (20 static routes). Screenshot `col-list.png` matches `col-export-list.png` at 1440×900 except the documented gaps.
- T2 deviations: shared 10A sidebar instead of the 05 six-item one with the "Solo lectura · Registro auditable" footer; session user "Sofía M. · Administradora" instead of "Mariana P. · Encargada" (11/9px profile copy mapped to 12/10px); type scale mapped by role (10px header labels, quick dates, filter labels, read-only notice, "Ver detalle" and pagination → 11px; 11px search placeholder → 12px body; 11px date/table/operation/staff cells → 12px; 12px amount → 13px row title); result count and pages follow the data ("Mostrando 1–5 de 5 operaciones", one page for "Hoy"); "Custom Date Range" only shows the selected period (no picker designed); "Más antiguos" / "Mayor importe" sort options, "Tarjeta" method and the empty/no-results copy are invented; "Ver detalle" is wired in T3.

- T3 done: `collectionsReducer` gains `open-detail` (ignores unknown ids) / `close-detail` (keeps filters and page) and `getSelectedCollection`, test-first (RED 3 failing, GREEN 8/8). `SelectedPaymentDetail` ("Selected Payment Detail": 400px drawer, 7% ink "History Drawer Backdrop" over the main area, Escape/backdrop/close button, focus on close; "Payment Drawer Header", "Drawer Payment Status", "Payment Facts", "Historial completo de pedidos" order cards, "Account Totals", "Auditoría" timeline, "Historical Record Notice"). "Ver detalle" opens it; `?state=selected` reproduces the export (COB-0026). README lists the route and variants. Checks: tsc OK, lint OK, vitest 175/175, build OK (20 static routes). Screenshots at 1440×900 (scratchpad, `col-` prefix): `col-list` and `col-selected` match `col-export-list` / `col-export-selected`; `col-flow` ("Últimos 7 días" → page 2 → COB-0021 drawer: 26 accounts, $444.200, "Mostrando 6–10 de 26 operaciones"); `col-empty`, `col-no-results` render; `/`, `/tables`, `/orders`, `/bill-requests` byte-identical to their previous captures.
- T3 deviations: no actions besides closing (the export has none, "Registro histórico de solo lectura"), so no download/export/print was added; type scale mapped by role (10px subtitle, facts, products, totals, audit labels and lock note → 11px; 9px audit times → 11px; 11px order titles/totals → 12px; 12px section headings → 13px).

## Next step
Human review of the branch; chain strategy before opening PRs. Next module: 06 Configuración de Pagos.
