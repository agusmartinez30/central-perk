# Feature: admin-settings

## Objective
Move payment configuration under `/settings` and redesign it to match the updated ADMIN 06 exports:
- `../web/exports/ADMIN 06 · Alternativa A · Minimal SaaS-export.html` (tab "Métodos y modalidades")
- `../web/exports/ADMIN 06 · Datos bancarios · Desktop-export.html` (tab "Datos bancarios")

## Problem / Why
`/settings` shows the "Próximamente" placeholder while payment configuration lives in `/payments`. The updated design puts it inside Configuración (sidebar "Configuración" active, breadcrumb `CONFIGURACIÓN / PAGOS`). User decision (2026-10-26): everything lives in settings; settings contains the Pagos section and its configuration.

## Scope
- In scope: `/settings/payments` hosts the redesigned payment settings; `/settings` redirects there; `/payments` redirects there (old links keep working); the sidebar's standalone "Pagos" item goes away and "Configuración" is active on `/settings/**`; redesigned layout (two tabs "Métodos y modalidades" / "Datos bancarios" + disabled "Seguridad", per-tab customer preview, "Guardado hace N min" pill, unsaved-changes bar with "Descartar" / "Guardar cambios"); reuse existing pure helpers and reducer, keeping their tests green.
- Out of scope: other settings sections (no design), "Seguridad" (no design), persistence beyond the session.

## Constraints
- Conventions of the previous feature docs; type scale 02/03 (labels 11px, body 12px, row titles 13px, panel titles 14px).
- Keep the confirm-changes dialog and validation behavior from `admin-payments`.
- Branch `feat/admin-settings` (from `main`).

## Delivery strategy
`ask-on-risk` (inherited). Forecast ~400–600 authored lines.

## Tasks
- [x] S1 Routing: `/settings/payments` renders the payment settings, `/settings` and `/payments` redirect, sidebar "Pagos" removed, "Configuración" active (navigation tests first). Route: delegated (2+ non-trivial files). Commit: 225e5f4
- [x] S2 Redesign to the updated 06 exports (tabs, per-tab preview, header pill, save bar). Route: delegated (2+ non-trivial files). Commit: 6eb5300

## Acceptance criteria
- Screens match the two updated 06 exports at 1440×900, except documented deviations.
- Dirty/confirm/cancel/validation flows behave as in `admin-payments`.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan created on `feat/admin-settings`.
- S1 done (225e5f4, route: delegated writer): `/settings/payments` hosts `PaymentSettingsScreen` (Suspense boundary, title "Configuración de pagos · Café Central"); the old `/payments` page moved there and the `/settings` "Próximamente" page was removed. Redirects live in `next.config.ts` `redirects()` (307, `permanent: false`), the idiom of `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`, which passes query strings through: observed on `next start` `/settings` → 307 `/settings/payments`, `/payments?state=bank` → 307 `/settings/payments?state=bank`, `/settings/payments` → 200. Sidebar: the "Pagos" item is gone; "Configuración" (`/settings`) carries the `admin-location` top bar and owns `/settings/**`. README route and `?state=` tables updated. Test-first in `navigation.test.ts`: RED 2 failing (`/settings/payments` resolved to the section top bar; the item list still had "Pagos"), GREEN 17/17. Checks: lint OK, tsc OK (after the build regenerated `.next/types`; before it, stale validator types referenced the removed `settings/page`), vitest 589/589, build OK (`/settings/payments` static, 19 pages).

