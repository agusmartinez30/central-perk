# Central Perk

Monorepo for the Central Perk café prototype. It holds two independent Next.js apps and the API they share:

| Folder   | App                                                        |
| -------- | ---------------------------------------------------------- |
| `web/`   | Customer app: QR table ordering, menu, cart, and checkout. |
| `admin/` | Staff back-office: tables, orders, bill requests, payments. |
| `api/`   | Backend for both apps: NestJS, Prisma, PostgreSQL. See [`api/README.md`](api/README.md). |

## Running an app

Each app has its own `package.json` and `package-lock.json`. There are no npm workspaces and no shared packages, so install and run each app from its own folder.

```bash
# Customer app
cd web && npm install && npm run dev

# Staff back-office
cd admin && npm install && npm run dev

# API (needs Docker for PostgreSQL)
cd api && docker compose up -d && cp .env.example .env && npm ci && npm run dev
```

All three expose `dev`, `build`, `start`, `lint`, and `test`. The API adds `typecheck` and `db:*` scripts.

## Deployment

Point each deployment at its app folder. On Vercel, set the project's Root Directory to `web` (or `admin`).

## Feature documents

Root-level planning lives in `odd/tasks/`. Each app keeps its own feature documents in `web/odd/` and `admin/odd/`.
