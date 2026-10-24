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
- [x] T1 Add `qrcode` (+ types) to admin; table config + QR tokens in the canonical dataset; pure helpers test-first. Route: delegated (writer; preparation + 2+ non-trivial files).
- [x] T2 Tables & QR list (09A) and create/edit table (09B). Route: delegated (writer; 2+ non-trivial files).
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
- Plan commit: 7c19a39.
- Export structure: the six 09 exports share a reduced sidebar ("Credenciales auditadas" footer) and a top bar titled "Café Central · Gestión de mesas" with a green "Tokens seguros" pill, a bare 18px bell and the 32px profile "Sofía M. / Administradora". 09A is the list page ("Mesas y códigos QR": "Imprimir códigos QR" / "Nueva mesa", metrics Mesas totales · Habilitadas · Sin QR · Deshabilitadas, search plus "Sector" and "Configuración" selects, table MESA · SECTOR · CAPACIDAD · CONFIGURACIÓN · SESIÓN · QR · ACCIONES with Editar / Ver QR / Descargar / Más). 09B is a full page ("Editar mesa": "ID estable · tbl_07 · versión 18" bar with Cancelar / Guardar mesa, "Información de la mesa" form — Nombre o número de mesa, Sector, Capacidad, Descripción interna · opcional, "Mesa habilitada" switch — plus the "Sesión activa" warning and identity rules). 09C is a page ("Código QR de mesa") whose right column is a QR drawer (preview, access URL with copy, PNG / SVG / PDF downloads, "Regenerar código QR", credential history). 09D is a page ("Material QR imprimible": PNG / SVG / PDF exports, the Mesa 07 card and a "Hoja A4 · 6 tarjetas" sheet). 09E is a modal over a dimmed 09A ("Imprimir códigos QR", "N seleccionados", "✓ Seleccionar todos" / "Sector" / "Tamaño: A6", table checklist, "VISTA PREVIA · A4", "Solo se incluyen credenciales QR activas.", "Exportar PDF"). 09F is an alert dialog over a dimmed 09C. Export leftovers: the 09E background rows all say "Mesa 01" and its subtitle differs from 09A; 09E says "8 seleccionados" but lists five tables while its preview shows MESA 01–04; the 09F background title is "Código QR · Mesa 07" instead of 09C's "Código QR de mesa"; 09C/09F say "Generado hoy" next to "Rotado 12 jun"; the public URL is "cafe.central/t/<token>" (the user decision sets `?mesa=NN&qr=<token>` instead).
- Routing decision: one route, `/tables/qr`, with client-reducer views (list 09A with the 09E modal, editor 09B, QR detail 09C with the 09F dialog, printable material 09D) and `?state=` variants, as in 07/08 (`cacheComponents` rules out `dynamicParams`, and tables created in the session need client state). `/tables` (02) and `/tables/management` are unchanged: the exports only reuse the "Gestión de mesas" wording in the top bar title.
- T1 done: `qrcode` ^1.5.4 and `@types/qrcode` ^1.5.6 added (the only dependency change). Canonical dataset: `VenueTable` (stable `tbl_NN` id, number, label, sector, capacity, description, enabled, version, active `QrCredential` with token / generatedOn / generatedBy, `revokedQrs` with revokedOn / auditId) and `TableSector` in `types.ts`; `tables.ts` holds `TABLE_SECTORS` (Interior / Terraza / Patio) and `VENUE_TABLES` (09A sectors and capacities; Mesa 07 = version 18, "Cerca de la ventana", token 4pX9kR2mL7 generated today by Sofía M., one revoked token audited QR-118); `ServiceDay.tables` is new and `tableNumbers` is now derived from the enabled tables. Session status in 09 is derived from the 02 board (bill request > seated > free). New invariants in `service-day.test.ts`: 09A sectors and capacities, unique ids / numbers / labels, `tbl_NN` ids, the live screens show exactly the enabled tables, sessions only at configured tables, no token reused (active or revoked, 10 alphanumerics), the Mesa 07 credential, credentials generated by staff and never in the future. Pure helpers in `src/features/table-qr`: `qr-url.ts` (`getCustomerAppUrl` from `NEXT_PUBLIC_CUSTOMER_APP_URL`, default `http://localhost:3000`; `buildTableQrUrl` → `<base>/?mesa=07&qr=<token>`; `formatDisplayUrl`), `qr-token.ts` (10-character tokens from an injected `RandomSource`, `secureRandom` via `crypto.getRandomValues`, `sequenceRandom` for tests, `createUniqueQrToken`), `qr-matrix.ts` (`getQrMatrix` with `qrcode.create` at level M, `getQrPath` merging horizontal runs, `buildQrSvgMarkup` with a 4-module quiet zone), `table-config.ts` (session statuses, rows, metrics, search / sector / configuration filters, drafts, validation — unique label up to 30 characters, capacity integer 1–20, description up to 60 —, changed fields, save / create with version bump and a fresh credential, quick enable/disable rule, token rotation with audit id, used tokens, credential history "Generado hoy · Sofía M." / "Rotado hoy · auditoría #QR-118"), `print-selection.ts` (printable = enabled with QR, select by sector, toggle one / all visible, selection in number order, A6 ×4 and Compacta ×6 per A4, `paginate`). `QrCode.tsx` renders the real code as one SVG path. Test-first: RED (5 missing modules, 7 failing dataset invariants), GREEN 84/84 in the touched files. Checks: build OK, tsc OK, lint OK, vitest 429/429.
- T1 decisions: the 09B field "Nombre o número de mesa" edits the visible label (unique); the number (used by 02–05 and the QR URL) is assigned on creation (highest + 1) and stays stable like the id. Disabling is blocked only from the quick action while a session is open (09B copy); the editor switch can still disable it (sessions, orders and payments are kept). A disabled table keeps its token but shows "QR pausado" (invented) and is not printable. The revoked Mesa 07 token is dated today so the history is coherent ("Rotado hoy" instead of "Rotado 12 jun"). Invented copy: validation messages, "QR pausado", "Sin QR" as a row status, "Compacta".
- T1 commit: 6cf28fd.
- T2 done: `/tables/qr` (placeholder replaced) renders `TableQrScreen` (container with `useReducer`): pure `tableQrReducer` in `table-qr-state.ts` (set-query / set-sector / set-configuration, toggle-enabled — refused with the 09B reason while a session is open —, open-edit, open-new, editor-set-field, editor-save with the token a new table receives, close-editor) plus `getListView` (metrics, filtered rows with their quick toggle) and `getEditorView` (title "Editar mesa" / "Nueva mesa", "ID estable · tbl_07 · versión 18" / "ID estable · tbl_13 · se asigna al guardar", "Sesión activa" only with an open session, errors after a blocked save only). Saving validates, bumps the version and returns to the list; saving without changes just closes. New credentials use `createUniqueQrToken` over every used token. Components: `TableQrParts` (`PageHeader`, `HeaderButton`, `MetricCards`, `StatusChip`, `BarButton`, `Switch`), `TableList` (`TableToolbar` with search and native selects whose options carry the filter name; `TableConfigurationList` with a sand header and rows sharing the height, scrolling past twelve; Editar plus the "Más" menu with the enable/disable action) and `TableEditor`. Shell: new `credentials` top bar (test-first in `navigation.test.ts`: RED 1 failing, GREEN 16/16): "Café Central · Gestión de mesas" (`topbarTitle`), "Tokens seguros" pill (`ConnectionBadge` `secure`), the bare bell and profile of 10A; `/tables` and `/tables/management` unchanged. `?state=edit|new|errors`. Test-first: `table-qr-state.test.ts` RED (missing module), GREEN 11/11. Checks: build OK (`/tables/qr` static), tsc OK, lint OK, vitest 440/440. Screenshots (`qr-` prefix): `qr-list` and `qr-edit` match `qr-export-09A` / `qr-export-09B` except the deviations; `qr-new`, `qr-errors` render; `qr-flow-menu` (Mesa 07 "Deshabilitar mesa" disabled with the reason), `qr-flow-disable` (Mesa 01 → Deshabilitada / QR pausado, metrics 11 / 1).
- T2 deviations: shared admin sidebar instead of the 09 one (no "Credenciales auditadas" footer), as in 07/08. Session column derived from the service day: Mesa 04 and Mesa 12 "Cuenta solicitada" instead of "Disponible" (see admin-mock-unification). Chips hug their 11px labels and the CONFIGURACIÓN / SESIÓN / QR columns are 130 / 160 / 120px instead of 90 / 120 / 90px so the larger labels fit. The "Más" ellipsis is rendered (hidden in the export render) and opens an invented menu. The Capacidad field shows "personas" as a trailing suffix. Type scale: 8px table headers, 9px breadcrumb, chips, field labels, id bar, buttons, rules → 11px; 10px metric labels → 11px; 10px search, filters, sector / capacity, field values, setting label → 12px; 11px subtitle → 12px; 11px row titles and warning title → 13px; 10px warning copy → 12px; 14px and 25px unchanged. Invented: "Nueva mesa" title and its id line, "Deshabilitada", "QR pausado", menu copy, empty-list texts, validation and notice copy.
- T2 commit: recorded with T3.

## Next step
T3.
