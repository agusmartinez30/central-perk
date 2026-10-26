# Bill Requests Optimized

## Objective

Update `/bill-requests` to match the operational ADMIN 04 desktop proposal while preserving canonical service-day data and existing cross-screen invariants.

## Problem

The current screen uses generic metrics, a two-row filter area, plain table rows, and an overlay detail drawer. The optimized proposal requires operational metrics, a compact toolbar, contextual rows and actions, and a persistent in-layout detail panel.

## Why

Staff need to prioritize bill requests, identify payment verification work, inspect consumption details, and advance each request without losing board context.

## Scope

- Extend the bill-request projection with the detail and workflow data needed by the optimized view.
- Add deterministic view helpers and reducer transitions with test-first evidence.
- Redesign the header, metrics, toolbar, request table, and empty states.
- Replace the overlay drawer with a persistent accessible detail panel.
- Preserve shared service-day fixtures unless a derived projection is sufficient.

## Constraints

- Do not modify `web/exports/*.html` or `.codegraph/**`.
- Preserve shared table, overview, collection, and service-day invariants.
- Keep the existing Suspense boundary around `useSearchParams`.
- Generated technical artifacts and UI copy remain in the project's existing language.
- About 400 authored lines per task is an advisory planning heuristic, not a quality cap.

## Authorized scope

- `admin/src/features/bill-requests/*.ts`
- `admin/src/features/bill-requests/*.tsx`
- `admin/src/mocks/types.ts`
- `admin/src/mocks/service-day/types.ts`
- `admin/src/mocks/service-day/day.ts`
- `admin/src/mocks/service-day/derive.ts`
- `admin/src/mocks/service-day/service-day.test.ts`
- `admin/odd/tasks/bill-requests-optimized.md`

## Tasks

- [x] **BR-1 — Extend the bill-request view model and workflow**
  - Route: delegated direct.
  - Trigger evidence: test-first domain work spans multiple non-trivial projection, helper, fixture, and test files.
  - Acceptance: metrics, status/payment filters, sorting, default selection, consumption detail, timeline, and contextual actions are deterministic and covered by focused tests.
  - Checks: focused bill-request view/state tests and service-day invariant tests.
  - Evidence: RED observed 15 focused failures before implementation; GREEN/REFACTOR observed 72 focused tests passing. `npm run lint` and `npx tsc --noEmit` passed. Canonical service-day identities remain unchanged while request history now derives payment verification, consumption, and guarded workflow context. Work-unit commit is pending the parent transaction controller.
- [ ] **BR-2 — Implement the optimized operational board**
  - Route: delegated direct.
  - Trigger evidence: the visual update spans multiple non-trivial screen, header, toolbar, table, tag, and state files.
  - Acceptance: at 1440×900 the screen has the compact header/metrics/toolbar, dense contextual table, persistent 362px panel, selected-row styling, and coherent empty/no-result states.
  - Checks: focused tests, lint, TypeScript, build, and runtime visual inspection.
  - Evidence: pending.
- [ ] **BR-3 — Verify the integrated workflow and accessibility**
  - Route: delegated direct verification.
  - Trigger evidence: full checks and browser-level behavior should not inflate the orchestrator context.
  - Acceptance: selection and contextual actions update rows, metrics, timeline, and panel coherently; keyboard controls retain visible focus and semantic labels.
  - Checks: full test suite, lint, typecheck, production build, and `/bill-requests?state=selected|empty|no-results` runtime checks.
  - Evidence: pending.

## Delivery

- Strategy: `single-pr`.
- Forecast: approximately 925–1,190 authored changed lines across three coherent work units, excluding generated files.
- Chain strategy: keep every work-unit commit on `feat/bill-requests-optimized` and integrate the branch only after the feature is complete.
- Reviewed boundary: branch point `8eb6d3f`.
- Running authored lines: 460 projected for BR-1; parent-owned work-unit commit pending.
- PR slices: pending.

## Progress

- Feature branch created: `feat/bill-requests-optimized`.
- Reference and current implementation mapped with path-level evidence.
- User selected a single feature branch for all work-unit commits.
- BR-1 implementation and verification completed with canonical service-day invariants preserved.
- Next step: create the parent-owned BR-1 work-unit commit, then implement BR-2 against the extended projection and reducer API.
