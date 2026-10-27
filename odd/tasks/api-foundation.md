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
- [ ] T2 `auth` module: staff login, sessions/guards. Route: TBD.
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
- T1 decisions: `/health` is DB-free liveness (e2e overrides PrismaService); Prisma client generated to `api/src/generated/prisma` (gitignored, `importFileExtension = "js"`); `overrides.multer ^2.5.0` fixes a high advisory in platform-express 12.2.0; default CORS origins 3000 and 3002 because admin and web both default to port 3000.

## Next step
T2 (auth module).
