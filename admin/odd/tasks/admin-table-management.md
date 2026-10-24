# Feature: admin-table-management

## Objective
Implement "Gestión de mesas" (`/tables/management`): the place where admins configure the venue — create, rename, reorder and delete spaces; create, edit, enable/disable, delete and place tables on the floor plan by dragging.

## Problem / Why
The sidebar has three table entries. "Gestión de mesas" is a placeholder, and table/space configuration currently lives inside "Mesas y códigos QR" (09A/09B). Each route keeps its own in-memory copy of the dataset, so configuration made in one screen never reaches the others.

## Decisions
- User (2026-10-24): move table and space creation/editing out of 09 into Gestión de mesas. 09 keeps only QR credentials and printing, with links to Gestión for configuration.
- Responsibilities: **Mesas** (`/tables`, 02) = live operation; **Gestión de mesas** = configuration; **Mesas y códigos QR** (`/tables/qr`) = credentials and printing.
- No export exists for this module: the UI reuses the 02 floor plan visuals and the 09B/09A forms.
- A shared client venue store (spaces + tables) is read by `/tables`, `/tables/management` and `/tables/qr` so changes propagate within the browser session.
- The "02 plan vs spaces" layout gap (export shows all 12 tables in one Salón) is deferred by the user.

## Scope
- In scope: shared venue store; moving config helpers from `table-qr` to `venue`; layout editing helpers (drag, snap, clamp, collisions, shape); space reorder/delete-when-empty; table delete only if it never had a session (otherwise disable); management screen; rewiring 09 and 02 to the store.
- Out of scope: the 02 layout gap, `web/` changes, backend persistence.

## Constraints
- Monorepo `coffee-prototipe-mono`, work in `admin/`. No new dependencies.
- Branch `feat/admin-table-management`, stacked on `feat/admin-table-qr`.
- Type scale 02/03; UI copy Spanish, code English.

## Delivery strategy
`ask-on-risk` (inherited). No PRs; fast-forward `main` and push only when the user says so.

## Tasks
- [x] T1 Shared venue store (`useSyncExternalStore`) + move `table-config`/`space-config` into `src/features/venue/` + new layout/space/delete helpers, test-first. Route: delegated.
- [x] T2 Management screen at `/tables/management`: plan per space in edit mode, space tabs with "+ Nuevo espacio", side panel with table and space forms, `?state=` variants. Route: delegated.
- [x] T3 Drag-and-drop (pointer + keyboard arrows) with snap/clamp/collision feedback, shape toggle, delete rules with confirmation. Route: delegated.
- [x] T4 Rewire 09 (QR-only; links to Gestión) and 02 (reads the store) + docs. Route: delegated.

## Acceptance criteria
- Creating space "Barra" and "Mesa 13" in it shows up in `/tables` (Barra tab) and in `/tables/qr` with a QR in the same session.
- Dragging a table changes its position on `/tables`.
- `service-day.test.ts` invariants and all existing tests pass; lint, tsc, vitest, build pass in `admin/`.

## Checks
lint, tsc, vitest, build, screenshots.

## Progress / Evidence
- T1 (delegated writer; trigger: 2+ non-trivial files) — commits `496c683` refactor(venue): move helpers, `fcbf4f5` feat(venue): store + rules.
  - `src/features/venue/`: `table-config.ts` (drafts, validation, `applyTableDraft`, enable rules, session statuses, `nextTableId`), `space-config.ts` (+ style, `moveSpace`, `getSpaceRemoval`/`deleteSpace`), `table-layout.ts` (`TABLE_BOX`, `PLAN_SIZE` 780×620, 8px `GRID_STEP`, snap/clamp/overlap, `resolveMove`/`moveTable`, `setTableShape`, overlap-aware `getFreeLayout`), `table-removal.ts` (delete only without session history, otherwise offer disable; blocked while a session is open), `venue-state.ts` (pure reducer), `venue-store.ts` (`useSyncExternalStore`). QR-only helpers stay in `table-qr/qr-config.ts`.
  - Store: in memory per browser session, no Web Storage. Server snapshot = seed = first client snapshot, so hydration never mismatches; client navigation keeps edits; a full reload resets. No token/audit counter needed: tokens come from `createUniqueQrToken` (screen) and audit ids from `nextAuditId`.
  - RED observed (missing modules/functions), then GREEN. Checks: build OK, tsc OK, lint OK, vitest 40 files / 518 tests passed.