- S2 done (6eb5300, route: delegated writer): helpers and reducer extended test-first (RED 11 failing: missing `formatSavedAgo`, `customerLabel`, `PAYMENT_SETTINGS_VIEWED_AT`, `savedAgo`, updated copy; GREEN 44/44 in `src/features/payments`). `SettingsTab` is `methods` | `bank` ("Seguridad" disabled with a "Próximamente" tooltip). `formatSavedAgo` gives "Guardado hace N min" (1–59 min), "Guardado recién" (< 1 min or a clock behind the save) and "Guardado hoy HH:MM" (an hour or more); the state keeps the screen clock `now` and a confirmed save moves it. Mock: `PAYMENT_SETTINGS.updatedAt` is now "14:38" and `PAYMENT_SETTINGS_VIEWED_AT` "14:42" (the service-day `now`, asserted in a test; repeated because the service day imports the payments mock), so the pill reads "GUARDADO HACE 4 MIN" as in the exports. Copy updated to the exports (method/mode descriptions, transfer rule, customer labels "En mi mesa"/"En caja"/"Por transferencia" without trailing periods); `formatChangesTitle` and the "N cambios sin guardar" title are gone. UI: header (uppercase breadcrumb, per-tab subtitle, status pill with the version as tooltip), horizontal tabs, one "Métodos y modalidades" card with divided switch rows, "Datos bancarios" form with "ACCESO RESTRINGIDO", CBU / CVU copy button, dependency note (danger tone while the transfer rule is broken) and audit note, "VISTA DEL CLIENTE" column with "SOLO LECTURA" that switches between the request-modes phone (draft's enabled modes, "Nota separación" below) and the transfer phone (draft bank, alias and holder, "Copiar alias"), and the save bar only while dirty ("Tenés cambios sin guardar", "Descartar", "Guardar cambios"; the first broken rule in red after a blocked save). Confirm dialog, validation and blocked-save behavior unchanged; after a confirmed save focus moves to the status pill (the bar and the dialog opener unmount). Checks: lint OK, tsc OK, vitest 596/596, build OK (19 pages, `/settings/payments` static). Playwright flow on `next start` (18/18 PASS): `/payments?state=bank` and `/settings` redirects, "Configuración" active without "Pagos", clean screen without bar, toggles mark dirty and update the preview, dialog focus on "Cancelar", Escape keeps the draft, confirm hides the bar, pill "Guardado recién", tooltip "Versión 19", focus on the pill, blocked transfer rule without dialog, bank preview follows the alias, "Descartar" restores. Screenshots at 1440×900 (scratchpad, `set-` prefix): `set-methods` / `set-bank` vs `set-export-methods` / `set-export-bank`, plus `set-flow-dirty`, `set-flow-dialog`, `set-flow-saved`, `set-flow-blocked`, `set-flow-bank-dirty`, `set-bank-errors`, `set-confirm`; before: `set-before`, `set-before-bank`.
- S2 deviations: shared admin sidebar and the `admin-location` top bar instead of the exports' six-item sidebar and "CAMBIOS REGISTRADOS" / "María · Encargada" header (as in admin-payments). Type scale mapped by role: breadcrumb 10px → 11px; title 25px → 24px (admin page title); pill 9px → 11px; card titles 16/17px → 14px; preview label 9px → 11px and "Previsualización en tiempo real" 11px → 12px; "SOLO LECTURA" / "ACCESO RESTRINGIDO" 8–9px → 11px; dependency and audit notes 10px → 11px; save bar and buttons 11px → 12px; phone mocks: brand 9px → 11px, help 9–10px → 12px, option names 11px → 12px, descriptions and notes 8px → 11px, footer 9px → 11px, transfer chip and row labels 7px → 11px, values and "Copiar alias" 9px → 12px (21/20px phone titles kept). Layout: the save bar sits in the flow 14px under the main areas and only while dirty (the methods export overlays it at y 884 on a 952px-tall page; with the bar, the methods card scrolls inside the 900px viewport); the methods export shows the bar without "Descartar" and both exports show it on unchanged data, the app shows "Descartar" always with the bar; the phone mocks fill their card (`max-h` 490px for the transfer phone) and are left-aligned as in the exports. The transfer preview shows the draft holder verbatim ("Café Central SRL · FICTICIO"; the export drops "· FICTICIO"); the preview's "Copiar alias", radios and disabled footer are not interactive (read-only). "Guardado recién", "Guardado hoy HH:MM", the version tooltip, the CBU copy button's behavior (clipboard, no feedback), the locked-switch tooltip and the in-card transfer-rule alert are not in the exports. The "Debe permanecer habilitado al menos un medio de cobro." info box is gone (not in the updated export); it remains as the blocked-save message. `src/mocks/types.ts` still mentions "09:42" in a doc comment (outside the allowed edit surface).
- Engram mirror `odd/admin-settings/tasks`: not written by the writer; left to the parent.

## Next step
Native review decision by the parent (RDD assess on S1/S2 commits); PR strategy.
