# Feature: admin-table-qr

## Objective
Implement module 09 "Mesas y códigos QR" from the exports:
- `exports/ADMIN 09A · Mesas y códigos QR · Desktop-export.html`
- `exports/ADMIN 09B · Crear y editar mesa · Desktop-export.html`
- `exports/ADMIN 09C · Detalle del código QR · Desktop-export.html`
- `exports/ADMIN 09D · Tarjeta QR imprimible · Desktop-export.html`
- `exports/ADMIN 09E · Impresión masiva · Desktop-export.html`
- `exports/ADMIN 09F · Confirmar regeneración QR · Desktop-export.html`

## Problem / Why
The sidebar "Mesas y códigos QR" entry (`/tables/qr`) shows the "Próximamente" placeholder. Admins need to manage the restaurant's tables (create, edit, enable/disable, zones/capacity if shown), see and print each table's QR, print QR cards in bulk, and regenerate a compromised QR with confirmation.

## Decisions
- User decision (2026-10-23): generate real, scannable QR codes with the `qrcode` npm package (SVG output). This is the first new runtime dependency of `admin/`.
- QR target URL: `${NEXT_PUBLIC_CUSTOMER_APP_URL}/?mesa=<number>&qr=<token>`, with a sensible local default (e.g. `http://localhost:3000`). The customer app (`web/`) does not read these params yet; record it as a follow-up, do not change `web/`.
- Regenerating a QR rotates its token (old URL invalid) and requires confirmation (09F).

## Scope
- In scope: tables & QR list (09A), create/edit table (09B), QR detail (09C), printable card (09D), bulk print (09E), regenerate confirmation (09F); table configuration data in the canonical service-day dataset (`src/mocks/service-day/`) — table numbers must stay consistent with 02/03/04/05; pure helpers (validation, unique number, token rotation, URL building, print selection) with tests; printing via `window.print()` with print CSS.
- Out of scope: changes to `web/`, real token validation, backend.

## Constraints
- Monorepo: work in `admin/`; `web/` read-only.
- Coherence: extend the canonical dataset; don't create a parallel tables mock.
- Type scale: 02/03 is the admin-wide reference.
- Branch `feat/admin-table-qr`, stacked on `feat/admin-moments-categories` (08 not pushed yet).

## Delivery strategy
`ask-on-risk` (inherited). User delivery workflow: no PRs; fast-forward `main` and push only when the user says so.

## Tasks
- [ ] T1 Add `qrcode` (+ types) to admin; table config + QR tokens in the canonical dataset; pure helpers test-first. Route: delegated.
- [ ] T2 Tables & QR list (09A) and create/edit table (09B). Route: delegated.
- [ ] T3 QR detail (09C), regenerate confirmation (09F), printable card (09D). Route: delegated.
- [ ] T4 Bulk print (09E) with print CSS. Route: delegated.

## Acceptance criteria
- Screens visually match the six 09 exports at 1440×900; printed cards look right in print preview.
- QR codes scan to the expected URL; regenerating changes the URL.
- Cross-screen invariants still pass.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass in `admin/`.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
