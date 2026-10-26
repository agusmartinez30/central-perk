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
  - Evidence: work-unit commit `b6fd3f6`; RED observed 15 focused failures before implementation; GREEN/REFACTOR observed 72 focused tests passing. `npm run lint` and `npx tsc --noEmit` passed. Canonical service-day identities remain unchanged while request history now derives payment verification, consumption, and guarded workflow context. RDD assessed `medium` with `slice_budget_reached`; native review remained unavailable at intended-untracked selection, so writer verification plus the parent reducer-test spot check is the verification of record and the reviewed boundary remains `8eb6d3f`.
- [x] **BR-2 — Implement the optimized operational board**
  - Route: delegated direct.
  - Trigger evidence: the visual update spans multiple non-trivial screen, header, toolbar, table, tag, and state files.
  - Acceptance: at 1440×900 the screen has the compact header/metrics/toolbar, dense contextual table, persistent 362px panel, selected-row styling, and coherent empty/no-result states.
  - Checks: focused tests, lint, TypeScript, build, and runtime visual inspection.
  - Evidence: work-unit commit `3f6323e`; compact 50px header, four 68px operational metrics, 46px toolbar, contextual table rows/actions, and the persistent non-modal 362px detail panel are wired to the BR-1 projection and reducer. The 72 focused tests, lint, TypeScript, and production build pass; component styling uses the documented structural verification exception because this repository has no jsdom/Testing Library boundary. RDD assessed `medium` with `slice_budget_reached`; native review again remained unavailable at intended-untracked selection, so writer verification plus parent focused tests and TypeScript spot checks are the verification of record.
- [x] **BR-3 — Verify the integrated workflow and accessibility**
  - Route: delegated direct verification.
  - Trigger evidence: full checks and browser-level behavior should not inflate the orchestrator context.
  - Acceptance: selection and contextual actions update rows, metrics, timeline, and panel coherently; keyboard controls retain visible focus and semantic labels.
  - Checks: full test suite, lint, typecheck, production build, and `/bill-requests?state=selected|empty|no-results` runtime checks.
  - Evidence: full candidate and correction commit `95fff6c` validated with 586 tests, lint, TypeScript, production build, and `git diff --check` passing. Production runtime smoke loaded `/bill-requests` plus `selected`, `empty`, and `no-results` states. The validator found no remaining severity findings after the displayed-count and focus-visible correction. Browser screenshot/DOM capture was unavailable after timing out, so exact 1440×900 pixel proof is explicitly skipped; source dimensions and semantic structure were verified instead.

## Delivery

- Strategy: `single-pr`.
- Forecast: approximately 925–1,190 authored changed lines across three coherent work units, excluding generated files.
- Chain strategy: keep every work-unit commit on `feat/bill-requests-optimized` and integrate the branch only after the feature is complete.
- Reviewed boundary: branch point `8eb6d3f`.
- Running authored lines: 1,240 across BR-1 commit `b6fd3f6` (460), BR-2 commit `3f6323e` (761), and correction commit `95fff6c` (19).
- PR slices: pending.

## Progress

- Feature branch created: `feat/bill-requests-optimized`.
- Reference and current implementation mapped with path-level evidence.
- User selected a single feature branch for all work-unit commits.
- BR-1 implementation and verification completed with canonical service-day invariants preserved.
- BR-2 implementation and verification completed with the persistent operational board.
- BR-3 verification and one bounded correction completed; exact 1440×900 screenshot proof remains unavailable.
- Next step: user visual acceptance, then integrate the feature branch when requested.
