# Feature: admin-tables-unify

## Objective
Merge "Mesas y códigos QR" (`/tables/qr`) into "Gestión de mesas" (`/tables/management`): one sidebar item, one screen with tabs "Plano" / "Códigos QR" (`?view=qr`), and `/tables/qr` redirecting there.

## Problem / Why
The QR screen repeats management entry points ("Nueva mesa", "Crear espacio"/space cards, row "Editar") that only link to `/tables/management`, and the sidebar shows two items for the same area. User decision (2026-10-27): option 1, a single screen. Tabs chosen over a per-table QR panel: the 564px QR drawer does not fit next to the 320px spaces aside, and bulk print plus the cross-space QR list have no home in a per-table panel.

## Scope
- In scope: tab bar in the management screen; QR list/detail/material/bulk print/regenerate ported under `?view=qr`; drop the QR "Nueva mesa" link, `SpacesManagement`, and `MOVED_STATES` (old URLs redirect straight to management); row "Editar" opens the table modal in-screen; `/tables/qr` → `redirect("/tables/management?view=qr")` forwarding `?state`; remove the `table-qr` nav item and the `credentials` topbar variant if unused; move `TableQrParts` shared pieces where management can own them; update tests, README and comments.
- Out of scope: API changes, `/tables` live screen, visual redesign of QR views.

## Constraints
- Branch `feat/admin-tables-unify` from `main` (47ec998).
- Both screens already share `useVenue`/`commitVenue` inside `VenueGate`; keep the two UI state machines independent.

## Delivery strategy
`ask-on-risk`. Forecast ~300–450 authored lines (mostly moves and deletions).

## Tasks
- [x] U1 Tabs + QR view inside management, redirect, nav/topbar cleanup, dead code removal, tests and docs. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Sidebar shows only "Gestión de mesas" for this area; `/tables/qr` and `/tables/qr?state=…` land on the management QR tab (moved states land on the matching management state).
- "Códigos QR" tab shows the QR list with filters, enable toggle, view/download/material/regenerate, and "Imprimir códigos QR"; QR detail and material still work; no "Nueva mesa"/"Crear espacio" duplicates inside the QR tab.
- "Plano" tab unchanged (modal create/edit).
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan created on `feat/admin-tables-unify` (from `main` at 47ec998).
- U1 (delegated writer):
  - RED: `npx vitest run src/features/table-management/tables-view.test.ts` → failed (module `./tables-view` missing, no tests ran). GREEN: 7/7 passed after adding `tables-view.ts`.
  - Checks: `npx vitest run` → 55 files, 731 tests passed; `npm run lint` → clean; `npx tsc --noEmit` → clean; `npm run build` → success (`/tables/qr` dynamic ƒ, `/tables/management` static).
  - Runtime smoke (`next start`): `/tables/qr?state=edit` streams `NEXT_REDIRECT;replace;/tables/management?state=table-edit;307` (client-side redirect after the layout shell, HTTP 200). No browser check of the tabs.
  - Files: `table-management/tables-view.ts(+test)` (tab parsing, tab hrefs, legacy `/tables/qr` redirect mapping); `TableManagementScreen.tsx` ("Plano"/"Códigos QR" link tabs with `aria-current`, shared frame, `PlanTab` + `TableQrPanel` mounted per view, "Códigos QR" header link removed); `table-qr/TableQrScreen.tsx` → `TableQrPanel.tsx` (no `VenueGate`, list laid out by the host `frame`, "Imprimir códigos QR" as header action, no "Nueva mesa"/`MOVED_STATES`, row "Editar" → `/tables/management?table=<id>`); `SpacesManagement.tsx` deleted, `ListView.spaces` dropped; `TABLE_QR_FORCED_STATES` moved to `table-qr-state.ts` (server-importable); `app/(admin)/tables/qr/page.tsx` → `redirect(getLegacyQrRedirect(state))` with `instant = false`; nav `table-qr` item, `credentials` topbar, `TOPBAR_TABLE_MANAGEMENT` and `secure` badge removed; tests, README and comments updated.
  - Decisions: tabs are `Link`s (`replace`, `scroll={false}`) in a `nav` with `aria-current`, since each tab is a URL; the QR panel takes a `frame` render prop so `table-qr` does not import `table-management`; QR detail/material keep replacing the page and return to the list with their close/back actions; `TableQrParts.tsx` stays in `table-qr` (no churn); `instant = false` because Cache Components refuses `searchParams` outside `<Suspense>` at prerender.
  - Size: `git diff --stat` 16 files, +281 / −242 (before this doc update).
  - Commit 9738f75. Parent spot check: `npx tsc --noEmit` clean. Review assess (base 47ec998, committed-only): medium, `slice_budget_reached`; native review consent declined by the user for this candidate.

## Next step
Optional browser check of both tabs; then push / PR (user decision).
