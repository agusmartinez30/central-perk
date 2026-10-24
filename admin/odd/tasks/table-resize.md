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
- [ ] T2 — Resize gesture and affordance in the plan editor; live plan renders stored size. Route: delegated.

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

## Next step
T2.
