# Feature: admin-mock-unification

## Objective
Replace the per-screen mocks (overview, tables, orders, bill requests, collections, payments) with a single "service day" source of truth so the same table, order, bill request or collection shows the same data on every admin screen.

## Problem / Why
Each module copied the numbers of its own export, and the exports contradict each other: Mesa 05 waits 2 min in 02 and 12 min in 04/10A, Mesa 12/04 are free in 02 but in attention in 04, Mesa 02/07 have 0 kitchen orders in 02 but orders in preparation in 03, 04's finalized Mesa 09 has no 05 collection, and 10A's individual payments differ from 05. The prototype must tell one coherent story.

## Decision
User decision (2026-10-23): **cross-screen coherence wins over per-export fidelity**. Metrics and rows are derived from the single source; some numbers will no longer match their export. Layout, copy and visual design stay as they are.

## Scope
- In scope: one canonical dataset in `src/mocks` (staff, tables, customers, orders with items, bill requests, collections, payment methods/request modes), pure derivation helpers (table status from orders/bill requests, overview KPIs, metrics), migrating every feature to read from it, updating tests to assert coherence (cross-screen invariants), updating feature docs' "known mock gaps" notes.
- Out of scope: visual changes, new screens, backend.

## Constraints
- Conventions of the previous feature docs. Pure functions tested first.
- Keep each screen's export as close as possible while staying coherent (prefer reusing export values when they don't conflict).
- Keep `?state=` variants working.
- Branch `feat/admin-mock-unification`, stacked on `feat/admin-payments`.

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [ ] T1 Canonical service-day dataset + derivation helpers + cross-screen invariant tests (test-first). Route: delegated (preparation + 2+ non-trivial files).
- [ ] T2 Migrate overview (10A) and tables (02) to the canonical source. Route: delegated (2+ non-trivial files).
- [ ] T3 Migrate orders (03), bill requests (04), collections (05) and payments method names (06). Route: delegated (2+ non-trivial files).
- [ ] T4 Remove dead per-screen mocks, update README and the "known mock gaps" in previous feature docs. Route: delegated.

## Acceptance criteria
- Invariant tests pass, e.g.: every table's status in 02 agrees with its orders (03) and bill requests (04); overview KPIs equal the sums of the underlying rows; today's collections (05) include every finalized bill request (04) with the same total; method names match 06.
- All screens render, `?state=` variants work.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build, screenshots of every module.

## Progress / Evidence
- (pending)

## Next step
T1.
