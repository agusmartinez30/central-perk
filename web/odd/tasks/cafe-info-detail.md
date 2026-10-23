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
- [x] T2 "Detalle completo" screen matching the export (centered header, cover with status chip, identity, Dónde estamos, Contacto, También online, Horarios). Route: delegated.
- [x] T3 "Enlaces no disponibles" and "Secciones vacías" variants, data-driven and forceable with `?state=unavailable|empty`. Route: delegated.

## Acceptance criteria
- `/info` matches "Detalle completo" at 390px.
- `/info?state=unavailable` and `/info?state=empty` match their exports.
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

### T2 (delegated)
- Cover photo extracted from the exports to `public/assets/cafe-cover.webp` (800x1200, 113 KB) with sharp.
- Added `ScreenHeader` `variant="centered"` (44px back button, 16px centered title, balance spacer), tokens `brand-wash` (#e9ecfa) and `sand` (#ece9e2), local lucide-style Instagram/Facebook SVGs, and cafe-info components (`CafeCover`, `CafeSection`, `CafeActionButton`, `CafeLinkRow`, `HoursTable`, `cafe-info-copy.ts`). Removed the old `CafeInfo` model and `CAFE_INFO`.
- Test-first exception: markup only; the logic it uses is covered by T1 tests.
- `npx tsc --noEmit`: exit 0. `npm run lint`: exit 0. `npm test`: 125 passed. `npm run build`: success, `/info` static.
- Commit: see git log (`feat(cafe-info): rebuild business detail screen from the Detalle completo design`).

### T3 (delegated)
- `CafeInfoScreen` is now a Client Component reading `?state=` via `useScreenState`; `/info` wraps it in `<Suspense>`. Unknown states fall back to the full detail.
- Added `StateCard` `variant="section"` (sand placeholder used by every empty section), dimmed inactive link rows, disabled maps/contact buttons ("Google Maps no disponible", "No disponible"), and the "Cerrado hoy / Abre mañana a las 08:00" card.
- Deviations: the cover chip reads "Cerrado" (undesigned) when the café is closed, so the unavailable variant shows "Cerrado" instead of the export's "Abierto ahora" next to "Cerrado hoy"; the unavailable export's single-line address ("Av. del Libertador 124 · Alta Gracia") keeps the two-line layout of the full design; section spacing uses the full design's 24px/12px gaps instead of 22px/10px in the degraded exports.
- Test-first exception: markup only; behavior is covered by the T1 view tests.
- `npx tsc --noEmit`: exit 0. `npm run lint`: exit 0. `npm test`: 125 passed. `npm run build`: success.
- `next start -p 3921`: `/info`, `?state=unavailable`, `?state=empty`, `?state=bogus` all HTTP 200. The server HTML is the Suspense shell (client-rendered, like `/table`), so copy was checked with headless Edge `--dump-dom`: full shows "Abierto ahora", "Ver en Google Maps", "Elegí cómo querés comunicarte.", "@cafecentral.demo", "Abierto hasta las 20:00"; unavailable shows "Google Maps no disponible", "No disponible", "Los enlaces inactivos se muestran sin acción.", "Cerrado hoy", "Abre mañana a las 08:00"; empty shows all five empty-state titles. Screenshots compared visually against the exports.
- Commit: see git log (`feat(cafe-info): add unavailable links and empty sections variants`).

## Next step
Feature complete; push / PR are the user's decision.
