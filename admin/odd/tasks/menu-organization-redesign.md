# Feature: menu-organization-redesign

## Objective
Redesign module 08 "Categorías y momentos" at `/menu/categories` to match the new ADMIN 08 exports:
- `../web/exports/ADMIN 08A · Propuesta · Momentos Premium-export.html` (moments list)
- `../web/exports/ADMIN 08B · Propuesta · Editor Premium-export.html` (moment editor)
- `../web/exports/ADMIN 08C · Propuesta · Categorías Premium-export.html` (categories list)
- `../web/exports/ADMIN 08D · Propuesta · Editor de categoría-export.html` (category editor)
- `../web/exports/ADMIN 08E · Propuesta · Preview Studio-export.html` (customer preview studio)

## Problem / Why
`admin-moments-categories` (commits 998a4bc, a092f36, 71509e6, 7738b57) built 08 against older exports. The new exports align 08 with the redesigned 07 pattern (uppercase breadcrumb header, "Cambios sin guardar" badge, header visibility switch, bottom save bar) and add async visibility toggles, a metric strip with detail lines, a seven-column categories table with filter and pagination, category image metadata and context panel, and a three-column Preview Studio with moment selection.

## Scope
- In scope: domain/reducer changes (metric details, derived counts, async moment/category visibility with "Actualizando…" and revert, categories visibility filter + pagination, category image metadata, mock `updatedAt`/`updatedBy`, product description/category/availability in rows and phone cards, "Asociar productos" picker state, preview moment/device/step state); 08A cards; 08B editor; 08C table; 08D editor; 08E studio.
- Out of scope: the exports' own sidebar ("Carta publicada · Versión 42" footer) — shared admin shell stays; "…" menus, tablet viewport and "Asociar productos" dialog have no design (minimal, documented choices); new product photos (exports reuse wrong photos, the catalogue images win).

## Constraints
- Canonical catalogue wins over export data (counts stay derived: no 18/16/14/20, 12/11/1, 68; no Combos/Tortas/Ensaladas/Infusiones/Jugos). 07 and `src/mocks/service-day` cross-screen tests stay green.
- Type scale 02/03 (labels 11px, body 12px, row titles 13px, panel titles 14px).
- Do not touch `../web/exports/*.html` or `../.codegraph/**`.
- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code (`AGENTS.md`).
- Branch: `feat/products-redesign` (user preference: one branch; 07 not merged yet).

## Delivery strategy
`single-pr` on one branch (cached user preference). Forecast ~1,500–1,900 authored lines over 5 tasks.

## Tasks
- [x] R1 Domain + reducer, test-first: metric detail values, derived counts (products across moments, published per moment, visible/unavailable per category), async visibility for moments and categories, categories visibility filter + pagination, category image metadata + update metadata, product rows/cards with description, category label and availability (unavailable stay listed as "Temporalmente agotado" in 08E), picker open flag, preview moment/device/step. Route: delegated writer (2+ non-trivial files).
- [ ] R2 08A + shared parts (breadcrumb header, metric strip, small tabs, cards with toggle/overlay/order footer). Route: delegated writer.
- [ ] R3 08B moment editor (header badge + visibility, 66/34 layout, cover, chip search, "Asociar productos" picker, product rows, compact phone, save bar). Route: delegated writer.
- [ ] R4 08C table (7 columns, inline toggle, filter, pagination, footer) + 08D editor (image metadata, settings tiles, products breakdown, context panel, archive review, save bar). Route: delegated writer.
- [ ] R5 08E Preview Studio (context rail, viewport header + device toggle, full phone with nav, flow card, empty sample, warning). Route: delegated writer.

