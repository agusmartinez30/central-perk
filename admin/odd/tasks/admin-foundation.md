# Feature: admin-foundation

## Objective
Bootstrap the Café Central admin (staff back-office) as a frontend-only Next.js prototype, with the app shell, the auth flow (11A–11D) and the general overview dashboard (10A), built from the Pencil exports in `exports/`.

## Problem / Why
The 47 admin screens exist only as static design exports. We need a navigable base (stack, tokens, shell, auth) that every later module (orders, tables, payments, products, QR, staff, settings) plugs into.

## Scope
- In scope: project scaffold, design tokens, admin layout (sidebar + top bar), Login (11A), Forgot password (11B), Reset password (11C), MFA (11D), General overview (10A), mock data and mock auth.
- Out of scope: other modules (02–09, 10B–E, 11E, 12, 13), real backend, real auth.

## Constraints
- Same stack as `../web`: Next.js 16.4.2 (read `node_modules/next/dist/docs/` before using APIs), React 19, Tailwind v4 `@theme` tokens, lucide-react, clsx, vitest.
- Desktop-first (exports are 1440×900).
- UI copy in Spanish matching the designs; code, identifiers and comments in English.
- Feature-based architecture (`src/features/*`, `src/shared/*`, `src/mocks/*`), container/presentational split.

## Delivery strategy
`ask-on-risk`. Forecast exceeds 400 changed lines; chain strategy asked before opening PRs. Commits per task on `feat/admin-foundation`.

## Tasks
- [x] T0 Bootstrap: create-next-app (Next 16.4.2), deps, vitest, .gitignore (exclude `.atl/`). Route: delegated (part of the writer run). Commit: 42fd059
- [x] T1 Tokens, fonts and admin shell (sidebar nav for all modules, top bar) from 10A; shared UI primitives. Route: delegated (2+ non-trivial files). Commit: see Progress (T1 entry).
- [ ] T2 Auth screens 11A–11D with mock auth and pure validation helpers (+tests). Route: delegated (2+ non-trivial files).
- [ ] T3 General overview 10A with mock metrics (+tests for pure aggregation). Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Each route visually matches its export at 1440px width.
- Login → MFA → overview flow is navigable; forgot/reset reachable from login.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- T0 done (42fd059): config copied from `../web` (no create-next-app prompts), `npm install`, `screen-state` helpers ported with their tests. Checks: tsc OK, lint OK, vitest 3/3, build OK.
- T1 done: `@theme` tokens from the exports (cream, ink, muted, line, brand, brand-wash, sand, success/warning/danger + bg, radii 6–16px, auth/drawer/modal shadows), DM Sans via next/font, `(admin)` route group with `AdminShell` (sidebar + top bar), `ComingSoon` placeholder for 12 non-implemented modules. Navigation helpers test-first (RED: missing module; GREEN: 7/7). Sidebar = 10A order plus "Personal y permisos" from 12A (10A omits it). Checks: tsc OK, lint OK, vitest 10/10, build OK (14 static routes).

## Next step
T2.
