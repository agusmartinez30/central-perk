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
- [ ] S2 Redesign to the updated 06 exports (tabs, per-tab preview, header pill, save bar). Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens match the two updated 06 exports at 1440×900, except documented deviations.
- Dirty/confirm/cancel/validation flows behave as in `admin-payments`.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan created on `feat/admin-settings`.
- S1 done (225e5f4, route: delegated writer): `/settings/payments` hosts `PaymentSettingsScreen` (Suspense boundary, title "Configuración de pagos · Café Central"); the old `/payments` page moved there and the `/settings` "Próximamente" page was removed. Redirects live in `next.config.ts` `redirects()` (307, `permanent: false`), the idiom of `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`, which passes query strings through: observed on `next start` `/settings` → 307 `/settings/payments`, `/payments?state=bank` → 307 `/settings/payments?state=bank`, `/settings/payments` → 200. Sidebar: the "Pagos" item is gone; "Configuración" (`/settings`) carries the `admin-location` top bar and owns `/settings/**`. README route and `?state=` tables updated. Test-first in `navigation.test.ts`: RED 2 failing (`/settings/payments` resolved to the section top bar; the item list still had "Pagos"), GREEN 17/17. Checks: lint OK, tsc OK (after the build regenerated `.next/types`; before it, stale validator types referenced the removed `settings/page`), vitest 589/589, build OK (`/settings/payments` static, 19 pages).

## Next step
S2.
