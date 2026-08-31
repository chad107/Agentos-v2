# AgentOS — Human Developer Handoff

The practical companion to `IP_BOUNDARY.md`: exactly what to give a
contracted external developer today, given the current single-repository
architecture, and how that changes once the Core/Dashboard split
(`PRODUCTION_ARCHITECTURE.md` §2) is carried out.

## The honest starting point

**Today, this is one repository with no enforced boundary.** Anything
handed to a developer as "the repo" includes everything in
`IP_BOUNDARY.md`'s RESTRICTED bucket, whether or not you ask them to only
touch `src/app` and `src/components`. Read `IP_BOUNDARY.md`'s "Headline
finding" before deciding to hand over the whole repository to anyone
outside the owner's direct control.

## Recommended path: do the split first, then hand off

1. A trusted developer (or the owner, or this session) carries out
   `PRODUCTION_ARCHITECTURE.md` §2 Option A: convert remaining direct
   `@/repositories` imports in `src/app/**` pages into calls against
   `src/app/api/**` routes, then physically separate into two
   repositories.
2. **Only the resulting `agentos-dashboard` repository** goes to external
   contracted developers. It contains: `src/app/**` (pages), `src/components/**`,
   the type-shape-only domain files, a generated or hand-written API
   client against `API_CONTRACT.md`, and nothing else.
3. `agentos-core` stays under the owner's direct control — its
   developers, if any are ever needed, should be trusted, vetted, and
   ideally under a stronger agreement than a general "build my dashboard"
   contract, since they'd have the actual reasoning/governance/business-rule
   IP.

## If you need to hand something over before the split is done

Sometimes real timelines don't allow for step 1 first. If a contracted
developer must start before the split exists:

- **Give them a fresh checkout with the RESTRICTED files removed**, not the
  live repository. Concretely: clone the repo, `git rm -r` everything
  `IP_BOUNDARY.md` classifies RESTRICTED or OWNER-ONLY, commit that as a
  throwaway branch, hand over a zip or a repo pointed at that branch — not
  a fork of the real repository with full history (history would still
  contain the removed files).
- This will **break the application** — pages that currently import
  `@/repositories` directly won't compile without those files. A
  developer working this way needs, at minimum, typed stub/mock versions
  of the functions their pages call, so they can build UI against
  realistic-shaped fake data. Building those stubs is itself
  Human-Developer Implementation (mechanical, but not zero effort — see
  `PRODUCTION_READINESS_CHECKLIST.md`).
- **This is a worse option than doing the split properly** — it produces a
  Dashboard codebase that will need real rework to reconnect once Core
  is a real service. Only use it under real time pressure, and treat the
  split as still owed afterward, not optional.

## What to send them, in either case

### Documents (all SHAREABLE — none reveal Core reasoning)
- `README.md` (consider a trimmed version without the full v1
  implementation narrative)
- `API_CONTRACT.md`
- The relevant slices of `01_MASTER_SPEC.md` — specifically the "UX
  specification" and "Visual target" sections, not the whole document
  (the rest is business strategy — `IP_BOUNDARY.md` OWNER-ONLY)
- `.env.example` (never `ENVIRONMENT_VARIABLES.example` with real values
  filled in — send them a copy with only the variables their work
  actually needs, populated with *their* sandbox credentials, not
  production ones)

### Code (per `IP_BOUNDARY.md` SHAREABLE bucket)
`src/app/**` (pages), `src/components/**`, `src/domain/entities.ts`,
`enums.ts`, `index.ts`, `platform.ts` (type shapes only), `src/lib/api.ts`,
`cn.ts`, `dates.ts`, `ids.ts`, build tooling configs, `public/`.

### What to explicitly withhold
Everything in `IP_BOUNDARY.md`'s RESTRICTED and OWNER-ONLY buckets:
`src/cohen/**`, `src/approvals/**`, `src/audit/**`, `src/events/**`,
`src/config/**`, `src/repositories/**`, `src/data/**`,
`src/lib/auth.ts`/`tenant-context.ts`/`jsa-cadence.ts`,
`src/integrations/**`, `src/domain/governance.ts`/`memory.ts`/`events.ts`/
`authorization.ts`, `src/core/**`, every file carrying the
`PROPRIETARY — AgentOS Core` header comment (added this phase, so it's
`grep`-able: `grep -rl "PROPRIETARY — AgentOS Core" src/`), all top-level
spec/build-status documents, and real seed data (`src/data/seed.ts`,
`sample-data/`).

### Instructions to send them (copy-paste starting point)

> You're building the AgentOS dashboard UI. You have the frontend
> (pages, components) and the API contract it talks to
> (`API_CONTRACT.md`). You do not have, and don't need, the backend
> reasoning/orchestration code — treat every route in `API_CONTRACT.md` as
> a black box that returns the documented shape. Do not attempt to
> reverse-engineer or request the implementation behind any route. Use the
> sandbox credentials provided separately for any integration testing;
> never request or use production credentials. All code you write should
> go through [your normal PR/review process] before merging.

## Access control mechanics

- **Repository access:** invite to `agentos-dashboard` only, never
  `agentos-core`, once split. Pre-split, do not add external collaborators
  to this single repository at all — use the "fresh checkout" approach
  above instead.
- **Environment access:** staging only (`DEPLOYMENT_GUIDE.md`), with
  sandbox/test vendor credentials where the vendor offers them. Never
  production database credentials, never production secret-manager access.
- **CI/CD:** if they need to see build status, give read access to CI
  results, not write access to deployment triggers, until trust is
  established.

## Sanitized local-dev seed data

**Not yet built — Human-Developer Implementation.** `src/data/seed.ts`
contains Valley River's actual business narrative (styled as real
customer/job data, even though fictional). A generic, non-Valley-River
seed dataset (fake company name, generic customer/job names) should be
created for anything an external developer runs locally — flagged here
rather than built in this pass, since it means either hand-authoring a
parallel seed file or building a seed-data generator, and doing either
well is more than a "safe, additive" change to make unilaterally.
