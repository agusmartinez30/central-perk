# Feature: admin-api-auth

## Objective
Replace the admin's mock staff session with the real API auth flow: login, MFA verification, session guard backed by `GET /auth/me`, and logout.

## Problem / Why
The admin authenticates against `src/mocks/auth` and keeps a fake session in Web Storage (`src/features/auth/session.ts`); `AuthGuard` only reads that storage. The API (`api/src/modules/auth`, branch chain `feat/api-foundation` → `feat/api-auth` → `feat/api-venue`) already issues an httpOnly session cookie with `POST /auth/login`, `POST /auth/mfa/verify`, `POST /auth/logout` and `GET /auth/me`. User decision (2026-10-27): option 1, the full session flow, removing the mock session entirely so there is a single source of truth.

## Scope
- In scope: same-origin proxy (Next `rewrites` `/api/*` → API base URL from env); typed auth client (login, verify MFA, logout, me) with error mapping; `LoginScreen` and `VerifyScreen` call the API (`mfa_required` → `/verify`, `authenticated` → `/`); `AuthGuard` and session state come from `/auth/me`; logout calls the API; mock session storage and mock credential checks removed; `?state=error` forced states kept; env documented.
- Out of scope: forgot/reset password screens (stay on mocks), other API modules (venue, etc.), server-side (proxy/middleware) route protection.

## Constraints
- Next.js version in `node_modules/next` has breaking changes: read `node_modules/next/dist/docs/` before using `rewrites`/env.
- Cookie stays first-party through the proxy; no CORS changes in the API.
- Branch `feat/admin-api-auth`, stacked on `feat/api-venue` (the API auth module is not on `main` yet).

## Delivery strategy
`ask-on-risk` (inherited). Forecast ~350–500 authored lines.

## Tasks
- [x] A1 Proxy + auth API client: `next.config.ts` rewrites, env (`API_URL`), typed client for login / verify / logout / me with error mapping, unit tests first. Route: delegated (2+ non-trivial files).
- [x] A2 Wire screens and session: Login/Verify call the API, session state and `AuthGuard` from `/auth/me`, logout via API, remove the Web Storage session and mock credential checks, tests updated. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Valid credentials without MFA land on `/`; with MFA they go to `/verify`, and a valid code lands on `/`.
- Wrong credentials / wrong code show the existing error copy; 429 shows a throttling message.
- Visiting an admin route without a valid cookie redirects to `/login`; logout clears the session and returns to `/login`.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build; manual/Playwright smoke against the local API when it is running.

