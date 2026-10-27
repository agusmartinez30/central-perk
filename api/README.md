# Central Perk API

Backend shared by `admin/` and `web/`. NestJS 12 (ESM), Prisma 7 with PostgreSQL, Zod 4, Vitest.

## Setup

Requires Node 22+ and Docker.

```bash
cd api
docker compose up -d          # PostgreSQL 17 on localhost:5432
cp .env.example .env
npm ci                        # also runs `prisma generate`
npm run db:migrate            # apply migrations to the local database
npm run db:seed               # create the first owner (needs SEED_OWNER_* in .env)
npm run dev                   # http://localhost:3001/health
```

The app validates its environment at boot (`src/shared/config/env.ts`) and exits with a list of invalid keys when something is missing.

## Scripts

| Script                       | What it does                                        |
| ---------------------------- | --------------------------------------------------- |
| `dev`                        | Nest in watch mode                                  |
| `build` / `start`            | Compile to `dist/` and run it                       |
| `lint` / `typecheck`         | ESLint (type-aware) and `tsc --noEmit`              |
| `test`                       | Vitest: unit specs in `src/`, e2e specs in `test/`  |
| `db:generate`                | Generate the Prisma client into `src/generated/`    |
| `db:migrate` / `db:deploy`   | Create/apply migrations (dev) or apply them (prod)  |
| `db:seed`                    | Upsert the initial owner from `SEED_OWNER_*` env    |
| `db:studio`                  | Prisma Studio                                       |

## Architecture rules

- Screaming + hexagonal: business code lives in `src/modules/<module>/{domain,application,infrastructure,http}`. See [`src/modules/README.md`](src/modules/README.md).
- Cross-cutting code lives in `src/shared/` (config, HTTP helpers, Prisma).
- `domain/` has no Nest, Prisma, or Zod imports.
- Zod validates input only at the HTTP boundary, through `ZodValidationPipe` (`src/shared/http/zod-validation.pipe.ts`), which answers `400` with flattened issues.
- Prisma models are added to `prisma/schema.prisma` by the module that owns them. The connection URL is read from `prisma.config.ts`.
- `GET /health` is a database-free liveness probe, so the e2e test runs without PostgreSQL.

## Auth (staff sessions)

Own session auth, no JWT. `src/modules/auth` stores sessions in PostgreSQL and hands the browser an opaque token in the `cp_session` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production, path `/`). Only SHA-256 hashes of session and reset tokens are stored; passwords use argon2id.

| Endpoint                     | Body                              | Response                                                                 |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| `POST /auth/login`           | `{ email, password, remember? }`  | `200 { status: "authenticated", staff }` or `200 { status: "mfa_required" }`; `401 invalid_credentials` |
| `POST /auth/mfa/verify`      | `{ code }` (6 digits, TOTP)       | `200 { status: "authenticated", staff }`; `401 invalid_mfa_code \| invalid_session` |
| `POST /auth/logout`          | —                                 | `204`, clears the cookie                                                 |
| `GET /auth/me`               | —                                 | `200 { staff }`; `401 invalid_session`                                   |
| `POST /auth/password/forgot` | `{ email }`                       | always `202` (no account probing)                                        |
| `POST /auth/password/reset`  | `{ token, password }`             | `204`, revokes every session; `400 invalid_reset_token \| weak_password` (`requirements`) |

- `staff` is `{ id, email, name, role }`, with `role` one of `OWNER`, `MANAGER`, `STAFF`.
- MFA is TOTP (authenticator app). Users with `mfaSecret` get a 10-minute `mfa_pending` session from login; verifying rotates it into a new authenticated session. Seed with `SEED_OWNER_MFA=true` to enroll the owner and print the `otpauth://` URI.
- `remember: true` makes the cookie persistent (`Max-Age` = `SESSION_TTL_HOURS`); otherwise it is a browser-session cookie. The server expires sessions after `SESSION_TTL_HOURS` either way.
- Reset links point to `<ADMIN_URL>/reset-password?token=…` and expire after 15 minutes. In development the `ConsoleMailer` prints them to the API log; replace it with a real mail adapter before production.
- Password rules mirror the admin reset screen: 12+ characters and nothing guessable (`src/modules/auth/domain/password-policy.ts`).
- Login, verify, forgot and reset are rate limited per IP with `@nestjs/throttler`.
- Other modules protect routes with `@UseGuards(SessionGuard)` and read the user with `@CurrentStaff()` (import `AuthModule`).

## Notes

- The project is ESM (`"type": "module"`, `nodenext`): relative imports use the `.js` extension.
- Tests compile with SWC (`unplugin-swc`) because Nest dependency injection needs decorator metadata.
- `overrides.multer` pins a patched multer until `@nestjs/platform-express` ships it.
