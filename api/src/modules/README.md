# Modules

Each business capability lives in its own folder, named after the feature it serves (screaming architecture), with hexagonal layers inside:

```text
src/modules/<module>/
  domain/          Entities, value objects, domain errors, repository ports. Plain TypeScript only.
  application/     Use cases that orchestrate the domain through ports.
  infrastructure/  Adapters: Prisma repositories and other external services.
  http/            Nest controllers, Zod request schemas, response mapping.
  <module>.module.ts
```

Dependencies point inward: `http` and `infrastructure` depend on `application`, which depends on `domain`. `domain` never imports Nest, Prisma, or Zod. Modules talk to each other through exported application services, never through another module's infrastructure.

Folders are created when a module is implemented; there are no placeholders.

| Module     | Responsibility                                         | Consumers                                                 |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `auth`     | Staff login, sessions, guards                          | admin: auth, admin-shell                                  |
| `venue`    | Café profile, settings, bank/payment details           | admin: venue, payments settings · web: cafe-info          |
| `catalog`  | Products, categories, collections, moments, menu order | admin: products, menu-organization · web: menu, product, explore |
| `tables`   | Tables, table sessions, QR tokens                      | admin: tables, table-management, table-qr · web: table, table-session |
| `orders`   | Orders and their lifecycle                             | admin: orders · web: cart, order                          |
| `billing`  | Bill requests and payments                             | admin: bill-requests, payments · web: bill                |
| `overview` | Read model for the admin dashboard                     | admin: overview                                           |