## Progress / Evidence
- Plan created on `feat/admin-api-auth` (from `feat/api-venue` at 7ce433b).
- A1 done (cb06da7, route: delegated writer): `next.config.ts` keeps its redirects and adds `rewrites()` `/api/:path*` → `${API_URL}/:path*` (array form, so it runs after pages/public files; idiom of `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`). `API_URL` is server-only, defaults to `http://localhost:3001` (the API's default `PORT`) and is read when the config loads, so it is baked into `.next/routes-manifest.json` at build (observed `localhost:3001/:path*` there). Documented in the README "API" section; no `admin/.env.example` because the admin `.gitignore` ignores `.env*`. `src/features/auth/auth-api.ts`: `login`, `verifyMfa`, `logout`, `fetchCurrentStaff` over `/api/auth/*` with `credentials: "same-origin"`, returning `AuthResult<T>`; errors: `invalid_credentials` / 400 on login → `invalid-credentials`, `invalid_mfa_code` / 400 on verify → `wrong-code`, `invalid_session` or any other 401 → `invalid-session`, 429 → `throttled`, rejected fetch → `network`, anything else or a malformed body → `unknown`. Test-first (`auth-api.test.ts`, `fetch` stubbed): RED = file failed to import the missing `./auth-api` (no tests ran); GREEN 11/11. Checks: lint OK, tsc OK, vitest 684/684 (50 files), build OK (all routes static).
- A2 done (9bc3cbc, route: delegated writer): `session.ts` / `session.test.ts` (Web Storage) removed. `session-store.ts`: `createSessionStore(fetchStaff)` external store (`unknown` on the server and until `GET /auth/me` answers, then `ready` with `staff` or `null`; the first subscriber triggers one load; a sign-in/out during the load wins over its late answer), the app instance `sessionStore` and `signOutStaff()` (`POST /auth/logout`, then local sign-out even if the request fails). `use-session.ts` reads it with `useSyncExternalStore`; `AuthGuard` keeps its semantics (renders children, `router.replace("/login")` once ready without staff). `auth-errors.ts` maps client errors to screen errors (`toLoginError`: invalid-credentials / throttled / unavailable; `toVerifyError`: wrong-code / throttled / session-expired / unavailable) and holds the shared copy "Demasiados intentos. Esperá un minuto y volvé a intentar." and "No pudimos conectarnos con el servidor. Probá de nuevo en unos segundos.". `LoginScreen` calls `login` (trimmed email, "Recordarme" → `remember`; `mfa_required` → `/verify`, `authenticated` → `sessionStore.signIn` + `/`); `VerifyScreen` calls `verifyMfa` (`invalid_session` → `router.replace("/login")`); the 600 ms mock delays are gone; `?state=error` forced states unchanged. Shell: `AdminTopbar` reads the session staff (name, role label Titular / Gerente / Personal; blank while unknown) instead of `DEMO_STAFF`; new sidebar "Cerrar sesión" (`LogoutButton`, `mt-auto`, nav-item styling). README: intro, "Signing in" (seeded API owner, MFA, cookie, guard, logout, 429 copy) replaces the demo-credentials table. Test-first: RED = `session-store.test.ts` and `auth-errors.test.ts` failed to import their missing modules (no tests ran); GREEN 8/8. Checks: lint OK, tsc OK, vitest 690/690 (51 files), build OK (19 pages, all static).
- A2 smoke (`next start -p 3107` against the API already running on 3001): through the proxy `GET /api/auth/me` → 401 `invalid_session`; `POST /api/auth/mfa/verify` without a session → 401 `invalid_session`; `POST /api/auth/logout` → 204 with `Set-Cookie: cp_session=; ... HttpOnly; SameSite=Lax` passed through; the 5th login attempt within a minute → 429. Playwright (cached chromium): `/` → `/login` (guard), `/login?state=error` shows the invalid-credentials copy, `/verify` without a pending login → `/login`, wrong login while throttled shows the 429 copy. Not verified: login → me → logout with a real account. `POST /auth/login` returns 500 also when called directly on the API (`:3001`), so it is an API/runtime issue, not the proxy (unconfirmed lead: `api/.env` `DATABASE_URL` points at 5432 while the dev Postgres container listens on 5434; `/auth/me` without a cookie and `/health` do not touch the database), and the seed owner's credentials are not in `.env`; the admin shows the "No pudimos conectarnos…" copy for it.
- Open: `src/mocks/auth.ts` (`DEMO_CREDENTIALS`, `authenticateStaff`, `verifyStaffMfaCode`) is no longer used by any screen; only `src/mocks/auth.test.ts` uses it (outside this task's edit surface), so both were kept. Other modules still use `DEMO_STAFF` for audit names (out of scope).

- Password policy relaxed (user decision 2026-10-27, route: inline): minimum length 12 → 6 (6911ce2) and the guessable-password rule removed in API and admin (7f6cfec); test-first, RED 1+2 then 6+2 failing, GREEN api 68/68, admin 689/689; tsc and lint OK in both. The user confirmed the real login against the API works from the admin.
- RDD for A1–A2: assessed high (`hot_path` auth, 20 paths, 843 lines); the preflight STATUS asked for an `intended_untracked_selection` whose exact JSON schema is not documented, one submission was refused (`invalid_request`), so no review ran.

## Next step
Decide whether to delete `src/mocks/auth.ts` and its test; push / PR are the user's decision.
