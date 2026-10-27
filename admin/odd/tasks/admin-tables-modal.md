# Feature: admin-tables-modal

## Objective
On `/tables/management`, creating and editing a table or a space happens in a centered modal that opens only on that action, instead of a form that is always visible in the right panel.

## Problem / Why
The right panel (`TableManagementScreen.tsx` `aside`) always shows a form: the selected or new table (`TableForm`), otherwise the active or new space plus the "Espacios" list (`SpacePanel`). User decision (2026-10-27): the create/edit form must appear only when the action runs, in a centered modal; option 1 — both create and edit use the modal.

## Scope
- In scope: modal for new/edit table and new/edit space; no form visible by default; the right panel keeps only the "Espacios" list (select, reorder, plus an edit affordance per space); plan selection highlight while editing; delete from the modal through the existing confirm dialog; deep links `?table=` / `?space=` and `?state=` previews open the matching modal; tests updated.
- Out of scope: API changes, `/tables/qr` and `/tables` screens, visual redesign of the form fields.

## Constraints
- Branch `feat/admin-tables-modal` from `main` (878ac85).
- Reuse shared UI patterns (`ConfirmDialog`, `BulkPrintModal`) for focus handling; accessible dialog (`role="dialog"`, `aria-modal`, focus trap, Escape, return focus).

## Delivery strategy
`ask-on-risk` (inherited). Forecast ~300–450 authored lines.

## Tasks
- [x] M1 Modal create/edit for tables and spaces; right panel reduced to the spaces list; state + tests. Route: delegated (2+ non-trivial files). Commit 460eef5.

## Acceptance criteria
- Landing on `/tables/management` shows no form; "Nueva mesa", the plan's empty-state action, "+" on the space tabs, clicking a table on the plan and editing a space open the centered modal.
- Cancel, Escape, the scrim and the close button close it without changes; a successful save closes it; a failed save keeps it open with the errors.
- Delete still goes through the confirm dialog and closes the modal when done.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build; Playwright/visual check of the modal when the local API is up.

## Progress / Evidence
- Plan created on `feat/admin-tables-modal` (from `main` at 878ac85).
- M1 (route: delegated writer; trigger: 2+ non-trivial files) — commit 460eef5, 10 files, +542/−312 (+395/−165 ignoring whitespace; `SpacePanel.tsx` re-indented when split, so above the ~400 heuristic only by the re-indent).
  - RED: updated `management-state.test.ts` + new `src/shared/ui/focus-trap.test.ts` → 23 failing tests + missing `focus-trap` module (24 passing).
  - GREEN: `npx vitest run` 53 files / 723 tests passed; `npm run lint` clean; `npx tsc --noEmit` exit 0; `npm run build` succeeded (`/tables/management` static).
  - Browser/visual check not run: the page needs a signed-in API session and no owner credentials were available.
  - Decisions: state `modal: Panel | null` + `saving`; new action `edit-space` (pencil in the list, `?space=<id>`, forced `space-edit` / `delete-space`); `select-space` only switches the plan. A valid save keeps the modal open marked `saving` ("Guardando…", duplicate saves ignored); `settleManagement` closes it (and picks the API-assigned id of a created space); `failManagement` restores it with errors. Confirmed delete/disable closes the modal; a refusal restores it. "Sin cambios" closes it. `?space=<id>` together with `?table=` only picks the plan behind the table modal.
  - UI: shared `Modal` (`src/shared/ui/Modal.tsx`, exported from the ui index): centered, full-viewport scrim z-30 (below `ConfirmDialog` z-40), `role="dialog"`, `aria-modal`, `aria-labelledby` the form title, focus to first field, Tab trap via pure `getTrapTarget`, Escape / scrim / "Cerrar" (X) close, focus back to the opener when it still exists. Form titles became `h2` 17px like `ConfirmDialog`. Aside narrowed 360 → 320px, labelled "Lista de espacios", only the "Espacios" list with a per-row "Editar <name>" pencil.
  - Known edge: a settle of an unrelated earlier commit arriving while a save is pending would also close the modal (saving is a single flag, not per-commit).

## Next step
Parent: native review assessment for 460eef5, then optional browser check of the modal with a signed-in session.
