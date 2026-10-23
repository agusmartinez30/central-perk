# Central Perk

Monorepo for the Central Perk café prototype. It holds two independent Next.js apps side by side:

| Folder   | App                                                        |
| -------- | ---------------------------------------------------------- |
| `web/`   | Customer app: QR table ordering, menu, cart, and checkout. |
| `admin/` | Staff back-office: tables, orders, bill requests, payments. |

## Running an app

Each app has its own `package.json` and `package-lock.json`. There are no npm workspaces and no shared packages, so install and run each app from its own folder.

```bash
# Customer app
cd web && npm install && npm run dev

# Staff back-office
cd admin && npm install && npm run dev
```

Both apps expose the same scripts: `dev`, `build`, `start`, `lint`, and `test`.

## Deployment

Point each deployment at its app folder. On Vercel, set the project's Root Directory to `web` (or `admin`).

## Feature documents

Root-level planning lives in `odd/tasks/`. Each app keeps its own feature documents in `web/odd/` and `admin/odd/`.
