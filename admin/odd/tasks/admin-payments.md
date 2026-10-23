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
- [x] T1 Payment settings mock + pure helpers (diff, validation, dirty state) test-first. Route: delegated (preparation + 2+ non-trivial files). Commit: 572996f
- [ ] T2 Payment settings screen at the sidebar "Pagos" route. Route: delegated (2+ non-trivial files).
- [ ] T3 Bank details view/form and confirm-changes dialog with in-memory save. Route: delegated (2+ non-trivial files).

## Acceptance criteria
- Screens visually match the three 06 exports at 1440×900.
- Editing settings marks them dirty; saving requires confirming the changes summary; cancelling keeps the saved values.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Plan commit: 9402252.
- Export structure: "Datos bancarios" is a tab of the same settings workspace ("Payment Settings Navigation": Medios de cobro, Modalidades, Datos bancarios, Seguridad) that swaps the form column for "Editable Bank Account Form"; "Confirmar cambios" is an alertdialog ("Save Confirmation Dialog") over the main area opened from "Guardar cambios". One route, `/payments`, with in-page tabs.
- T1 done (572996f): `AcceptedPaymentMethod` / `BankAccount` / `PaymentSettings` / `SavedPaymentSettings` types and `PAYMENT_SETTINGS` mock (`src/mocks/payments.ts`, version 18, "09:42"; methods Efectivo/Tarjeta/Transferencia on, Otro off; request modes En mesa/En caja/Por transferencia on). Pure helpers in `src/features/payments/payment-settings.ts`: method/mode/bank-field options, `isValidCbu` (22 digits + both check digits), `isValidAlias` (6–20 letters/digits/dots/hyphens), `validateBankAccount` (required holder/bank/alias/CBU, 120-char instructions), `getSettingsIssues` (at least one method; "Por transferencia" requires the Transferencia method; valid bank data), `canDisableMethod`, `getSettingsChanges` / `isDirty` (trim-insensitive), `applySettings` (next version; an unchanged draft keeps the saved object), save-bar copy. Test-first: RED (missing `@/mocks/payments`), GREEN 20/20. Checks: tsc OK, lint OK, vitest 195/195.
- T1 notes: methods follow 06 (Efectivo, Tarjeta, Transferencia, Otro); "En mesa" / "En caja" / "Por transferencia" are request modes (`BillPaymentMethod`), not methods, so the export corrects the plan's method list; "Otro" is new to the mocks. Bank data kept from the export (holder "Café Central SRL · FICTICIO", "Banco Demo", alias "CAFE.CENTRAL.DEMO", CBU "0000000000000000000000"): obvious placeholders, and the all-zero CBU passes the check digits. The design has no CUIT field, so there is no CUIT validation. All validation error copy, the 120-character limit and "N cambios sin guardar" are invented.

## Next step
T2.
