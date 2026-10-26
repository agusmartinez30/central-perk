# Feature: products-redesign

## Objective
Redesign the existing products module at `/menu/products` to match the new ADMIN 07 exports, which form one flow:
- `../web/exports/ADMIN 07A · Alternativa B · Commerce Admin-export.html` (product list)
- `../web/exports/ADMIN 07B · Propuesta · Minimal Premium-export.html` (product editor with live customer preview)
- `../web/exports/ADMIN 07C · Propuesta · Premium Preview-export.html` (read-only product preview)

## Problem / Why
`admin-products` (commits b478de9, ed2e330, 5df766d) built list, editor and preview against older 07 exports. The new exports change the table columns, add SKU, per-row save states, pagination, general customization groups (single/multiple, required, max), a published-vs-pending preview and new header/save-bar copy.

## Scope
- In scope: domain changes (SKU, commercial-relevance order, general option groups replacing fixed `sizes`/`extras`); 07A list redesign (metric support text, "Disponibles" chip + "Limpiar", new columns, Editar + more-actions menu, async availability with "Actualizando…" / "No se pudo guardar", footer + pagination); 07B editor redesign ("Cambios sin guardar" badge, publication control, "Agregar grupo" / "Agregar opción", "Incluido" / "Sin cargo" labels, quantity stepper and "Agregar · $X" in the preview, new save-bar copy); 07C preview redesign (header, "Volver a editar", "Versión publicada / Cambios pendientes", admin summary, groups summary, mobile viewport).
- Out of scope: "Carta publicada · Versión N" sidebar footer and the exports' own sidebar (the shared admin shell stays, as in `admin-products`); separate edit/preview routes (one reducer screen with `?state=`, as recorded in `admin-products`).

## Constraints
- Canonical mock data wins over export data (user decision 2026-10-23, `admin-mock-unification`): prices (Cappuccino $4.600), option deltas and moments (`desayunar|merendar|cenar|tomar`) stay canonical; cross-screen tests in `src/mocks/service-day` stay green.
- Type scale 02/03 (labels 11px, body 12px, row titles 13px, panel titles 14px), as in previous docs.
- Do not touch `../web/exports/*.html` or `../.codegraph/**`.
- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code (`AGENTS.md`).
- Branch `feat/products-redesign` from `main`; all work units on this one branch (user preference "mantené todo en una única rama").

## Delivery strategy
`single-pr` on one branch (cached user preference). Forecast ~1,200–1,500 authored lines over 4 tasks.

## Tasks
- [x] P1 Domain: `sku`, commercial-relevance order, general `optionGroups` (`{id, title, selection: single|multiple, required, max?, options}`) replacing `sizes`/`extras` across every consumer; test-first. Route: delegated writer (2+ non-trivial files).
- [x] P2 07A list redesign + async availability states + pagination. Route: delegated writer.
- [x] P3 07B editor redesign (general groups editing, badge, publication control, stepper, save bar). Route: delegated writer.
- [x] P4 07C preview redesign (published vs pending, admin summary, mobile viewport). Route: delegated writer.

## Acceptance criteria
- Screens match the three 07 exports at 1440×900, except documented deviations.
- Existing flows (filters, duplicate/archive/restore, draft/publish save, validation, discard) keep working.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan created on `feat/products-redesign`. RDD: on (global).
- P1 done (route: delegated writer; 13 files, +840/−271): every product has a `sku` (07A rows use the export SKUs CAF-014, TOS-006, PAN-002, TOS-011, BEB-018, HAM-003, POS-009; new/duplicated products take the next free number per prefix); search matches SKU; the list sorts by `commercialRank` then name (footer "N productos · Orden: relevancia comercial"); `sizes`/`defaultSizeId`/`extras` replaced by `optionGroups` (Cappuccino "Tamaño" single/required, "Extras" multiple/optional/max 2), canonical prices and deltas unchanged; reducer edits groups by id (add group/option, rename, rules, default option); helpers `getOptionPriceLabel` ("Incluido" / "Sin cargo" / "+$800"), `getOptionGroupsSummary` ("2 grupos · 6 opciones"), `getOptionGroupMeta`; option errors moved to `errors.optionGroups[groupId]`. Test-first: RED 43 failing across 5 test files, GREEN 132/132 in products + mocks. Checks: vitest 613/613 (parent spot check 613/613), lint OK, tsc OK, build OK (19 pages).
- P1 deviations: "Canela" (delta 0) added to Cappuccino extras so "Sin cargo" and "2 grupos · 6 opciones" match the exports (new data, no price change); non-zero deltas use the existing formatter "+$800" (the 07B editor rows show "+$ 800"); the preview group heading is the group title until P4.