## Acceptance criteria
- Screens match the five new 08 exports at 1440×900, except documented deviations.
- Existing flows (create/edit/save/discard, reorder by drag and keys, hide, archive with confirmation, preview from list and editor) keep working.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Exploration done (export outlines in scratchpad `08A.txt`–`08E.txt`). Moment covers in the exports are the same photos as `public/images/moments/para-*.webp`; product photos in 08B/08E are wrong leftovers; 08D has a new Cafés category photo (700×467) not in the repo.
- RDD: on (global). Next assess base: 68091c1.
- R1 done (route: delegated writer; trigger: 2+ non-trivial files). Files: `src/features/moments/moment-catalog.ts`, `src/features/categories/category-catalog.ts`, `src/features/menu-organization/organization-state.ts`, new `src/features/menu-organization/visibility-save.ts`, new `src/shared/lib/relative-time.ts` (+ tests), `src/mocks/service-day/types.ts` (`ImageAsset`), minimal consumer updates in `CategoryEditor.tsx` and `MenuOrganizationScreen.tsx`.
  - Behaviors: `MetricItem` strips with detail lines (`getMomentMetricItems`: Momentos / Visibles / Productos asignados = distinct non-archived products in any moment, 13 today; `getCategoryMetricItems`: 9/8/1). `getMomentProductSummary` ("7 productos · 7 visibles en la carta"; visible = published). `getCategoryProductBreakdown` {total, visible = published, unavailable = !available, moments}. Async visibility for moments and categories (`start-/finish-moment-visibility-save`, `start-/finish-category-visibility-save`; pending shows the requested value with "Actualizando…", failure reverts with "No se pudo guardar" and an error notice), saver `saveVisibility` (900 ms, no failing ids by default: the 08 exports show no failure; tests inject `failingKeys`). 08C `categoryFilter` (Todas/Visibles/Ocultas) + `categoryPage` (9 rows, reset on search/filter), view returns paged rows, `pageItems`, footer "Mostrando A–B de N categorías · «Todos» se genera automáticamente", rows with description, `visibilityLabel`, CONTENIDO "Con productos"/"Sin productos". Category image is `ImageAsset {src, fileName, width, height, bytes}` ("1200 × 600 px · 284 KB"; the editor reads the pixel size on load). `MenuCategory.updatedAt/updatedBy` seeded at 10:32 of the day (previous day before 10:32) by the signed-in staff, set on save (`category-save` now carries `at`); `formatRelativeDayTime` → "hoy, 10:32" / "ayer, …" / "dd/mm, …". Audit rules removed; archive card "Archivar categoría" + "Revisar archivado" always opens the existing confirmation (unused categories now confirm too). 08B rows add image, category label, "Disponible"/"No disponible" (was "Agotado"); explore cards add description and availability, unavailable published products stay listed with "Temporalmente agotado". 08B picker flag (`moment-open-/close-product-picker`, stays open while adding), editor view breadcrumb, `order`, `pendingLabel`, `categoriesHint`, `productsHint`, `saveBar` ("Versión N · La publicación actual no cambia hasta guardar"). 08D breadcrumb, `positionLabel`, `pendingLabel`, `saveBar` ("La categoría publicada no cambia hasta guardar."), `image`, `breakdown`, `contextLines`, `archiveCard`. 08E preview keeps a catalogue `snapshot` (`refresh-preview` re-takes it, "Vista previa actualizada."), `device` phone/tablet, `set-preview-moment` (visible moments of the snapshot, resets filter), view `momentOptions`, `context` (moment, categories = filters without Todos, products of Todos, current filter), six `flow` steps with `activeStep` 02 on Todos / 03 with a category filter (04–06 never current: no product detail in the prototype).
  - Test-first: RED 33 failing tests + 2 suites failing on missing modules (`relative-time`, `visibility-save`); GREEN 82/82 in the touched suites. Deliberate test changes: metrics shape, "Agotado" → "No disponible", unused category archive now confirms, new tenth category is on page 2, `category-save` carries `at`.
  - Checks: `npx vitest run` 670/670 (49 files), `npx tsc --noEmit` OK, `npm run lint` OK, `npm run build` OK.
  - Deviations / invented copy: "Visibles"/"Ocultas" filter options; "En 1 momento" (singular metric detail); "Sin categorías para mostrar" footer; "NUEVO MOMENTO"/"NUEVA CATEGORÍA" breadcrumbs; "Momento nuevo sin guardar"/"Categoría nueva sin guardar" badges, "Sin cambios" save-bar title; "Todavía no se guardó." context line; flow states "Todos activo", "Sin productos", "Sin momento visible"; "Vista previa actualizada." and visibility notices. Context shows "Editado por Sofía M." / "Permiso: Administradora" (signed-in staff) instead of the export's "Lucía Fernández" / "Administrador". The moments metric strip labels changed in the current UI (R2 restyles it); 08A cards still use the synchronous switch until R2 wires `saveVisibility`. Diff ~1,100 authored lines (about 460 of them tests) — above the ~400 heuristic because R1 is the whole domain layer of five screens.

## Next step
R2 (08A + shared parts; wire `saveVisibility` into the cards).
