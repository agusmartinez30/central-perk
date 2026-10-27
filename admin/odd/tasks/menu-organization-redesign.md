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
- [ ] R1 Domain + reducer, test-first: metric detail values, derived counts (products across moments, published per moment, visible/unavailable per category), async visibility for moments and categories, categories visibility filter + pagination, category image metadata + update metadata, product rows/cards with description, category label and availability (unavailable stay listed as "Temporalmente agotado" in 08E), picker open flag, preview moment/device/step. Route: delegated writer (2+ non-trivial files).
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

## Next step
R1.
