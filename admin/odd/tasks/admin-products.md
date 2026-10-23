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
- Plan commit: 029f3d3.
- Export structure: 07A, 07B and 07C share the "Sidebar · Products" sidebar (with a "Carta publicada · Versión 42" footer) and the "Topbar · Products" bar ("Café Central · Carta digital", green "Sincronizado" pill, dot-less bell, 32px avatar with 10/8px profile copy). 07B is a full page ("Product Editor Main": form column + "Product Preview Column"); 07C is a full page ("Customer Preview Main": "Preview Context Panel" + "Standalone Customer Product Preview"). Export leftovers: every 07A row reads "Publicado"/"Disponible" while the metric cards say 6/5/1; the rows are not sorted by name although the footer says so; the 07B "Extras" group repeats the "Tamaño" rows (the preview shows the real extras "Shot extra · +$900" / "Leche vegetal · +$700"); the 07A photos do not depict their rows ("Tostón de palta" is a croissant, "Hamburguesa clásica" a coffee-and-toast table, "Cheesecake" a toast with jam, "Limonada" a croissant).
- T1 done: `Product` (`src/mocks/service-day/types.ts`) gains `categoryId`, `description`, `image?`, `moments`, `publication` (published/draft), `available`, `archived`, `allowCustomerNotes`, `sizes` + `defaultSizeId`, `extras`; `catalog.ts` adds `CATALOG_VERSION` (42), `PRODUCT_CATEGORIES` (Cafés, Bebidas, Panadería, Tostadas, Tostados, Sándwiches, Hamburguesas, Postres) and `CONSUMPTION_MOMENTS` (Desayunar, Merendar, Cenar, Tomar), and extends the 11 products (names and prices unchanged) plus the 07A-only Hamburguesa clásica ($12.500, unavailable) and Cheesecake ($6.800, draft). Cappuccino carries the 07B copy and options (Tamaño Chico +$0 / Mediano +$800 / Grande +$1.500, default Mediano; Extras Shot extra +$900 / Leche vegetal +$700). Images: `scripts/copy-product-images.mjs` copies `cappuccino`, `medialunas`, `tostado-jamon-queso`, `tostadas-de-campo` and `combo-central` from `web/public/images/products` (reused for the café drinks, Jugo de naranja, the tostados, Sándwich de pollo and Tostón de palta); the 07A photos were extracted with sharp resolved from `web/` and discarded because they are leftovers, so Limonada, Hamburguesa clásica and Cheesecake have no photo (neutral placeholder). Pure helpers in `src/features/products`: `product-catalog.ts` (filters by search/category/moment/publication/availability, `sortProductsByName` with the Spanish collator, `getProductMetrics`, `getProductStatus`, `getDuplicateName` "… (copia)" / "… (copia N)", `duplicateProduct` as a draft right after the original, `archiveProduct`, `restoreProduct` as a draft, `setProductAvailability`, `createProductId`, `formatProductCount`) and `product-form.ts` (`parsePriceInput`, `formatOptionDelta`, `toProductDraft` / `applyProductDraft` / `createEmptyDraft`, `validateProductDraft` with draft vs publish rules, `getProductChanges`, `getPreviewModel`, `getMomentsLabel`). Route: delegated (writer). Test-first: `catalog.test.ts` + `product-catalog.test.ts` + `product-form.test.ts` RED (6 catalogue failures, 2 missing modules), GREEN 74/74. Checks: build OK (20 static routes), tsc OK, lint OK, vitest 286/286.
- T1 notes: the 07A prices of Cappuccino ($3.800), Tostón de palta ($7.900), Medialunas ($1.900), Tostado clásico ($6.900) and Limonada ($4.200) lose against the canonical prices; "Medialunas" is listed by its singular catalogue name "Medialuna". "Sándwiches" is a category not in the exports. Invented copy: all descriptions except the Cappuccino's, every validation message, the draft/publish rules (publishing needs a description and an image), "Borrador"/"Archivado" labels and "Sin productos para estos filtros".

## Next step
T1.
