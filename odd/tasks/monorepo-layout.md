# Feature: monorepo-layout

## Objective
Turn `central-perk` into a monorepo with the customer app in `web/` and the staff back-office in `admin/`, keeping the full history of both, and stack the admin module branches on top as chained PRs.

## Problem / Why
`central-perk` has the web app at the repository root and the admin lives in a separate local repository with no remote, so its six module branches cannot be reviewed or merged.

## Decision
User decision (2026-10-23): one repository, sibling folders `web/` and `admin/` (not admin inside web). Built first in a separate local clone (`coffee-prototipe-mono`); nothing is pushed until the user approves.

## Scope
- In scope: move web files to `web/` with `git mv`; import the admin history under `admin/` (rewritten with `git filter-branch`); rebase the admin branches into a linear chain on top of the layout branch; root README and .gitignore; verification of both apps.
- Out of scope: npm workspaces or shared packages, Vercel settings (the user must set the web project's Root Directory to `web`), pushing and opening PRs (separate step after approval).

## Tasks
- [x] T1 Local clone + `chore/monorepo-layout` branch: web moved to `web/`, root README/.gitignore, this doc. Route: delegated.
- [x] T2 Admin history rewritten under `admin/` and merged into the layout branch; admin module branches rebased as a chain. Route: delegated.
- [x] T3 Verify lint/tsc/tests/build for `web/` and `admin/` on the chain tip. Route: delegated.
- [ ] T4 Add `feat/admin-mock-unification` to the chain once it is finished. Route: delegated.
- [ ] T5 Push branches and open chained PRs (needs user approval and `gh`). Route: inline.

## Chain
main ← chore/monorepo-layout ← feat/admin-foundation ← feat/admin-tables ← feat/admin-orders ← feat/admin-bill-requests ← feat/admin-collections ← feat/admin-payments ← feat/admin-mock-unification

## Progress / Evidence
- T1: `chore/monorepo-layout` based on GitHub `main` (`1696744`). `refactor(repo): move web app into web/` (`e7c34c1`, 193 pure renames) and `docs(repo): add monorepo readme, root gitignore and layout plan` (`160543a`). No web path fixes were needed: scripts and configs resolve paths from their own directory.
- T2: admin history rewritten with `git filter-branch --index-filter` (`ls-files -s -z` + `update-index -z --index-info`) so every path sits under `admin/`. Each rewritten tip's `admin/` tree hash equals the original tip tree hash. Imported with `chore(repo): import admin history under admin/` (`d3dc806`), then each module branch was rebased with `git rebase --onto`. Per-branch `git diff --shortstat` against its parent and commit counts match the original admin repository exactly.
- T3: on the chain tip, `npm ci`, `npm run lint`, `npx vitest run` and `npm run build` pass in `web/` (125 tests) and `admin/` (236 tests). `npx tsc --noEmit` passes after `next build`. On a fresh checkout it fails with `Cannot find name 'PageProps'/'LayoutProps'`, because those globals come from Next's generated, gitignored route types. `chore/monorepo-layout` alone: `web/` build and tsc pass.

## Admin commit hash map
Old hashes come from the original local admin repository; new hashes are in this monorepo. Feature documents under `admin/odd/tasks/` still cite the old hashes.

Branch tips before this document commit: `chore/monorepo-layout` d3dc806, `feat/admin-foundation` 41ee831, `feat/admin-tables` 9aa1de6, `feat/admin-orders` d424b68, `feat/admin-bill-requests` 705ed2f, `feat/admin-collections` 17fcc86, `feat/admin-payments` d4000da, `feat/admin-mock-unification` c03d778.

| Old | New | Subject |
| --- | --- | --- |
| `6809650` | `4a1fa9a` | chore(exports): add admin design exports |
| `42fd059` | `5879d64` | chore(app): bootstrap Next.js 16 admin with Tailwind v4, ESLint and Vitest |
| `23d876d` | `1df603f` | feat(shell): add design tokens and admin shell with module navigation |
| `72a6c84` | `0acef29` | feat(auth): add staff login, password recovery and MFA screens with mock auth |
| `dd7ecaa` | `38e8a37` | feat(overview): add general overview dashboard with mock service metrics |
| `1f3b90c` | `41ee831` | docs(odd): record admin-foundation T3 hash and review outcome |
| `1b3142f` | `a95e2e3` | docs(odd): add admin-tables feature plan |
| `60cab81` | `7410eba` | feat(tables): add tables board mock and pure filtering helpers |
| `bd81cd7` | `1990d45` | feat(tables): add tables management screen with quick-detail panel |
| `d2388bc` | `965df44` | docs(odd): record admin-tables T2 hash and review outcome |
| `87e95d0` | `9aa1de6` | style(admin): align sidebar and overview type scale with tables and orders |
| `a77fb91` | `2b44d05` | docs(odd): add admin-orders feature plan |
| `d6c2df5` | `711590b` | feat(orders): add kitchen orders mock and pure board helpers |
| `e3efc89` | `c76ecff` | docs(odd): record admin-orders T1 progress |
| `ebc6b18` | `0dc48cf` | feat(orders): add orders kanban screen with 03 live top bar |
| `f568fc0` | `adc634a` | docs(odd): record admin-orders T2 progress |
| `bd649fe` | `2b05a0f` | feat(orders): add order detail drawer and cancel confirmation with in-memory reducer |
| `1667548` | `4d16d94` | docs(odd): record admin-orders T3 progress |
| `9697835` | `d424b68` | docs(odd): record admin-orders review outcome |
| `e9a60a2` | `bf7bb9e` | docs(odd): add admin-bill-requests feature plan |
| `94d4172` | `7996d8f` | feat(bill-requests): add bill requests mock and pure view helpers |
| `6ccc485` | `9c2002e` | docs(odd): record admin-bill-requests T1 progress |
| `ac2d893` | `fc3d649` | feat(bill-requests): add bill requests screen with 04 live top bar |
| `94c372d` | `d42b051` | docs(odd): record admin-bill-requests T2 progress |
| `6a335f5` | `bb8898e` | feat(bill-requests): add request detail drawer with in-memory attention reducer |
| `fae94bf` | `6628fec` | docs(odd): record admin-bill-requests T3 progress |
| `7216d09` | `705ed2f` | docs(odd): record admin-bill-requests review outcome |
| `9807230` | `89c8b8f` | docs(odd): add admin-collections feature plan |
| `ba9850a` | `54ad049` | feat(collections): add collections mock and pure history helpers |
| `bf6e7ca` | `f02faea` | feat(collections): add collections history screen at /history |
| `d93743c` | `851ced6` | feat(collections): add read-only selected collection drawer |
| `fa69f8a` | `f4bb3ed` | docs(odd): record admin-collections T3 commit |
| `8287c2a` | `17fcc86` | docs(odd): record admin-collections review outcome |
| `9402252` | `3e4dc0e` | docs(odd): add admin-payments feature plan |
| `572996f` | `722fe99` | feat(payments): add payment settings mock with diff and validation helpers |
| `03dcca2` | `b526731` | docs(odd): record admin-payments T1 |
| `f805cb6` | `d1665e3` | feat(payments): add payment settings screen with live customer preview |
| `c282bde` | `fc81041` | docs(odd): record admin-payments T2 |
| `35a2b68` | `3459f05` | feat(payments): add bank details form and save confirmation dialog |
| `8c10c62` | `cd0cb09` | docs(odd): record admin-payments T3 |
| `68b221d` | `d4000da` | docs(odd): record admin-payments review outcome |
| `afdaed8` | `4ea52f1` | docs(odd): add admin-mock-unification feature plan |
| `69a09c3` | `bf44ac4` | feat(mocks): add canonical service-day dataset with cross-screen invariants |
| `bcd234e` | `a9f7c93` | refactor(overview,tables): derive overview and tables from the service day |
| `f73b2e5` | `c27cb13` | refactor(orders,bill-requests,collections): derive from the service day and share 06 payment names |
| `1b5f230` | `51f8042` | chore(mocks): remove per-screen mocks and document the service day |
| `17ff2d1` | `c03d778` | docs(odd): record admin-mock-unification T4 and review outcome |
