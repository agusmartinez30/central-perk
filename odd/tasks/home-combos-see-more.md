# Home: Combos section, capped sections and "Ver más"

## Objective
On the home screen (`/menu`, Todos), show at most 4 products per category section, followed by a "Ver más" link to a new category results page. Add a "Combos" section that links to Explore › Para desayunar with the Combos filter already selected.

## Problem / why
The home lists every product in each section, and Cafés and Desayunos have 8 each, so the screen gets long. The user wants a shorter home with a way to drill down.

## Decisions (user)
- "Ver más" goes to a new page per category, `/explore/categoria/[category]`, because categories and moments don't line up.
- The new section is Combos, built from the existing `badge: "Combo"` mocks with no data-model change. Its "Ver más" goes to `/explore/para-desayunar?filter=combos`.

## Scope and constraints
- Only Todos is capped. When a category chip is selected, that section shows every product and no "Ver más".
- "Ver más" appears only when a section has more than 4 products, which today means only Cafés and Desayunos.
- UI copy is in Spanish, matching the existing screens.
- Follow the Next.js docs in `node_modules/next/dist/docs/` for `searchParams` and `generateStaticParams`.

## Delivery
Strategy `ask-on-risk`, with commits on `feat/cafe-prototype`. Forecast: about 300 authored changed lines.

## Tasks
- [x] T1 Pure helpers and tests: `HOME_SECTION_LIMIT`, `getComboProducts`, `limitSection` (menu-sections), `getCategoryProducts` (new category-products), `resolveFilterId` (moment-products). Route: delegated (2+ non-trivial files).
- [x] T2 Category results page `/explore/categoria/[category]`: extract `ProductResults` from `ExploreResults`, and add `CategoryResults`. Route: delegated.
- [ ] T3 Home: capped sections with "Ver más", and the Combos section. Route: delegated.
- [ ] T4 Explore `?filter=` sets the initial sub-filter. Route: delegated.

## Acceptance criteria
- `/menu` (Todos) shows 4 rows in Cafés and in Desayunos, each followed by "Ver más". The "N opciones" counter still shows the total.
- `/menu` shows a Combos section with 2 combos and a "Ver más".
- `/explore/categoria/cafes` lists 8 products. `/explore/categoria/zzz` returns 404.
- `/explore/para-desayunar?filter=combos` opens with the Combos chip selected and 2 products shown.

## Checks
vitest, lint, `tsc --noEmit`, build, and curl against `next start`.

## Decisions (implementation)
- `cacheComponents: true` is on (`next.config.ts`). Per `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` ("Working with runtime APIs"), `searchParams` must be read inside `<Suspense>`, so T4 keeps the page shell static (params come from `generateStaticParams`) and reads `?filter=` in a suspended child.
- `resolveFilterId` ignores repeated query values (`string[]`) and falls back to the first filter.
- `getCategoryById` lives in `category-products.ts` and excludes "todos", so the route and tests share one lookup.

## Progress / Evidence
- T1 (delegated writer). RED: `npx vitest run` on the 3 helper test files → 3 files failed, 8 tests failed (`limitSection is not a function`, `resolveFilterId is not a function`, `Cannot find module './category-products'`). GREEN: same command → 3 files, 18 tests passed. Commit: see `git log` (`feat(menu): add home section helpers`).

- T2 (delegated writer). `npx tsc --noEmit` clean, `npx eslint src` clean, `npm run build` lists `/explore/categoria/[category]` with cafes, desayunos and "+3 more paths" (5 prerendered). No runnable RED: the change is a component extraction plus a route. Commit: `feat(explore): add category results page`.

## Next step
T3.
