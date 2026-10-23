# Café Central · Admin

Frontend-only prototype of the Café Central staff back-office, built from the Pencil exports in
`exports/` (1440×900 desktop frames). There is no backend: auth and data are mocks in
`src/mocks/`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Checks: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.

## Demo credentials

| Field | Value |
| --- | --- |
| Email | `turno@cafecentral.com` |
| Password | `Mostrador2026!` |
| MFA code | `123456` |

Flow: `/login` → `/verify` (MFA) → `/` (overview). The admin routes redirect to `/login`
until the MFA step is completed. "Recordarme en este dispositivo" keeps the mock session in
`localStorage`; otherwise it lives in `sessionStorage` and ends with the tab. To sign out,
clear the site storage.

## Routes

| Route | Screen |
| --- | --- |
| `/login` | 11A · Staff Login |
| `/forgot-password` | 11B · Forgot Password |
| `/reset-password` | 11C · Reset Password |
| `/verify` | 11D · Multi-Factor Verification |
| `/` | 10A · Resumen general |
| `/tables` | 02 · Gestión de mesas |
| `/orders` | 03 · Gestión de pedidos (kanban, order drawer, cancel confirmation) |
| `/bill-requests` | 04 · Solicitudes de cuenta (requests table, quick-detail drawer) |
| `/history` | 05 · Historial de cobros (collections table with period, filters and pagination; read-only collection drawer) |
| `/payments` | 06 · Configuración de pagos (methods, request modes and bank details tabs, live customer preview, in-memory save after confirming) |
| `/tables/management`, `/tables/qr`, `/menu`, `/menu/products`, `/menu/categories`, `/settings`, `/staff` | "Próximamente" placeholder |

### Forced variants (`?state=`)

| Route | Values |
| --- | --- |
| `/login` | `error` (invalid credentials) |
| `/forgot-password` | `sent` (generic confirmation) |
| `/reset-password` | `mismatch`, `success` |
| `/verify` | `error` (wrong code) |
| `/tables` | `empty` (no tables), `no-results` (search for "Mesa 99") |
| `/orders` | `detail` (drawer of #1051), `cancel` (cancel dialog of #1051), `empty` (no orders), `no-results` (search for "9999") |
| `/bill-requests` | `selected` (drawer of Mesa 10), `empty` (no requests), `no-results` (search for "Mesa 99") |
| `/history` | `selected` (drawer of COB-0026), `empty` (no collections), `no-results` (search for "Mesa 99") |
| `/payments` | `bank` ("Datos bancarios" tab), `bank-errors` (invalid alias and CBU after a save attempt), `confirm` (save confirmation with a pending change) |

## Structure

- `src/app/(auth)` — auth screens with the split brand layout.
- `src/app/(admin)` — authenticated shell (sidebar + top bar) and modules.
- `src/features/<feature>` — screens, presentational components and pure helpers (with tests).
- `src/shared/ui`, `src/shared/lib` — reusable primitives and utilities.
- `src/mocks` — typed mock data and mock auth.
  - `src/mocks/service-day` — the single "service day" (21/10/2026 at 14:42) that 10A, 02, 03, 04 and
    05 derive their rows and metrics from: tables sessions, orders, bill requests, collections, the
    product catalogue, staff and the 06 payment method / request mode names. `service-day.test.ts`
    checks that the screens agree with each other. Some numbers differ from the exports on purpose
    (see `odd/tasks/admin-mock-unification.md`). Each screen keeps its in-memory actions to itself.
  - `src/mocks/payments.ts` — the saved 06 payment configuration.
