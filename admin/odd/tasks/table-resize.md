# Table resize on the floor plan

## Objective
Let admins size tables on the `/tables/management` plan editor: drag any border (or corner) of a table to the size they want, with a visible resize affordance, so a 6-seat table can be a long rectangle instead of the same fixed box as a 2-seat one.

## Problem / why
`TableLayout` (`src/mocks/service-day/types.ts:134`) is `{ x, y, shape: "rect" | "round" }` and every table renders as a fixed 150×132 box, regardless of capacity. The user wants custom-size rectangular tables, resized directly on the canvas.

## Scope
- Add width/height to the table layout (defaults keep today's look), with min size by capacity, grid snapping and plan-bounds clamping.
- Resize gesture in `PlanEditor.tsx`: grab zones along every border and corner, hover highlight, resize icon badge; round tables keep their aspect.
- Every screen that renders the layout (02 live plan, editor) uses the stored size.

Out of scope: new shapes beyond rect/round.

## Constraints
- No new dependencies. Reuse the existing `plan-drag.ts` / `management-state.ts` patterns.
- Vitest runs in node: test pure modules.
- UI copy in Spanish; code in English.
- Prior art (tested logic to port): `coffee-prototipe/admin` branch `feat/table-floor-plan-editor`, `src/features/floor-plan/floor-plan.ts` (`resizeTable`, `minSizeFor`, origin-snapshot drag) and `FloorTableNode.tsx` (grab zones, `MoveDiagonal2` badge).

## Tasks
- [x] T1 — Layout size model + pure resize logic + tests (RED first). Route: delegated (writer trigger: 2+ non-trivial files across venue, table-management, tables, mocks).
  - `TableLayout` gains `width`/`height` (box incl. chairs, default 150×132); seed Mesa 08 (6 seats, Terraza) is 184×132.
  - `venue/table-layout.ts`: size-aware `clampToPlan`/`boxesOverlap`/`resolveMove`, `getSeatsBySide`, `getMinTableSize` (chairs' room, 8px snapped), `getResizedLayout` (8 handles, snapped total delta from the drag snapshot, min/plan clamp, round keeps proportions), `resolveResize`/`resizeTable`.
  - `resize-table` action in `venue-state.ts` and `management-state.ts` ("Mesa 01: tamaño actualizado." / "… no entra con ese tamaño: se superpone con …").
  - `tables/floor-plan.ts`: `getChairs(capacity, size)` centers chair rows on the stored box, `getTableBody(size)`, `PlanTable.width/height`, size-aware `getFitTransform`.
  - Evidence: RED observed (table-layout 23 failed; venue-state 1; management-state 4; floor-plan 5), then GREEN. Checks: `npx vitest run` 562 passed; `npx tsc --noEmit` exit 0; `npm run lint` clean.
  - Edit surface widened (user-approved) to `venue/table-layout(.test).ts`, `venue/venue-state(.test).ts`, `venue/table-config.test.ts`.
  - Commit: `71cca7f` feat(tables): store table size in the layout and add pure resize logic.
- [x] T2 — Resize gesture and affordance in the plan editor; live plan renders stored size. Route: delegated (same writer; 3+ UI files).
  - `plan-drag.ts`: size-aware `getDragPoint`/`getArrowMove`, `getGrabZone` (14px borders between 18px corners, zoom-independent), `RESIZE_CURSORS`.
  - `PlanEditor.tsx`: grab zones on every border and corner of every table (no selection needed; `stopPropagation` so a resize never starts a move), brand highlight line on the hovered border, `MoveDiagonal2` badge on the bottom-right corner (hover/selected/resizing), resize cursors, live preview with chairs re-spread and red "No entra acá" over another table; release dispatches `resize-table`. Hint: "Arrastrá cualquier borde de la mesa para cambiar su tamaño."
  - `FloorPlan.tsx` (02): `TableFigure` draws body and chairs from the stored size; selection check follows the right border.
  - Evidence: RED observed (plan-drag 6 failed), then GREEN. Checks: `npx vitest run` 568 passed; `npx tsc --noEmit` exit 0; `npm run lint` clean; dev server answers 200 on `/tables/management` and `/tables`. Pointer interaction not exercised in a browser (pending manual check).
  - Commit: `067d219` feat(floor-plan): resize tables by dragging any border with a resize badge.

## Acceptance criteria
- Dragging a rect table's border changes only that dimension; corners change both; snapped, clamped to min size and plan.
- Round tables resize from any border with aspect locked.
- Resize icon visible on hover/selection; cursor shows the resize direction.

## Checks
`npx vitest run`, `npx tsc --noEmit`, `npm run lint` (in `admin/`), manual check on `/tables/management`.

## Delivery
Branch `feat/table-resize` from `feat/admin-table-management` (22e2475). Strategy: feature-branch-chain (user choice); forecast under ~400 lines.

## Progress
- Feature document created.
- T1 done (see checklist).
- T2 done (see checklist).

## Next step
Manual check on `/tables/management` (drag borders/corners of rect and round tables, badge, cursors, overlap refusal) and `/tables` (Mesa 08 drawn 184 wide). Known gap: raising capacity in the form does not grow a box below the new minimum; the next resize clamps it.
