# Feature: admin-tables

## Objective
Implement module 02 "Gestión de Mesas" from `exports/ADMIN 02 · Gestión de Mesas · Desktop-export.html` inside the admin shell built in `admin-foundation`.

## Problem / Why
The sidebar entry for tables currently shows the "Próximamente" placeholder. Staff need a live view of every table: status, orders, account total, alerts and payment preference.

## Scope
- In scope: tables management screen (summary metrics, status chips filter, search, grid/list view toggle, table cards with status badge, order count, account total, alerts and payment preference, and any side panel shown in the export), typed mock data, pure filtering/aggregation helpers with tests, `?state=` variants for empty/no-results if they make sense.
- Out of scope: 09A–09F (QR management), orders module (03), bill requests (04), real backend.

## Constraints
- Same conventions as `odd/tasks/admin-foundation.md`: Next 16.4.2 (read `node_modules/next/dist/docs/` before using APIs), Tailwind v4 tokens in `src/app/globals.css`, feature folders, container/presentational split, Spanish UI copy, English code.
- Reuse existing shell, tokens and `src/shared/ui` primitives; add new primitives there only when reusable.
- Branch `feat/admin-tables`, stacked on `feat/admin-foundation` (chain strategy for PRs still pending the user's decision).

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [ ] T1 Tables mock data + pure helpers (status counts, summary metrics, filter by status/search) test-first. Route: delegated (preparation + 2+ non-trivial files).
- [ ] T2 Tables management screen (metrics, chips, search, grid/list toggle, table cards, side panel) wired to the sidebar route. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- The route renders inside the admin shell and visually matches the 02 export at 1440×900.
- Filters, search and grid/list toggle work against the mock data.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
