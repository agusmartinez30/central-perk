# Feature: cafe-prototype

## Objective
Build a frontend-only Next.js (App Router, Tailwind v4) prototype of the Café Central QR table-ordering app from the 29 Pencil exports in `exports/`, using mock data held in memory and localStorage.

## Problem / Why
The screens exist only as static design exports. We need a navigable prototype to validate the full flow: menu → product → cart → confirm → order → table → bill.

## Scope
- In scope: all routes and states from `exports/`, mock data, client state (cart, orders, table), forcing variants with `?state=`, and unit tests for pure logic.
- Out of scope: a real backend, auth, payments.

## Constraints
- Next.js 16.4 (read `node_modules/next/dist/docs/` before using APIs), React 19, Tailwind v4 `@theme` tokens.
- UI copy is in Spanish (voseo), matching the designs. Code, identifiers and comments are in English.
- Feature-based architecture (`src/features/*`, `src/shared/*`, `src/mocks/*`) with a container/presentational split.
- Plan: `C:\Users\Usuario\.claude\plans\quiero-crear-una-aplicacion-tender-magpie.md`

## Delivery strategy
`ask-on-risk`. Forecast is more than 400 changed lines, so the chain strategy will be asked before opening PRs. Commits are made per task on `feat/cafe-prototype`.

## Tasks
- [x] T0 Bootstrap: git init, create-next-app, deps (lucide-react, clsx, vitest, sharp). Route: inline. Commits: 353417f, 6864dc8
- [x] T1 Tokens, fonts, MobileFrame, StatusBar, base shared/ui components. Route: delegated (2+ non-trivial files). Commit: cf2ba56
- [x] T2 Mocks, image extraction script and assets, formatPrice (+tests). Route: delegated (2+ non-trivial files, image tooling). Commit: c6f2152
- [x] T3 Welcome, Menu (02), BottomNav, FloatingCartCta, CartProvider (+reducer tests; moved here from T5 because the menu "+" and the floating CTA need it). Route: delegated (2+ non-trivial files). Commit: 935c396
- [x] T4 Explore landing and results (02B). Route: delegated (2+ non-trivial files). Commit: cac4222
- [x] T5 Product detail (03): options, price calc (+tests). Route: delegated (2+ non-trivial files). Commit: f4744d2
- [x] T6 Cart (04), Confirm (05), Order sent (06 + 06A–C), table-session store. Route: delegated (2+ non-trivial files). Commit: 028da87
- [ ] T7 My table (07 + 07A–D)
- [ ] T8 Request bill (08 + 08A–F), Bill status (09 + 09A–E)

## Acceptance criteria
- Each route visually matches its export at 390px width.
- The full flow is navigable, and each variant can be reached via `?state=`.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build, plus a manual walk-through with `npm run dev`.

## Progress / Evidence
- T0 done (commits above).
- T1 done: `@theme` tokens (colors, radii, shadows, fonts), DM Sans/Caveat/Inter via next/font, `MobileFrame`, `StatusBar`, `TableBadge`, `PrimaryButton`/`SecondaryButton`, `StickyFooter`, `Notice`, `StatusPill`, `ScreenHeader` in `src/shared/ui`. Checks: tsc pass, lint pass, build pass (no tests apply: presentational only).

- T2 done: `scripts/extract-images.mjs` writes 13 WebP files (16-45KB) to `public/images/{products,moments}`; typed mocks in `src/mocks` (`types`, `menu`, `moments`, `table`); `formatPrice` in `src/shared/lib`. RED observed for `format-price.test.ts` (module missing), then GREEN. Seed order totals are computed from menu prices (13.000 + 6.900 = 19.900), covered by `src/mocks/table.test.ts`. Checks: vitest 9/9 pass, tsc pass, lint pass, build pass.
- Pricing model: `Product.price` is the default-configuration price (menu cards show it as is); option deltas are relative to it (Cappuccino Chico -700 / Grande +700); `OptionGroup.priceDisplay` says whether the detail screen shows absolute prices or +deltas.

- RDD for T1+T2 (base 6864dc8, committed-only): assessed medium, `slice_budget_reached`; the user declined review for this candidate. Next review boundary: e2709d8. `.atl/` (tool cache) is excluded locally via `.git/info/exclude`.

