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
- [x] T7 My table (07 + 07A–D). Route: delegated (2+ non-trivial files). Commit: bc9a51f
- [x] T8 Request bill (08 + 08A–F), Bill status (09 + 09A–E). Route: delegated (2+ non-trivial files). Commit: 4a00629

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
- RDD for T5+T6 (base 800d51f): assessed medium, `slice_budget_reached`; the user declined review for this candidate. Next review boundary: 739548b.

- T7 done (bc9a51f, +633 lines): `/table` (thin route + Suspense) with `TableScreen` in `src/features/table`: `ScreenHeader` + `TableHeading` (editorial or display heading), status pill, `AccountSummaryCard` (blue shared-account summary), expandable `OrderCard` (the first order starts expanded on the open account), notice, note and a sticky footer ("Solicitar cuenta" → `/table/bill`, "Pedir algo más" → `/menu`, `BottomNav` "mesa"). Pure `getTableView` (forced > closed > requested/attending > empty > open), plus `getTableSummary`/`formatOrderCount`/`formatUnitCount` in `src/features/table-session/table-summary.ts` (cancelled orders are excluded from the total, the orders and the units). 07D "Reintentar" waits 900ms, then replaces the URL without `?state=`. RED observed for `table-view.test.ts` and `table-summary.test.ts` (missing modules), then GREEN.
- T8 done (4a00629, +1232 lines; larger than the heuristic because it holds two screens and eleven variants): `src/features/bill` with `BillRequestScreen` (08) and `BillStatusScreen` (09).
  - 08 form: `BillSummaryCard` (Mesa / Pedidos realizados / Productos / TOTAL), `PaymentOptionCard` radios (En la mesa / En caja / Por transferencia), `AcknowledgementCheckbox`, the transfer notice and a sticky footer. Confirming shows 08B for 1200ms, then stores `paymentPreference`, sets `tableStatus = requested` and pushes `/table/bill/status`. 08C/08F use the 08A layout (`BillHero` + summary + alerts).
  - 09: `BillStatusHero`, `AccountStatusCard`, the info notice and CTAs wired to `/menu`, `/table` (with the matching `?state=` when the 09 variant is forced) and `/`. "Finalizar" resets the session only when the table is really closed. 09D "Reintentar" re-checks after 900ms.
  - Pure logic: `getBillRequestView`, `canConfirmBillRequest`, `getBillRequestHint`, `getBillStatusView`, `getPaymentStatusLabel`. RED observed for `bill-request.test.ts` and `bill-status.test.ts` (missing modules), then GREEN (20 tests).
  - `ScreenHeader` gained `titleClassName`; new token `--color-lilac` (payment icon holder).
- T7+T8 checks: vitest 102/102 pass; `next typegen` + tsc pass; lint pass; build pass (`/table`, `/table/bill` and `/table/bill/status` static). Dev server returns 200 for `/table` and `?state=requested|closed|empty|error`; `/table/bill` and `?state=sending|updated|error|requested|closed`; `/table/bill/status` and `?state=requested|attending|closed|reopened|offline|invalid`. The SSR HTML contains the export copy (e.g. "Cuenta ya solicitada", "Confirmar $19.900", "Ver resumen final", "Volver al inicio").
- `?state=` values per route: 06 `/order/[orderId]`: pending, error, closed. 07 `/table`: requested, closed, empty, error. 08 `/table/bill`: sending, updated, error, requested, closed. 09 `/table/bill/status`: requested, attending, closed, reopened, offline, invalid.
- Decisions:
  - The 08 form uses `BillSummaryCard` instead of the export's compact summary (task spec) and keeps the 08 acknowledgement copy ("Entiendo que esta preferencia no confirma el pago.").
  - 08B/08D/08E reuse the form layout with their alert and footer copy; 08C/08F use the 08A hero layout. The 08D/08E previews prefill the selection (the stored preference or "En caja", box checked), as the exports show it. 08D is also reached when the table total changes after the screen opened.
  - Confirming needs a preference, the box checked and at least one billable order. The footer note is "Seleccioná la confirmación para continuar" once a preference is chosen without the box; otherwise it is the 08 single-request note.
  - 07A–D render without `BottomNav`, as in the exports. Order badges on 07: Recibido neutral, En preparación brand, Entregado success, Cancelado danger. 07D "Última actualización" uses the latest order time (deterministic, no hydration mismatch).
  - `/table/bill/status` on an open table that never requested the bill redirects to `/table/bill`.
  - The 08 hero line art is the white PNG used as a CSS mask painted `brand-2`; the 09 hero reuses it in white with per-variant opacity (0.65 offline, 0.35 invalid).
- Gaps:
  - The 09 supporting copy exists only for "En caja"; "En la mesa" and "Por transferencia" use new lines (`REQUESTED_SUPPORTING`).
  - Nothing in the prototype moves the table to `attending`, `closed` or `reopened` (staff actions), so 09A–C and 07B are reachable only via `?state=`.
  - Placing an order while the bill is requested is not blocked yet (`buildOrder` only blocks `closed`); 07A only disables its CTAs.
  - No browser walk-through yet. The client interactions (radio/checkbox gating, 08B → 09 navigation, order card toggling) are covered only by unit tests of the pure logic and by SSR checks.
- RDD for T7+T8 (base 739548b): assessed medium, `slice_budget_reached`; the user declined review for this candidate.
- Final verification (2026-10-21, on 044dff6):
  - lint, `tsc --noEmit`, vitest (102/102 tests in 14 files) and build (42 static pages) all pass.
  - `next start`: every flow route and every `?state=` variant returns 200 with no error markers.
  - Finding: on `/product/[id]` and `/explore/[moment]`, an unknown param returns 200 with the 404 page on the first request and 404 only after that (likely partial prerendering). A fully unmatched path returns 404 straight away.
  - Pending: the visual comparison at 390px. Headless Chrome on Windows ignores the 390px width and crops the screenshots, and Playwright is not installed. Spot checks (02, 09A) match in copy and layout, but the 09A illustration and some button and pill icons differ from the exports.

## Next step
Final verification: a full flow walk-through at 390px with `npm run dev` (welcome → menu → product → cart → confirm → order sent → my table → request bill → status), plus every `?state=` variant compared against its export.
