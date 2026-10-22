# Café info: "Detalle" screens from the exports

## Objective
Rebuild the café info screen (`/info`, opened from the menu header Info button) to match the three new exports:
- `exports/Detalle completo-export.html` (every section filled)
- `exports/Detalle · Enlaces no disponibles-export.html` (links missing or unavailable)
- `exports/Detalle · Secciones vacías-export.html` (sections with no data)

## Problem / why
`/info` was built in `79af7aa` with no design and placeholder layout. The user has now added the designs and wants the screen to match them and stay consistent with the rest of the app.

## Scope and constraints
- Reuse the existing `/info` route, `src/features/cafe-info/`, and `src/mocks/cafe-info.ts` sample data; adapt the data model to what the exports show.
- The two degraded variants are data-driven (missing links / empty sections), and are also forceable with `?state=` through `parseScreenState` / `use-screen-state`, like the other screens.
- Reuse shared UI (`ScreenHeader`, `StateCard`, `Notice`, design tokens) before adding new primitives.
- UI copy in Spanish, taken from the exports. Code and comments in English.
- Follow the Next.js docs in `node_modules/next/dist/docs/` (`cacheComponents` requires `searchParams` / `useSearchParams` inside `<Suspense>`).

## Delivery
Strategy `ask-on-risk`, commits on `feat/cafe-prototype`. Forecast: about 350 authored changed lines.

## Tasks
- [x] T1 Data model (`CafeDetail` + three samples, one per export) and pure helpers (`getCafeDetail`, `getCafeInfoView`: section/link/channel availability, `?state=unavailable|empty`) with tests. Route: delegated (writer; preparation reading of exports).
- [ ] T2 "Detalle completo" screen matching the export. Route: delegated.
- [ ] T3 "Enlaces no disponibles" and "Secciones vacías" variants. Route: delegated.

## Acceptance criteria
- `/info` matches "Detalle completo" at 390px.
- `/info?state=<links-variant>` and `/info?state=<empty-variant>` match their exports.
- The header Info button still opens `/info`; back returns to `/menu`.

## Checks
vitest, lint, `tsc --noEmit`, build, and curl against `next start` for the three variants.

## Progress / Evidence
### T1 (delegated)
- Exports read through a scratchpad tree extractor (layer names, classes, text, icon names). All three share one cover photo (1080x1620 JPEG), extracted in T2.
- Model: `CafeDetail` in `src/mocks/types.ts`; `CAFE_DETAIL`, `CAFE_DETAIL_LINKS_UNAVAILABLE`, `CAFE_DETAIL_EMPTY` in `src/mocks/cafe-info.ts`; view helper `src/features/cafe-info/cafe-info-view.ts`. The old `CafeInfo` model stays until T2 replaces the screen, so every commit compiles.
- Rules: blank values count as missing; the first available contact channel is primary; the contact hint shows only when both channels work; the links hint shows when any link is inactive; a closed café shows the "Cerrado hoy" card instead of the weekly table; no schedule means the empty state.
- RED: `npx vitest run src/features/cafe-info/cafe-info-view.test.ts src/mocks/cafe-info.test.ts`: 2 files failed (missing module/exports). GREEN: same command, 12 passed.
- `npx tsc --noEmit`: exit 0. `npm run lint`: exit 0. `npm test`: 125 passed. `npm run build`: success.
- Commit: see git log (`feat(cafe-info): add business detail data model and view helpers`).

## Next step
T2.