- T2 (delegated writer) — commit `542706d` feat(table-management). ~1.7k lines incl. tests: one screen (container + plan editor + two forms + pure UI reducer); not split because each piece alone is not a usable unit.
  - `src/features/table-management/`: `management-state.ts` (pure UI reducer `reduceManagement(ui, action, venue)` returning the `VenueAction` for the store; views for plan, tabs, forms and the delete dialog; deep links; forced-state replay that skips venue actions), `TableManagementScreen.tsx`, `PlanEditor.tsx`, `TableForm.tsx`, `SpacePanel.tsx`, `FormField.tsx`. Extracted `TableFigure` and `ZoomControls` from the 02 `FloorPlan` (02 output unchanged), `SPACE_ICONS`/`SPACE_TONES` to `venue/space-icons.ts`, and a reusable `ConfirmDialog` in `src/shared/ui` (needed here for the delete variants, moved up from T3).
  - Nav: `/tables/management` uses the 02 `location` top bar (test-first in `navigation.test.ts`).
  - `?state=`: `table-edit`, `table-new`, `space-edit`, `space-new`, `delete-table` (Mesa 01: offers disabling), `delete-space` (Patio: blocked), `errors`. Deep links `?table=<id>|new`, `?space=<id>|new`.
  - Invented UI (no export): header links "Ver en vivo"/"Códigos QR", space tabs with counts + "Nuevo espacio", "Nueva mesa" in the plan toolbar, dotted 780×620 editable area, shape picker, space icon/color pickers, space list with up/down reorder, delete dialog copy.
  - RED observed for `management-state` (missing module) and the nav topbar test, then GREEN. Checks: build OK, tsc OK, lint OK, vitest 41 files / 540 tests. Screenshots `tm-plan`, `tm-table-form`, `tm-delete-table`, `tm-errors`, `tm-space-new` reviewed.

- T3 (delegated writer) — commit `ac80af4` feat(table-management): drag.
  - `plan-drag.ts` (pointer delta → plan units at the zoom, snapped + clamped; 4px click threshold; arrow keys 8px / Shift 40px), test-first (RED: missing module).
  - `PlanEditor`: pointer capture drag; live red "No entra acá" over another table; a refused drop snaps back with the notice "Mesa 01 no entra ahí: se superpone con Mesa 02."; the click ending a drag does not reselect; arrow keys on the focused table. Shape toggle and delete rules with confirmation came with T2.
  - `RegenerateDialog` now renders the shared `ConfirmDialog` (same copy, layout, focus and Escape/scrim behavior; screenshot `tm-regenerate`).
  - Checks: build OK, tsc OK, lint OK, vitest 42 files / 545 tests. Screenshots `tm-drag-result` (Mesa 07 dragged), `tm-drag-overlap` (held over Mesa 02), `tm-drag-refused`, `tm-space-form`, `tm-delete-space`.

- T4 (delegated writer) — commit `8cba01d` feat(table-qr): store + QR-only.
  - `/tables/qr`: spaces/tables/sessions from `useVenue()`; the pure `tableQrReducer` keeps only list/detail/regenerate/material/bulk actions, and the screen mirrors "toggle-enabled" and "confirm-regenerate" into the store (`set-table-enabled`, `regenerate-qr`). "Nueva mesa" → `/tables/management?table=new`, row "Editar" → `?table=<id>`, space cards → `?space=<id>`, "Crear espacio" → `?space=new`. `TableEditor.tsx` and the inline space form removed. Old `?state=` `edit`, `new`, `errors`, `space-edit`, `space-new` redirect (`router.replace`) to the matching Gestión variants.
  - `/tables` (02): spaces, tables and positions from the store; live rows from `getLiveTables(config, SERVICE_DAY)` (enabled tables by number, `deriveTable`; equals `TABLES_BOARD` for the seed, new tables are free). Test-first (RED: `getLiveTables` missing).
  - README routes/states/store section updated; note added to `admin-table-qr.md`.
  - Checks: build OK, tsc OK, lint OK, vitest 42 files / 538 tests (09 editor/space-form tests removed with the feature, replaced by a store-driven test). Screenshots: end-to-end in one browser page with client navigation — `tm-flow-1-management` (Barra created, Mesa 13 created in it), `tm-flow-2-tables` (Barra tab shows M13, "3 disponibles"), `tm-flow-3-qr` (Barra card "1 mesa"), `tm-flow-4-qr-detail` (Mesa 13 · Barra with its QR `?mesa=13&qr=…`); `tm-check-overview`, `tm-check-orders`, `tm-check-tables`, `tm-qr-list`, `tm-qr-legacy-edit` (redirect).
  - Acceptance: Barra + Mesa 13 visible in `/tables` and `/tables/qr` with a QR in the same session ✓; dragging changes the position read by `/tables` (same store) ✓; invariants and all checks pass ✓.

## Next step
User review; push / fast-forward `main` only when the user says so. Follow-ups: the 02 header still reads "Gestión de mesas" (export title) while the sidebar says "Mesas"; the 02 plan-vs-spaces layout gap stays deferred.
