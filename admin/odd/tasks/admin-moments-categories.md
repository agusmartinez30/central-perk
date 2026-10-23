# Feature: admin-moments-categories

## Objective
Implement module 08 "Categorías y momentos" from the exports:
- `exports/ADMIN 08A · Momentos de consumo · Desktop-export.html`
- `exports/ADMIN 08B · Crear y editar momento · Desktop-export.html`
- `exports/ADMIN 08C · Categorías · Desktop-export.html`
- `exports/ADMIN 08D · Crear y editar categoría · Desktop-export.html`
- `exports/ADMIN 08E · Customer Explore Preview · Desktop-export.html`

## Problem / Why
The sidebar "Categorías y momentos" entry (`/menu/categories`) shows the "Próximamente" placeholder. Admins need to manage consumption moments (Desayunar, Merendar, Cenar, Tomar…) and product categories, assign products, order them, and preview how the customer "Explore" screen looks.

## Scope
- In scope: moments list (08A), create/edit moment (08B), categories list (08C), create/edit category (08D), customer explore preview (08E), data from the canonical catalogue (`PRODUCT_CATEGORIES`, `CONSUMPTION_MOMENTS` and product assignments in `src/mocks/service-day/`), moment images, pure helpers (ordering, product counts, validation, draft diff, visibility/schedule rules if shown) with tests, in-memory actions.
- Out of scope: product editing (07, already done), real image upload, backend.

## Constraints
- Monorepo: work in `admin/`; read-only for `web/`.
- Coherence: extend the canonical catalogue; product counts per category/moment are derived from product assignments, never hard-coded. Product 07 screens must keep working with the same data.
- Images: reuse `web/public/images/moments/*.webp` (para-desayunar, para-merendar, para-cenar, para-tomar) by copying into `admin/public/images/moments/`; verify exported photos match before extracting anything (07 exports had mismatched photos). No new admin dependencies.
- Type scale: 02/03 is the admin-wide reference.
- Branch `feat/admin-moments-categories` from `main`.

## Delivery strategy
`ask-on-risk` (inherited). User delivery workflow: no PRs; after approval, fast-forward `main` and push.

## Tasks
- [ ] T1 Extend catalogue (moment/category metadata: description, order, visibility, schedule, image, icon as shown) + images + pure helpers test-first. Route: delegated.
- [ ] T2 Moments list (08A) and create/edit moment (08B). Route: delegated.
- [ ] T3 Categories list (08C) and create/edit category (08D). Route: delegated.
- [ ] T4 Customer explore preview (08E). Route: delegated.

## Acceptance criteria
- Screens visually match the five 08 exports at 1440×900.
- Creating/editing/reordering/hiding moments and categories updates lists and the explore preview in memory; product counts stay derived.
- Cross-screen invariants and 07 tests still pass.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass in `admin/`.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
