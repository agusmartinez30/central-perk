# Central Perk API

Backend shared by `admin/` and `web/`. NestJS 12 (ESM), Prisma 7 with PostgreSQL, Zod 4, Vitest.

## Setup

Requires Node 22+ and Docker.

```bash
cd api
docker compose up -d          # PostgreSQL 17 on localhost:5432
cp .env.example .env
npm ci                        # also runs `prisma generate`
npm run db:migrate            # once modules define models
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
| `db:studio`                  | Prisma Studio                                       |

## Architecture rules

- Screaming + hexagonal: business code lives in `src/modules/<module>/{domain,application,infrastructure,http}`. See [`src/modules/README.md`](src/modules/README.md).
- Cross-cutting code lives in `src/shared/` (config, HTTP helpers, Prisma).
- `domain/` has no Nest, Prisma, or Zod imports.
- Zod validates input only at the HTTP boundary, through `ZodValidationPipe` (`src/shared/http/zod-validation.pipe.ts`), which answers `400` with flattened issues.
- Prisma models are added to `prisma/schema.prisma` by the module that owns them. The connection URL is read from `prisma.config.ts`.
- `GET /health` is a database-free liveness probe, so the e2e test runs without PostgreSQL.

## Notes

- The project is ESM (`"type": "module"`, `nodenext`): relative imports use the `.js` extension.
- Tests compile with SWC (`unplugin-swc`) because Nest dependency injection needs decorator metadata.
- `overrides.multer` pins a patched multer until `@nestjs/platform-express` ships it.
