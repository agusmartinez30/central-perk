# Feature: admin-payments

## Objective
Implement module 06 "Configuración de Pagos" from the exports:
- `exports/ADMIN 06 · Configuración de Pagos · Desktop-export.html`
- `exports/ADMIN 06 · Datos bancarios · Desktop-export.html`
- `exports/ADMIN 06 · Confirmar cambios · Desktop-export.html`

## Problem / Why
The sidebar "Pagos" entry shows the "Próximamente" placeholder. Admins need to configure which payment methods customers can use (cash, card, transfer, etc.), the bank details shown for transfers, and confirm changes before they apply.

## Scope
- In scope: payment settings screen (methods and options as in the export), bank details view/form, confirm-changes dialog, typed mock payment settings consistent with the payment methods already used by the other mocks (Efectivo, Transferencia, En mesa, En caja, Tarjeta), pure helpers (draft vs saved diff, validation of bank fields such as CBU/CVU/alias/CUIT if present in the design, dirty state) with tests, in-memory save after confirming.
- Out of scope: real payment providers, real bank validation services, persistence beyond the session.

## Constraints
- Conventions of the previous feature docs (`admin-foundation` … `admin-collections`).
- Type scale: 02/03 is the admin-wide reference (labels 11px, body 12px, row titles 13px, panel titles 14px).
- Bank data in mocks must be obviously fake (no real CBU/CUIT of real people or companies).
- Branch `feat/admin-payments`, stacked on `feat/admin-collections` (PR chain strategy still pending the user's decision).

## Delivery strategy
`ask-on-risk` (inherited).

## Tasks
- [ ] T1 Payment settings mock + pure helpers (diff, validation, dirty state) test-first. Route: delegated (preparation + 2+ non-trivial files).
- [ ] T2 Payment settings screen at the sidebar "Pagos" route. Route: delegated (2+ non-trivial files).
- [ ] T3 Bank details view/form and confirm-changes dialog with in-memory save. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens visually match the three 06 exports at 1440×900.
- Editing settings marks them dirty; saving requires confirming the changes summary; cancelling keeps the saved values.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- (pending)

## Next step
T1.
