# Feature: admin-products

## Objective
Implement module 07 "Productos" from the exports:
- `exports/ADMIN 07A · Gestión de Productos · Desktop-export.html`
- `exports/ADMIN 07B · Editar Producto · Desktop-export.html`
- `exports/ADMIN 07C · Vista previa del producto · Desktop-export.html`

## Problem / Why
The sidebar "Productos" entry shows the "Próximamente" placeholder. Staff need to browse the catalogue (image, name, category, price, availability), edit or create a product, preview how it looks to customers, and duplicate or archive it.

## Scope
- In scope: products management screen (table, filters, search, actions Editar/Duplicar/Archivar as in 07A), edit/create product form (07B), customer preview (07C), product data derived from the canonical service-day catalogue (`src/mocks/service-day/`), product images, pure helpers (filtering, search, validation, draft diff, duplicate/archive) with tests, in-memory actions.
- Out of scope: momentos and categories management (08), real image upload/storage, backend.

## Constraints
- Monorepo: work in `admin/` of `central-perk`; do not change `web/` except reading it.
- Coherence decision: the catalogue in `src/mocks/service-day/` stays the single source of truth; extend it (descriptions, categories, availability, images, options) instead of creating a parallel products mock. Every product shown elsewhere (orders, best sellers) must keep its name and price.
- Images: reuse `web/public/images/products/*.webp` (copy into `admin/public/images/products/`) when the product exists there; extract missing ones from the 07 exports with a one-off script run from `web/` (which already has `sharp`). No new admin dependencies.
- Type scale: 02/03 is the admin-wide reference.
- Branch `feat/admin-products` from `main`.

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [ ] T1 Extend the canonical catalogue (categories, descriptions, availability, images, options) + product images + pure helpers test-first. Route: delegated.
- [ ] T2 Products management screen (07A) with filters, search and Duplicar/Archivar actions. Route: delegated.
- [ ] T3 Edit/create product form (07B) and customer preview (07C) with in-memory save. Route: delegated.

## Acceptance criteria
- Screens visually match the three 07 exports at 1440×900.
- Editing, duplicating and archiving update the list in memory; the preview reflects the draft.
- Cross-screen invariants still pass (product names/prices in orders and best sellers).
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass in `admin/`.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
