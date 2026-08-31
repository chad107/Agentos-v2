# AgentOS — Deployment Guide

**Status: no deployment target is provisioned. This document is the plan a
human developer follows, not a record of something already deployed.**
AgentOS has never been deployed anywhere outside this development sandbox
— every verification claim elsewhere in this repository (`BUILD_STATUS_V2.md`
and its predecessors) is from `npm run dev`/`next start` on a local/sandbox
machine.

## Current state

- **Runtime:** Next.js 14.2, Node.js ≥18.18 (persistence needs ≥22.5 to
  actually persist — `src/data/persistence.ts` — but the app runs without
  it on older Node, just without durability).
- **Build:** `npm run build` produces a standard Next.js production build.
  Verified clean this session (52 routes, no errors).
- **Data:** local SQLite file (`DATABASE_DESIGN.md` explains why this
  isn't a production answer).
- **No containerization exists** — no `Dockerfile`, no `docker-compose.yml`.
  Not added in this pass, since the right base image and multi-stage build
  shape depends on the hosting target chosen below.

## Environments: dev / staging / production

**Status: Human Review Required (the split doesn't exist yet — there is
only "the sandbox").** Recommended separation, standard for a Next.js +
Postgres SaaS app:

| Environment | Purpose | Database | Notes |
|---|---|---|---|
| **Local dev** | Individual developer machines | Local SQLite (today) or a local/dev Postgres once the DB swap lands | `npm run dev`, no real secrets, mock integrations only |
| **Staging** | Pre-production verification, the environment external contracted developers should work against (`HUMAN_DEVELOPER_HANDOFF.md`) | A real, isolated Postgres instance, seeded with **synthetic** tenant data, never real Valley River data | Real auth provider in test/sandbox mode; real (or sandboxed) vendor OAuth apps where the vendor supports a sandbox |
| **Production** | The real Valley River tenant (and any future licensed tenant) | Real Postgres, real backups, real monitoring | Locked down: no external contractor gets direct production database or secret-manager access — see `HUMAN_DEVELOPER_HANDOFF.md` |

## Hosting target — Owner Decision

Not chosen. Two realistic paths given the current Next.js App Router
architecture, both compatible with everything built so far:

- **Vercel** — the path of least friction for a Next.js app specifically;
  built-in preview deployments per PR are a natural fit for the
  Core/Dashboard-split workflow once that split exists. Managed Postgres
  options (Vercel Postgres/Neon integration) simplify §"Database
  provisioning" below.
- **A general container host** (Fly.io, Render, AWS ECS/Fargate, etc.) —
  more portable, more setup. Necessary if `node:sqlite`-based local
  persistence is ever kept as a fallback mode (needs a persistent volume,
  which most serverless platforms don't offer) — though once the real
  Postgres migration lands this stops mattering.

Whichever is chosen, `PRODUCTION_ARCHITECTURE.md` §2's Core/Dashboard split
(if and when carried out) implies **two** deployables, which may reasonably
live on two different hosting choices (e.g. Dashboard on Vercel, Core on a
container host next to the database) — not a requirement, just an option
the split makes available.

## Database provisioning (once a provider is chosen)

Exact commands are in `DATABASE_DESIGN.md` "How to apply this" — summary:

1. Provision a Postgres 16 instance from the chosen managed provider.
2. As the provider's admin/superuser credential, run
   `db/migrations/0000_roles_and_setup.sql` with freshly generated
   `migrator_password`/`app_password`/`provisioning_password` — store all
   three in the environment's secret manager immediately, before doing
   anything else. **Never let these three passwords exist anywhere outside
   the secret manager and the one command that sets them** (not in a
   ticket, not in Slack, not in a shell history file left on a shared
   machine).
3. Run `db/migrations/0001` through `0005` as `agentos_migrator`.
4. Run `db/verify-rls.sql` as `agentos_app` and confirm every assertion
   passes — this is not optional; it's the proof the tenant-isolation
   design this repository documents is actually configured correctly in
   *this* environment, not just correct in the abstract.
5. Configure the application's `DATABASE_URL` to connect as `agentos_app`
   — never `agentos_migrator`.
6. **Rotating credentials:** generate new passwords, `ALTER ROLE ...
   PASSWORD ...` for the relevant role, update the secret manager, restart
   the application's connections. `agentos_provisioning`'s password should
   rotate on the tightest schedule of the three, since it's the one role
   with `BYPASSRLS`.

## CI/CD

**Status: not implemented.** No `.github/workflows/` or equivalent exists.
Recommended pipeline, in order, mirroring exactly what this repository's
own build discipline already requires locally (`BUILD_STATUS_V2.md`):

```
on: pull_request, push to main
1. npm ci
2. npm run typecheck
3. npm run lint
4. npm run test
5. npm run build
6. (once a real DB exists) spin up a throwaway Postgres, run db/migrations/*,
   run db/verify-rls.sql, tear down
7. Secret scan (gitleaks or equivalent) — required before any external
   developer has push access (IP_BOUNDARY.md)
8. On main only, after all of the above pass: deploy to staging automatically;
   deploy to production on a manual approval gate, never automatically
```

Nothing here is exotic — it is exactly the four commands
(`typecheck`/`lint`/`test`/`build`) already run manually before every
commit in this repository's history, made automatic.

## Rollback

**Status: Human Review Required.** Depends on hosting choice — most
platforms above support instant rollback to a previous deployment/build
artifact. The harder part is database migration rollback: `db/migrations/*`
are forward-only in this initial design (no `down` migrations were
written, since none has ever run against a real environment yet to need
reverting). **Recommendation:** adopt a migration tool with rollback
support (e.g. `node-pg-migrate`, Prisma Migrate, or Flyway) when this
schema is actually wired into the application, rather than hand-rolling
rollback SQL later under pressure.

## Summary status table

| Area | Status |
|---|---|
| Deployment target selected | Owner Decision — not made |
| Containerization | Not built |
| Dev/staging/prod separation | Designed, not provisioned |
| Database provisioning steps | Documented + verified against a real Postgres instance this session |
| CI/CD pipeline | Designed, not implemented (no CI config exists) |
| Rollback strategy | Partial (hosting-level only; DB migration rollback not designed) |
