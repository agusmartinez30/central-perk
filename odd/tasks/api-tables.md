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
- [x] T2 Infrastructure + HTTP: Prisma models + offline migration, repositories, token generator, activity adapter, controller (guarded + public), error filter, Zod schemas, seed, e2e tests, README. Route: delegated (2+ non-trivial files).
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
- T2 (route: delegated writer, 2+ non-trivial files; ~1,040 authored lines incl. the 82-line generated migration and ~200 lines of e2e). Over the 400 heuristic because schema, migration, repository, adapters, controllers, seed, docs and e2e ship together as the module's outer layers. RED/GREEN: no separate RED observed for T2: the e2e spec was written after the controller and passed on its first run apart from a test-harness failure (429 from the 5/min login throttle, fixed by signing in once); the domain behavior it exercises was test-first in T1. Checks: `npm run lint` clean; `npm run typecheck` clean; `npm test` 16 files / 120 tests passed (8 new e2e); `npm run build` ok; `npx prisma validate` valid. Seed data checked against the domain rules with `tsx` (no issues). Local smoke (dev Postgres on 5434): `prisma migrate deploy` applied `20261027120000_tables`; `db:seed` created 3 spaces / 12 tables and a second run kept them; fresh build on port 3011: `GET /tables/qr?number=07&token=4pX9kR2mL7` 200 `{ number: 7, label: "Mesa 07", spaceName: "Salón" }`, revoked token and wrong number 404, `GET /tables/config` and `POST /tables/tbl_07/qr/regenerate` without cookie 401, owner login + `GET /tables/config` 200 (Mesa 07 version 18, audit [118]). Commit `a4b1400`.
- T2 decisions: routes under `/tables` (`/tables/config`, `/tables/spaces[/:spaceId[/move]]`, `/tables[/:tableId[/enable|/disable|/position|/size|/shape|/qr/regenerate]]`, public `GET /tables/qr?number=&token=`), two controllers so the public route has no guard. Status codes: `404` not found, `400` rule/shape violations with `issues`, `409` state conflicts (space with tables or last space, open session, history, overlap); venue only had `400`/`404`, so `409` is new and documented. Credentials live in `table_qr_credentials` with `tableNumber`, `issuedById` (FK to staff, name joined into responses), `revokedAt`, unique `auditNumber`; `tableId` is set to null when the table is deleted, so token and number uniqueness spans deleted tables. Enums `SpaceIcon` (`MAP_PIN` ↔ `map-pin`), `SpaceTone`, `TableShape`. Layout stored as integers (move snaps to 8px; resize body requires integers). The seed is create-only at configuration level (skips entirely when any space, table or credential exists, so deleted tables never come back); credentials are issued by the seeded owner. No rate limit on the public QR route (62^10 token space).
- T2 follow-ups: `TableActivity` adapter reports no activity until table sessions exist; no DB constraint for "one active credential per table" (Prisma cannot express the partial index; the repository revokes before inserting); the seed's owner upsert still resets the owner password/MFA from env (pre-existing behavior).

## Next step
T3 (admin wiring).
