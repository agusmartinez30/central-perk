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
- [ ] T1 Shared venue store (`useSyncExternalStore`) + move `table-config`/`space-config` into `src/features/venue/` + new layout/space/delete helpers, test-first. Route: delegated.
- [ ] T2 Management screen at `/tables/management`: plan per space in edit mode, space tabs with "+ Nuevo espacio", side panel with table and space forms, `?state=` variants. Route: delegated.
- [ ] T3 Drag-and-drop (pointer + keyboard arrows) with snap/clamp/collision feedback, shape toggle, delete rules with confirmation. Route: delegated.
- [ ] T4 Rewire 09 (QR-only; links to Gestión) and 02 (reads the store) + docs. Route: delegated.

## Acceptance criteria
- Creating space "Barra" and "Mesa 13" in it shows up in `/tables` (Barra tab) and in `/tables/qr` with a QR in the same session.
- Dragging a table changes its position on `/tables`.
- `service-day.test.ts` invariants and all existing tests pass; lint, tsc, vitest, build pass in `admin/`.

## Checks
lint, tsc, vitest, build, screenshots.

## Progress / Evidence
- (pending)

## Next step
T1.
