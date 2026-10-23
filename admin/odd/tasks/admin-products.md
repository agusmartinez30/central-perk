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
- [x] T1 Extend the canonical catalogue (categories, descriptions, availability, images, options) + product images + pure helpers test-first. Route: delegated (writer; preparation + 2+ non-trivial files). Commit: b478de9
- [x] T2 Products management screen (07A) with filters, search and Duplicar/Archivar actions. Route: delegated (writer; 2+ non-trivial files). Commit: see git log (feat(products): add the 07A products management screen)
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
- T1 done (b478de9): `Product` (`src/mocks/service-day/types.ts`) gains `categoryId`, `description`, `image?`, `moments`, `publication` (published/draft), `available`, `archived`, `allowCustomerNotes`, `sizes` + `defaultSizeId`, `extras`; `catalog.ts` adds `CATALOG_VERSION` (42), `PRODUCT_CATEGORIES` (Cafés, Bebidas, Panadería, Tostadas, Tostados, Sándwiches, Hamburguesas, Postres) and `CONSUMPTION_MOMENTS` (Desayunar, Merendar, Cenar, Tomar), and extends the 11 products (names and prices unchanged) plus the 07A-only Hamburguesa clásica ($12.500, unavailable) and Cheesecake ($6.800, draft). Cappuccino carries the 07B copy and options (Tamaño Chico +$0 / Mediano +$800 / Grande +$1.500, default Mediano; Extras Shot extra +$900 / Leche vegetal +$700). Images: `scripts/copy-product-images.mjs` copies `cappuccino`, `medialunas`, `tostado-jamon-queso`, `tostadas-de-campo` and `combo-central` from `web/public/images/products` (reused for the café drinks, Jugo de naranja, the tostados, Sándwich de pollo and Tostón de palta); the 07A photos were extracted with sharp resolved from `web/` and discarded because they are leftovers, so Limonada, Hamburguesa clásica and Cheesecake have no photo (neutral placeholder). Pure helpers in `src/features/products`: `product-catalog.ts` (filters by search/category/moment/publication/availability, `sortProductsByName` with the Spanish collator, `getProductMetrics`, `getProductStatus`, `getDuplicateName` "… (copia)" / "… (copia N)", `duplicateProduct` as a draft right after the original, `archiveProduct`, `restoreProduct` as a draft, `setProductAvailability`, `createProductId`, `formatProductCount`) and `product-form.ts` (`parsePriceInput`, `formatOptionDelta`, `toProductDraft` / `applyProductDraft` / `createEmptyDraft`, `validateProductDraft` with draft vs publish rules, `getProductChanges`, `getPreviewModel`, `getMomentsLabel`). Route: delegated (writer). Test-first: `catalog.test.ts` + `product-catalog.test.ts` + `product-form.test.ts` RED (6 catalogue failures, 2 missing modules), GREEN 74/74. Checks: build OK (20 static routes), tsc OK, lint OK, vitest 286/286.
- T2 done: `/menu/products` (sidebar "Productos", placeholder replaced) renders `ProductsScreen` (container with `useReducer`) with `ProductListHeader` (breadcrumb, title, subtitle, "Nuevo producto"), `ProductListMetrics` (Publicados / Disponibles / No disponibles over the whole catalogue: 12 / 11 / 1), `ProductListFilters` ("Product Search" plus native selects Categoría / Momento / Publicación / Disponibilidad whose "all" option carries the filter name) and `ProductCatalogTable` (sticky header with the export column widths, 65.5px rows with thumbnail or placeholder, `PublicationStatus` chip, `AvailabilitySwitch` `role="switch"`, "Editar" / "Duplicar" / "Archivar" — "Restaurar" on archived rows; the body scrolls, the footer shows "N productos · Ordenados por nombre" and the archive policy). Pure `productsReducer` (set-query, set-filter, reset-filters, set-availability, duplicate, archive, restore; each sets a screen-reader notice) plus `getProductsListView`, test-first (RED missing module, GREEN 10/10). Shell: new `catalog` top bar ("Café Central · Carta digital", "Sincronizado" pill via `ConnectionBadge variant="synced"`, dot-less bell, compact profile), test-first in `navigation.test.ts` (RED 1 failing, GREEN 14/14; `/menu` and `/menu/categories` stay `section`). No confirmation on "Archivar": the export shows none. Checks: tsc OK, lint OK, vitest 297/297, build OK (20 static routes). Screenshot `prod-list.png` matches `prod-export-list.png` except the deviations below. "Editar" and "Nuevo producto" are wired in T3.
- T2 deviations: shared 10A sidebar instead of the 07 one (no "Carta publicada · Versión 42" footer), as in 05/06; 07's 10/8px profile copy maps to the compact 12/10px. All 13 catalogue products are listed, sorted by name (the export lists 7 unsorted rows), so the table body scrolls; metric values are derived (12/11/1 instead of 6/5/1) and rows show their real state ("Borrador" for Cheesecake, "No disponible" for Hamburguesa clásica). Type scale mapped by role: 9px breadcrumb, table header labels, footer → 11px; 11px subtitle and search → 12px; 10px metric labels, filter labels and status chips → 11px; 11px product names and prices → 13px; 10px category → 12px; 9px action labels → 11px; 11px "Nuevo producto" → 12px. The 07A thumbnails are leftovers, so photos come from the customer app and three products show the placeholder. Invented: "Borrador" / "Archivado" chips (sand / warning tones), the off switch look, "Restaurar", the option labels of the selects, the empty-results footer and the notices.
- T1 notes: the 07A prices of Cappuccino ($3.800), Tostón de palta ($7.900), Medialunas ($1.900), Tostado clásico ($6.900) and Limonada ($4.200) lose against the canonical prices; "Medialunas" is listed by its singular catalogue name "Medialuna". "Sándwiches" is a category not in the exports. Invented copy: all descriptions except the Cappuccino's, every validation message, the draft/publish rules (publishing needs a description and an image), "Borrador"/"Archivado" labels and "Sin productos para estos filtros".

## Next step
T1.
