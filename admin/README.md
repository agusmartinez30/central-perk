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
| `/tables/management`, `/tables/qr`, `/orders`, `/bill-requests`, `/history`, `/menu`, `/menu/products`, `/menu/categories`, `/settings`, `/payments`, `/staff` | "Próximamente" placeholder |

### Forced variants (`?state=`)

| Route | Values |
| --- | --- |
| `/login` | `error` (invalid credentials) |
| `/forgot-password` | `sent` (generic confirmation) |
| `/reset-password` | `mismatch`, `success` |
| `/verify` | `error` (wrong code) |
| `/tables` | `empty` (no tables), `no-results` (search for "Mesa 99") |

## Structure

- `src/app/(auth)` — auth screens with the split brand layout.
- `src/app/(admin)` — authenticated shell (sidebar + top bar) and modules.
- `src/features/<feature>` — screens, presentational components and pure helpers (with tests).
- `src/shared/ui`, `src/shared/lib` — reusable primitives and utilities.
- `src/mocks` — typed mock data and mock auth.
