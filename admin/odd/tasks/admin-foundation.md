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
- [x] T1 Tokens, fonts and admin shell (sidebar nav for all modules, top bar) from 10A; shared UI primitives. Route: delegated (2+ non-trivial files). Commit: 23d876d
- [x] T2 Auth screens 11A–11D with mock auth and pure validation helpers (+tests). Route: delegated (2+ non-trivial files). Commit: 72a6c84
- [x] T3 General overview 10A with mock metrics (+tests for pure aggregation). Route: delegated (2+ non-trivial files). Commit: dd7ecaa

## Acceptance criteria
- Each route visually matches its export at 1440px width.
- Login → MFA → overview flow is navigable; forgot/reset reachable from login.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Mock data superseded (admin-mock-unification): the per-screen mocks below were replaced by the single service day in `src/mocks/service-day`, from which the 10A overview now derives; cross-screen coherence wins over per-export fidelity. The values that changed versus the exports, and why, are listed in `odd/tasks/admin-mock-unification.md`.
- T0 done (42fd059): config copied from `../web` (no create-next-app prompts), `npm install`, `screen-state` helpers ported with their tests. Checks: tsc OK, lint OK, vitest 3/3, build OK.
- T1 done: `@theme` tokens from the exports (cream, ink, muted, line, brand, brand-wash, sand, success/warning/danger + bg, radii 6–16px, auth/drawer/modal shadows), DM Sans via next/font, `(admin)` route group with `AdminShell` (sidebar + top bar), `ComingSoon` placeholder for 12 non-implemented modules. Navigation helpers test-first (RED: missing module; GREEN: 7/7). Sidebar = 10A order plus "Personal y permisos" from 12A (10A omits it). Checks: tsc OK, lint OK, vitest 10/10, build OK (14 static routes).
- T2 done: `(auth)` route group with brand panel; `/login` (11A), `/forgot-password` (11B), `/reset-password` (11C), `/verify` (11D). Mock auth in `src/mocks/auth.ts` (demo credentials in README), Web Storage session + `AuthGuard` on `(admin)`. Shared UI: `PrimaryButton`, `TextButton`, `TextField`, `PasswordField`, `Checkbox`, `Notice`. Test-first: `validation.test.ts`, `mocks/auth.test.ts`, `session.test.ts` (RED: modules missing; one GREEN fix for the MFA regex). `?state=` variants: login `error`, forgot `sent`, reset `mismatch|success`, verify `error`. Error/success copy for those variants is not in the exports (documented deviation). Checks: tsc OK, lint OK, vitest 29/29, build OK (18 static routes), `next start` smoke: all auth/admin routes 200, headless screenshots of 11A/11D at 1440×900 match the exports.
- T3 done: `/` renders `OverviewScreen` (10A) from the typed `OVERVIEW_SNAPSHOT` mock: header with period filter and refresh, scope notice, 4 KPIs, attention orders, bill requests, tables grid, hourly sales + financial summary, best sellers and quick actions. Pure helpers in `overview-view.ts` written test-first (RED: missing mock/module; GREEN after fixing one wrong expected ratio in the test); `formatPrice` ported from `../web` with its tests. Global `line-height: normal` added to match the exports. Deviations: period filter is visual only (single "today" snapshot); bill rows put "Ver detalle →" on the warning line so three rows fit the 250px panel. Checks: tsc OK, lint OK, vitest 48/48, build OK (20 static routes), headless screenshot of `/` at 1440×900 matches 10A; unauthenticated `/` redirects to `/login`.

- RDD for T0–T3 (committed-only vs main): assessed high (`high_risk`: auth, payments paths); the user declined review for this candidate. Parent spot check: vitest 48/48.

## Next step
Human review of the branch; chain strategy decision before opening PRs (forecast exceeded 400 lines). Next modules: 02 Mesas, 03 Pedidos, 04 Solicitudes de cuenta.
