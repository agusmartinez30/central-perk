# Feature: api-foundation

## Objective
Create a standalone backend in `api/` that both `admin/` and `web/` consume, replacing their in-memory mocks module by module.

## Problem / Why
`admin/` and `web/` simulate the backend with mock services (`shared/lib/delay.ts`). Two clients share the same data, so the backend must not live inside either Next app.

## Decisions
- User decision (2026-10-26): separate `api/` app in the monorepo; NestJS + Prisma + PostgreSQL + Zod. ("postgrest" in the request read as PostgreSQL.)
- Layout: screaming + hexagonal. `api/src/modules/<module>/{domain,application,infrastructure,http}`; cross-cutting code in `api/src/shared`.
- Validation: Zod schemas at the HTTP boundary through a shared `ZodValidationPipe`; env validated with Zod at boot.
- Tests: Vitest (matches `admin/` and `web/`) with SWC for decorators.
- Local database: PostgreSQL via `api/docker-compose.yml`.
- Work happens in worktree `../coffee-prototipe-mono-worktrees/api-foundation` so the main checkout's in-progress work stays untouched.

## Modules (split by feature)
| Module | admin features | web features |
| --- | --- | --- |
| `auth` | auth, admin-shell | — |
| `venue` | venue, payments (settings) | cafe-info |
| `catalog` | products, categories, collections, moments, menu-organization | menu, product, explore |
| `tables` | tables, table-management, table-qr | table, table-session |
| `orders` | orders | cart, order |
| `billing` | bill-requests, payments | bill |
| `overview` | overview (read model) | — |

## Scope
- In scope: `api/` app, schema and endpoints per module, tests, docs.
- Out of scope (later features): wiring `admin/` and `web/` to the API, deployment.

## Tasks
- [x] T1 Scaffold `api/`: Nest app, strict TS, ESLint, Vitest+SWC, Zod env config, `ZodValidationPipe`, Prisma + Postgres docker-compose, `GET /health`, README with module conventions. Route: delegated (2+ non-trivial files).
- [x] T2 `auth` module: staff login, TOTP MFA, sessions/guards, password reset, seed. Route: delegated (2+ non-trivial files).
- [ ] T3 `venue` module. Route: TBD.
- [ ] T4 `catalog` module. Route: TBD.
- [ ] T5 `tables` module (incl. table sessions and QR tokens). Route: TBD.
- [ ] T6 `orders` module. Route: TBD.
- [ ] T7 `billing` module. Route: TBD.
- [ ] T8 `overview` read model. Route: TBD.

## Checks
`npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` in `api/`; Prisma `validate`.

## Delivery
Forecast well over 400 authored lines across modules; strategy `ask-on-risk`; chain strategy `feature-branch-chain` (user decision 2026-10-26): one branch/PR per module, each based on the previous one (`feat/api-foundation` ← `feat/api-auth` ← `feat/api-venue` ← …).

## Progress / Evidence
- T1 (route: delegated, 2+ non-trivial files; ~480 authored lines excl. lockfile, slightly over the 400 heuristic because config + docs + tests ship together). Versions: NestJS 12.2 (ESM, nodenext), Prisma 7.10.1 + @prisma/adapter-pg, Zod 4.6, TypeScript ~6.0.3 (typescript-eslint caps at <6.1), ESLint 10, Vitest 5 + unplugin-swc 2. RED observed for `ZodValidationPipe` spec (module not found) before GREEN. Checks after clean `npm ci`: `npm ci` ok (postinstall generates client, 0 vulnerabilities); `npm run lint` clean; `npm run typecheck` clean; `npm test` 3 files / 5 tests passed; `npm run build` ok; `npx prisma validate` valid. Boot without DATABASE_URL exits with a readable env error.
- T1 commit `b052a27`. Parent spot check: `npm test` 3 files / 5 tests passed. Review assess: medium, `slice_budget_reached`; candidate review declined by user (2026-10-26). Next reviewed boundary stays `main` (`59e148c`).
- T1 decisions: `/health` is DB-free liveness (e2e overrides PrismaService); Prisma client generated to `api/src/generated/prisma` (gitignored, `importFileExtension = "js"`); `overrides.multer ^2.5.0` fixes a high advisory in platform-express 12.2.0; default CORS origins 3000 and 3002 because admin and web both default to port 3000.
- T2 (route: delegated, 2+ non-trivial files; ~1600 authored lines excl. lockfile and generated migration, ~510 of them tests/fakes). Over the 400 heuristic because the module ships its four hexagonal layers, six use cases, Prisma schema, seed, docs, and both unit and e2e tests together; the slice is still one reviewable module. RED observed (3 spec files failed: modules not found) before GREEN. Checks after clean `npm ci`: `npm ci` ok (0 vulnerabilities); `npm run lint` clean; `npm run typecheck` clean; `npm test` 7 files / 36 tests passed; `npm run build` ok; `npx prisma validate` valid. Smoke: `node dist/main.js` without env exits with the env error; seed rejects a guessable password.
- T2 decisions: own sessions (user decision): opaque 32-byte token in `cp_session` cookie, SHA-256 hash in `sessions`, argon2id passwords. Admin 11D asks for "el código actual de tu aplicación autenticadora", so MFA is server-side RFC 6238 TOTP (no Mailer for codes); MFA is required only for users with `mfaSecret` (login returns `mfa_required` + a 10-minute pending session; verify rotates to a new token; replayed steps rejected via `mfaLastUsedStep`). `remember` (admin "Recordarme") selects a persistent cookie (`Max-Age` = `SESSION_TTL_HOURS`) vs browser-session cookie. Reset tokens expire after 15 minutes (admin 11C countdown) and are delivered by the `Mailer` port (`ConsoleMailer` in dev); reset revokes all sessions. Password rules copied from `admin/src/features/auth/validation.ts`. Roles `OWNER/MANAGER/STAFF` (admin only has free-text Spanish labels). Throttler limits: login/verify/reset 5/min, forgot 3/min. New env: `SESSION_TTL_HOURS`, `ADMIN_URL`, `SEED_OWNER_*`. Migration `20261026000000_auth` generated offline with `prisma migrate diff --from-empty`.
- T2 follow-ups: real mail adapter before production; MFA enrollment endpoints; encrypt `mfaSecret` at rest; configure `trust proxy` when deployed behind a proxy so throttling sees client IPs.

## Next step
T3 (venue module).