- P1 review: RDD assessed medium (`slice_budget_reached`); consent relayed, user declined for this candidate (`declined_this_candidate`). Next assess base: 8bb9099.
- P2 done (route: delegated writer; 9 files +651/−220 plus new `ProductRowMenu.tsx`, `product-availability.ts`, `product-availability.test.ts`): header subtitle; metric strip with support lines ("92% del catálogo", "Listos para vender", "Requieren revisión"); toolbar with search (name/SKU), "Disponibles" toggle chip, Categoría/Momento/Publicación selects and "Limpiar" when filters are active; table PRODUCTO (thumb, name, "Categoría · SKU") / PRECIO / MOMENTOS / PUBLICACIÓN / DISPONIBILIDAD / ACCIONES (Editar + keyboard-accessible "…" menu with Duplicar and Archivar/Restaurar) with export widths and 65.5px rows; async availability ("Actualizando…", revert + "No se pudo guardar" on failure; mock rule: Cheesecake always fails); `?state=saving` variant; footer "N productos · Mostrando todos|Con filtros aplicados · Orden: relevancia comercial" with shared Pagination (7 rows/page, reset on filter change). Test-first: RED 19 failing in 3 files, GREEN 97/97 products. Checks: vitest 628/628 (parent spot check 628/628), lint OK, tsc OK, build OK (19 pages). Headless browser: menu ArrowDown/Escape/focus return OK, availability pending then commit OK. Screenshots (scratchpad): `prod-list`, `prod-menu`, `prod-pending`, `prod-saving`.
- P2 deviations: canonical moment labels and the 13 canonical products; Disponibles/No disponibles count published products only (No disponibles 1 vs export 2); "Disponibles" chip off by default (export shows it on) and replaces the old availability select; 02/03 type scale; shared 30px pagination buttons; in `?state=saving` Cheesecake shows "No publicado" (draft in data); moments truncate with a title tooltip; focus has no return target after archiving removes the row.

- P2 review: RDD assessed medium (`slice_budget_reached`, base 8bb9099); user declined for this candidate. Next assess base: 15b2221.
- P3 done (route: delegated writer; 8 files +699/−405 incl. new `preview-order.ts` + test): header with uppercase breadcrumb, "Editar producto"/"Nuevo producto", "Cambios sin guardar" badge while dirty, publication switch (`set-draft-publication`, change label "Publicación"); "Información general" (image + format hint + "Reemplazar", Nombre, Precio base, Descripción, Categoría select, Disponibilidad switch); "Momentos de consumo" chips; "Personalizaciones" with "Agregar grupo", group cards (meta, option rows with "Incluido"/"Sin cargo"/"+$N", edit/remove, "Agregar opción") and a settings panel (title, selection, Obligatorio, Máximo, Quitar grupo); "Vista previa del cliente" phone with group hints, quantity stepper (1–20) and "Agregar · $X" (pure helpers in `preview-order.ts`, local to the preview); save bar only while dirty or after a blocked save ("Descartar", "Guardar borrador", "Guardar cambios" following the publication switch). Test-first: RED 13 failing + `preview-order.test.ts` suite missing (7 tests), GREEN 108/108 products. Checks: vitest 639/639 (parent spot check 639/639), lint OK, tsc OK, build OK (19 pages). Browser: `?state=edit` badge/bar/"Agregar · $5.400", "Descartar" clears; dirty total 4.800 + Grande + Shot extra × 2 = "$14.400"; `?state=errors` blocked save + field errors. Screenshots (scratchpad): `prod-edit`, `prod-edit-clean`, `prod-edit-dirty`, `prod-edit-errors`, `prod-edit-new`.
- P3 deviations: "Permitir observaciones" hidden (field and action kept for mocks/customer data); old taxonomy chip cards, saved-status chip and revalidation note removed; "Ampliar" kept in the preview header to reach 07C; image trash button kept ("Agregar imagen" without photo); image hint shows format only (no "1200 × 900", `next/image` serves resized copies); canonical moments/prices; preview group heading is the group title; settings icon instead of the export's "…" menu, no UI for choosing the default option; groups in a two-column grid, form column scrolls; 07C `CustomerPreview.tsx` already gets the new phone; new product shows the bar after the first edit; 02/03 type scale (page title 25px as in the export).

- P3 review: RDD assessed medium (`slice_budget_reached`, base 15b2221); user declined for this candidate. Next assess base: c1deb8a.
- P4 done (route: delegated writer; 3 files +238/−61 plus new `product-preview.ts` + test): 07C header (breadcrumb, "Vista previa del producto", subtitle, "Volver a editar", "Versión publicada"/"Cambios pendientes" toggle via tested `getProductPreviewView`), admin summary (thumb, badge, SKU, facts grid, "Personalizaciones visibles" with summary pill and group blocks, info note), "Experiencia del cliente" mobile viewport (`CustomerProductPreview variant="viewport"`, shared with 07B). Test-first: RED new suite missing (6 tests), GREEN 6/6. Checks: vitest 645/645, lint OK, tsc OK, build OK. Browser: version toggle, Ampliar ↔ Volver a editar round trip keeps the draft. Screenshots (scratchpad): `prod-preview-pending`, `prod-preview-published`, `prod-preview-clean`, `prod-preview-07b`.
- P4 deviations: "Cambios pendientes" disabled without changes ("Versión publicada" disabled for never-saved products); total follows `preview-order.ts` ($5.400 vs export's inconsistent $4.300), only required single groups preselect a default; canonical data; group titles as phone headings; lucide icons in the viewport top bar; real scroll instead of the fake indicator; 02/03 type scale; `EditorView.previewTitle` now unused by the UI (kept, covered by a test).
- P4 review: pending (not yet assessed; base c1deb8a).

## Next step
Assess/review P4 candidate (base c1deb8a), then the user decides merge to `main`.
