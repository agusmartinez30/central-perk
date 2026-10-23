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
- [x] T2 Payment settings screen at the sidebar "Pagos" route. Route: delegated (2+ non-trivial files). Commit: f805cb6
- [x] T3 Bank details view/form and confirm-changes dialog with in-memory save. Route: delegated (2+ non-trivial files). Commit: 35a2b68

## Acceptance criteria
- Screens visually match the three 06 exports at 1440×900.
- Editing settings marks them dirty; saving requires confirming the changes summary; cancelling keeps the saved values.
- `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and `npm run build` pass.

## Checks
lint, tsc, vitest, build.

## Progress / Evidence
- Payment names shared (admin-mock-unification): `PAYMENT_METHOD_OPTIONS` and `REQUEST_MODE_OPTIONS` take their names from the service-day catalogue in `src/mocks/service-day/catalog.ts`, which 04, 05 and 10A use too; `PAYMENT_SETTINGS` stays in `src/mocks/payments.ts` and the service day checks that every collection method and request mode it uses is enabled there. See `odd/tasks/admin-mock-unification.md`.
- Plan commit: 9402252.
- Export structure: "Datos bancarios" is a tab of the same settings workspace ("Payment Settings Navigation": Medios de cobro, Modalidades, Datos bancarios, Seguridad) that swaps the form column for "Editable Bank Account Form"; "Confirmar cambios" is an alertdialog ("Save Confirmation Dialog") over the main area opened from "Guardar cambios". One route, `/payments`, with in-page tabs.
- T1 done (572996f): `AcceptedPaymentMethod` / `BankAccount` / `PaymentSettings` / `SavedPaymentSettings` types and `PAYMENT_SETTINGS` mock (`src/mocks/payments.ts`, version 18, "09:42"; methods Efectivo/Tarjeta/Transferencia on, Otro off; request modes En mesa/En caja/Por transferencia on). Pure helpers in `src/features/payments/payment-settings.ts`: method/mode/bank-field options, `isValidCbu` (22 digits + both check digits), `isValidAlias` (6–20 letters/digits/dots/hyphens), `validateBankAccount` (required holder/bank/alias/CBU, 120-char instructions), `getSettingsIssues` (at least one method; "Por transferencia" requires the Transferencia method; valid bank data), `canDisableMethod`, `getSettingsChanges` / `isDirty` (trim-insensitive), `applySettings` (next version; an unchanged draft keeps the saved object), save-bar copy. Test-first: RED (missing `@/mocks/payments`), GREEN 20/20. Checks: tsc OK, lint OK, vitest 195/195.
- T1 notes: methods follow 06 (Efectivo, Tarjeta, Transferencia, Otro); "En mesa" / "En caja" / "Por transferencia" are request modes (`BillPaymentMethod`), not methods, so the export corrects the plan's method list; "Otro" is new to the mocks. Bank data kept from the export (holder "Café Central SRL · FICTICIO", "Banco Demo", alias "CAFE.CENTRAL.DEMO", CBU "0000000000000000000000"): obvious placeholders, and the all-zero CBU passes the check digits. The design has no CUIT field, so there is no CUIT validation. All validation error copy, the 120-character limit and "N cambios sin guardar" are invented.
- T2 done (f805cb6): `/payments` (sidebar "Pagos", placeholder replaced) renders `PaymentSettingsScreen` (container with `useReducer`) with `PaymentSettingsHeader` (breadcrumb, title, "Audit Status"), `PaymentSettingsNavigation` (tabs; "Seguridad" disabled), `PaymentSettingsForm` ("Accepted Payment Methods" and "Customer Payment Preferences" with `role="switch"` toggles; the last enabled method is locked; a danger notice repeats the transfer rule when "Por transferencia" is on without the Transferencia method), `SettingsPreviewColumn` ("Live Customer Payment Preview" listing the draft's enabled modes, "Transfer Guidance") and `PaymentSettingsSaveBar`. Pure `paymentsReducer` (select-tab, toggle-method, toggle-request-mode, discard) plus `getPaymentsView` (changes, dirty, issues, save-bar copy, locked methods, preview modes), test-first (RED missing module, GREEN 8/8). Shell: new `admin-location` top bar ("Café Central · Sede Centro", "Administrador" pill, dot-less bell, compact profile), test-first in `navigation.test.ts` (RED 1 failing, GREEN 13/13; the default-variant assertion moved to `/settings`). Checks: tsc OK, lint OK, vitest 204/204, build OK (20 static routes). Screenshot `pay-settings.png` matches `pay-export-settings.png` except the deviations below.
- T2 deviations: shared 10A sidebar instead of the 06 six-item one with the "Acceso administrador · Cambios auditados" footer (as in 05); 11/9px profile copy mapped to the compact 12/10px; type scale mapped by role (10px breadcrumb, 9px audit pill, method/mode descriptions, rules and notices → 11px; 11px subtitle and tab labels → 12px; 12px card titles → 13px; save-bar 10/9px → 12/11px; button 11px → 12px; preview 9/10px labels → 11px, 10px description → 12px, 11px option titles → 12px). With 11px descriptions the three 186px "Modalidad" cards grow to fit their copy (the export overflows its 64px cards). "Modalidades" shows the same form as "Medios de cobro" (the export shows both panels together); "Seguridad" has no design and is disabled ("Próximamente" tooltip). "Guardar cambios" keeps the export's look but is disabled while there are no changes; "Descartar cambios", "N cambios sin guardar", "Sin modalidades habilitadas." and the lucide icon choices are not in the exports. Saving is wired in T3.
- T3 done (35a2b68): `paymentsReducer` gains `set-bank-field`, `request-save` (no-op without changes; with broken rules it reveals every error, keeps the dialog closed and opens the bank tab when the bank data is invalid; otherwise opens the confirmation), `cancel-save` (keeps draft and saved settings), `confirm-save` (applies the draft as the next version at the current "HH:MM") and `discard` (also hides errors); `getPaymentsView` adds `bankErrors` (edited fields only until a save attempt). Test-first: RED 9 failing, GREEN 17/17. `BankAccountForm` ("Editable Bank Account Form": labelled inputs with `aria-invalid` / `aria-describedby` inline errors, "Bank Transfer Dependency" note in the danger tone while the rule is broken) and `SaveConfirmationDialog` ("Save Confirmation Dialog": `alertdialog` over the main area with the 30% ink backdrop, focus on "Cancelar", Tab cycles between the two buttons, Escape/backdrop/"Cancelar" cancel, focus returns to the opener). The save bar shows the first broken rule in red after a blocked save. `?state=bank|bank-errors|confirm`; README lists the route and variants. Checks: tsc OK, lint OK, vitest 213/213, build OK (20 static routes). Screenshots at 1440×900 (scratchpad, `pay-` prefix): `pay-settings`, `pay-bank`, `pay-confirm` match `pay-export-settings` / `pay-export-bank` / `pay-export-confirm` except the deviations; `pay-bank-errors` renders; flows `pay-flow-dialog` (toggle "Otro" → "Guardar cambios" → dialog, focus on "Cancelar"), `pay-flow-saved` (→ "Confirmar y guardar" → "Configuración sin cambios", "Versión 19") and `pay-flow-escape` (Escape keeps "1 cambio sin guardar" and "Versión 18") asserted in-page; `/`, `/tables`, `/orders`, `/bill-requests`, `/history` byte-identical to their `col-check-*` / `col-list` captures.
- T3 deviations: the "Datos bancarios" export overlays the bank form on the methods layout (backplate, nav shifted 11px up, the dependency note 65px below the form); the app swaps the form column and puts the note 12px below the form. The "Confirmar cambios" export has no change list and its save bar still reads "Configuración sin cambios" (copy leftover); `?state=confirm` seeds a pending staff-instructions change, so its save bar reads "1 cambio sin guardar" with "Descartar cambios". The version check ("Se verificará la versión antes de guardar.") has nothing to compare against in memory. Type scale mapped by role (15px form title → 14px panel title; 9px field labels → 11px; 10px values → 12px; 9px form description → 11px; 10px dependency note → 11px; dialog 11/15px description → 12/17px, 10px version note → 11px, 11px buttons → 12px). Error copy and the danger states are invented.
- Engram mirror `odd/admin-payments/tasks`: not written by the writer; left to the parent.
- RDD for T1–T3 (committed-only vs feat/admin-collections): assessed high (`high_risk`, payments); the user declined review for this candidate. Parent spot check: vitest 213/213.

## Next step
Native review decision by the parent; chain strategy before opening PRs.
