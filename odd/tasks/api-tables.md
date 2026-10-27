# Feature: api-tables

## Objective
First slice of the `tables` API module (api-foundation T5): table **configuration** — spaces, tables, floor-plan layout and QR credentials — served by the API, with the admin's table-management, table-qr and tables screens wired to it.

## Problem / Why
The admin keeps table configuration in an in-memory store (`admin/src/features/venue/venue-store.ts`, reducer `venue-state.ts`, rules in `venue/{space-config,table-config,table-removal,table-layout}.ts` and `table-qr/{qr-config,qr-token}.ts`). The QR token, date and staff name are produced by the client. User decision (2026-10-27): ship configuration first; live service (sessions, orders, charges) waits for `feat/tables-optimized` and the `orders`/`billing` modules.

## Decisions (defaults accepted by the user, 2026-10-27)
- Module `api/src/modules/tables`, same four layers and conventions as `venue` (`api/src/modules/README.md`).
- Server generates QR tokens (crypto-random, 10 alphanumeric chars, never reused); regenerating revokes the active credential with an audit number; disabling a table pauses its QR (credential kept), deleting revokes it.
- Public identity of a table is its `number` (never reused); ids are internal.
- Floor-plan rules (canvas, grid, no overlap, minimum size by capacity) are validated server-side, ported from the admin.
- "Cannot disable/delete with an open session or with history" goes through a table-activity port; until sessions exist its adapter reports no activity.
- Any authenticated staff may edit (no role guard exists yet). No optimistic concurrency on `version` (display/audit only), as in `venue`.

## Scope
- In scope: Prisma models + migration, domain rules, use cases, guarded admin endpoints (list; create/update/reorder/delete space; create/update/enable/disable/delete table; move/resize/reshape layout; regenerate QR), public `number + token` resolution for the web, seed from the admin's current mock configuration, unit + e2e tests, docs; admin store wired to the API.
- Out of scope: table sessions, orders, bill requests, charges, tips; web wiring; roles.

## Constraints
- Branch `feat/api-tables` from `main` (c74287a). Chain strategy `feature-branch-chain` (cached from api-foundation): one branch/PR per module.
- Admin Next.js has breaking changes: read `admin/node_modules/next/dist/docs/` before Next-specific code.

## Delivery strategy
`ask-on-risk`, chain `feature-branch-chain` (cached). Forecast ~1,800–2,400 authored lines (over the 400 heuristic: a module ships its layers, schema, seed, tests and admin wiring, as T2/T3 did).

## Tasks
- [x] T1 Domain + application: port admin rules (spaces, tables, layout, removal, QR) into `domain/`, use cases in `application/`, unit tests first. Route: delegated (2+ non-trivial files).
- [ ] T2 Infrastructure + HTTP: Prisma models + offline migration, repositories, token generator, activity adapter, controller (guarded + public), error filter, Zod schemas, seed, e2e tests, README. Route: delegated (2+ non-trivial files).
- [ ] T3 Admin wiring: venue store loads from and mutates through the API (proxy `/api`), server-issued QR tokens, error handling; tests updated. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Every admin configuration action on `/tables/management` and `/tables/qr` persists through the API and survives a reload.
- Domain rules match the admin's current behavior (same limits and blocked cases), with stable error codes.
- `GET` public resolution returns the table only for an enabled table with its active token.
- API: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx prisma validate`. Admin: lint, tsc, vitest, build.

## Checks
As above, plus a local smoke (migrate + seed + endpoints) when Postgres is up.

## Progress / Evidence
- Plan created on `feat/api-tables` (from `main` at c74287a).
- T1 (route: delegated writer, 2+ non-trivial files; ~1,390 authored lines, ~640 of them specs and in-memory fakes). Over the 400 heuristic because spaces, tables, layout, removal and QR rules ship with their use cases and tests as one domain slice. RED observed: 4 new spec files failed (modules not found) before GREEN. Checks: `npm run lint` clean; `npm run typecheck` clean; `npm test` 15 files / 112 tests passed (44 new); `npm run build` ok. Commit `c570c13`.
- T1 decisions: stable English issue codes (`{ path, code }`: `required | too_long | duplicate | unknown_space | out_of_range`) and error codes (`space_not_found`, `table_not_found`, `invalid_space`, `invalid_table`, `space_not_removable` with `reason: space_has_tables | last_space`, `table_has_open_session`, `table_has_history`, `table_overlap` with the conflicting table). Space ids are the admin slug (`barra-alta`, suffixed when taken); table ids stay `tbl_NN` derived from the number. Move direction is `up | down`. Layout ported as the admin resolves it: move snaps to 8px and clamps, resize rounds and clamps to the chairs' minimum and the 780×620 plan, only overlaps are refused; the drag-handle maths (`getResizedLayout`) stays client-side. Updating a table always bumps `version` (as `applyTableDraft`); enable/disable, move, resize and shape bump only on change. Disabling through the update form is refused with an open session too (the admin only checked the quick action). Numbers and audit numbers come from repository maxima that include deleted tables' retired credentials, so numbers are never reused even after deleting the highest table (the admin's `nextTableNumber` would reuse it). Token uniqueness: generator port + `isTokenTaken` check, at most 8 attempts. Every mutation returns the full `{ spaces, tables }` configuration.
- T1 deviation: `api/test/support/in-memory-tables.ts` landed in T1 (the use-case specs need it, as with venue).

## Next step
T2.
