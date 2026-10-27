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
- [ ] A2 Wire screens and session: Login/Verify call the API, session state and `AuthGuard` from `/auth/me`, logout via API, remove the Web Storage session and mock credential checks, tests updated. Route: delegated (2+ non-trivial files).

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

## Next step
A2.
