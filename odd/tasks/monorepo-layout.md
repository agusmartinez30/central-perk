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
- [ ] T1 Local clone + `chore/monorepo-layout` branch: web moved to `web/`, root README/.gitignore, this doc. Route: delegated.
- [ ] T2 Admin history rewritten under `admin/` and merged into the layout branch; admin module branches rebased as a chain. Route: delegated.
- [ ] T3 Verify lint/tsc/tests/build for `web/` and `admin/` on the chain tip. Route: delegated.
- [ ] T4 Add `feat/admin-mock-unification` to the chain once it is finished. Route: delegated.
- [ ] T5 Push branches and open chained PRs (needs user approval and `gh`). Route: inline.

## Chain
main ← chore/monorepo-layout ← feat/admin-foundation ← feat/admin-tables ← feat/admin-orders ← feat/admin-bill-requests ← feat/admin-collections ← feat/admin-payments ← feat/admin-mock-unification

## Progress / Evidence
- (pending)