- T3 done: `src/features/cart` (pure `cart-reducer`: add with merging of identical lines, increment, decrement that removes at 1, remove, clear, hydrate; `selectItemCount`/`selectSubtotal` via `getUnitPrice`; `parseStoredCart`), `CartProvider` + `useCart` with hydration-safe localStorage restore, and the `CartFloatingCta` and `QuickAddButton` containers. Also `getDefaultChoiceIds` in `src/mocks/menu.ts`; shared `BottomNav`, `BottomDock`, `FloatingCartCta` (`bag`/`count` variants), `FilterChips`, `AddButton` and a `StatusBar` `tone`; Welcome (`/`) and Menu (`/menu`) in `src/features/menu`. RED observed for `cart-reducer.test.ts`, `menu.test.ts` and `menu-sections.test.ts` (missing modules or functions), then GREEN.
- T4 done: `/explore` landing and `/explore/[moment]` results (`generateStaticParams` over the 4 moments; an unknown moment calls `notFound()`), with `MomentCard`, `ProductListCard` and `getMomentProducts` in `src/features/explore`. RED observed for `moment-products.test.ts`, then GREEN.
- T3+T4 checks: vitest 34/34 pass; tsc pass (after `next typegen` generates the `PageProps` route types); lint pass; build pass (`/explore/[moment]` prerendered per moment). Dev server: `/`, `/menu`, `/explore`, `/explore/para-desayunar` and `/explore/para-tomar` return 200; `/explore/no-existe` returns 404.
- Notes: each page passes the active tab to `BottomNav` explicitly (no `usePathname`, which avoids Cache Components Suspense requirements). `next/image` `priority` is deprecated in Next 16, so `loading="eager"` is used. The banner and welcome art reuse the white line-art PNG instead of the inline SVG paths in the exports. Product links point to `/product/[id]`, which T5 adds. The search, info, sort and filter buttons are visual only.

- RDD for T3+T4 (base e2709d8): assessed medium, `slice_budget_reached`; the user declined review for this candidate. Next review boundary: 800d51f.

- T5 done (f4744d2, +532 lines): `/product/[id]` (`generateStaticParams` over all products, `notFound()` for unknown ids) with `ProductDetail`, `OptionGroupField` (radio for single, checkbox for multiple, OBLIGATORIO/OPCIONAL tag, absolute or delta prices with "Incluida") and the pure `product-options` module (`initSelection`, `toggleChoice`, `getSelectedChoiceIds`, `getMissingRequiredGroups`, `formatChoicePrice`, `getFromPrice` for "Desde $3.800"). Shared prop-only `QuantityStepper` (`lg` and `sm`). The sticky footer shows `getUnitPrice` × qty, adds to the cart and goes to `/menu`. RED observed for `product-options.test.ts` (module missing), then GREEN (13 tests).
- T6 done (028da87, +1642 lines; larger than the heuristic because it holds three screens, four variants and the store): `src/features/table-session` (pure `table-session-reducer`: `buildOrder` validates name/lines/closed table and prices lines from the menu, `getNextOrderNumber`, actions `addOrder`, `setOrderStatus`, `setTableStatus`, `setPaymentPreference`, `reset`, `hydrate`; `selectOrderById`, `selectTableTotal`; `parseStoredSession`) and `TableSessionProvider`/`useTableSession` (hydration-safe localStorage, mounted in the layout around `CartProvider`). `parseScreenState` + `useScreenState` in `src/shared/lib` for `?state=`. `/order` (04 plus an empty state in the 07C style), `/order/confirm` (05, 900ms simulated send, closed table shows 06C) and `/order/[orderId]` (06 receipt; `?state=pending|error|closed` for 06A–C; unknown ids show a "No encontramos este pedido" fallback). Shared prop-only `StateCard` (`state` and `empty` variants), `delay`/`formatClockTime`. RED observed for `screen-state.test.ts`, `table-session-reducer.test.ts` and `order-lines.test.ts` (missing modules), then GREEN.
- T5+T6 checks: vitest 72/72 pass; `next typegen` + tsc pass; lint pass; build pass (`/product/[id]` and the seed `/order/[orderId]` pages prerendered). Dev server: `/product/cappuccino` 200 (renders "Desde $3.800", "Agregar al pedido · $4.500"), `/product/nope` 404, `/order` 200, `/order/confirm` 200, `/order/order-1042` 200 and with `?state=pending|error|closed` 200 (exact export copy rendered), `/order/order-9999` 200 (fallback).
- Decisions: `OrderStatus` `pending` was renamed to `sent` ("Recibido"); `cancelled` stays for the table total. `TableOrder` gained an optional `note`. `PaymentPreference` is `table | cashier | transfer` (08: "En la mesa", "En caja", "Por transferencia"). `CartProvider` now exposes `hydrated`, so the cart screens do not flash the empty state. Placing an order validates against the latest session through a ref, so two quick submits never reuse an order number. The 06 illustration reuses the white line-art PNG (`LINE_ART_SRC`) with per-variant opacity instead of the ~80 inline SVG paths. Order numbers continue from the highest one (1049 next). In 06A/06B the primary action simulates a 900ms re-check and then shows the confirmed order; in 06C it shows an "Avisamos al personal" notice.
- Gaps: the pencil (edit line) button in 04 is visual only. `/table` is linked from 06 but arrives in T7. The client-only flow (add → cart → confirm → order) is covered by unit tests and SSR checks, not by a browser walk-through.

## Next step
T7 My table (07 + 07A–D), reusing `useTableSession`, `ORDER_STATUS_LABELS`, `StateCard` and `useScreenState`.
