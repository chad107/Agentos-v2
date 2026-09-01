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

1. **The import-boundary conversion is now done (Phase 3A)** — every page,
   component, and API route imports only from `@/core`
   (`src/core/index.ts`), never `@/repositories/*` or any other
   Core-internal module directly, and an ESLint rule (`.eslintrc.json`
   `overrides`) enforces this mechanically rather than by convention. This
   means the one remaining step of `PRODUCTION_ARCHITECTURE.md` §2 Option A
   — physically separating into two repositories — now has a single,
   well-defined seam to cut along: everything importing `@/core` moves to
   `agentos-dashboard`; `@/core` and everything it re-exports (all of
   `@/repositories`, plus the Core-internal modules listed below) stays in
   `agentos-core`. A trusted developer (or the owner, or this session)
   still needs to do the actual physical split.
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
- This will **break the application** — every page and API route imports
  `@/core`, which won't compile without the files behind it. A developer
  working this way needs, at minimum, a typed stub `@/core` module
  re-exporting mock versions of the same functions/types, so they can
  build UI against realistic-shaped fake data. Building that stub is
  itself Human-Developer Implementation, but it's now a single, bounded
  task (one module to stub, `src/core/index.ts`'s exact export list) rather
  than chasing down every individual `@/repositories/*` import across
  dozens of files — the Phase 3A import-boundary conversion made this
  meaningfully more mechanical than it used to be.
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
`src/app/**` **pages only** (every subdirectory of `src/app/` except
`src/app/api/**` — see the correction note below), `src/components/**`,
`src/domain/entities.ts`, `enums.ts`, `index.ts`, `platform.ts` (type
shapes only), `cn.ts`, `dates.ts`, `ids.ts`, `src/data/seed.external-dev.ts`
(the sanitized local-dev dataset — see "Sanitized local-dev seed data"
below), build tooling configs, `public/`.

**Correction (Phase 3A):** `src/app/api/**` and the two helper modules only
route handlers use — `src/lib/api.ts` (the `ok()`/`badRequest()`/etc.
response shape) and `src/lib/validation.ts` (the zod request-validation
helpers) — are Core-side per `PRODUCTION_ARCHITECTURE.md` §2's target
architecture ("agentos-core: ... keep the API routes, drop the pages"),
not Dashboard-side. An earlier version of this list included them under
`src/app/**`/`src/lib/**`; verified while assembling an actual handoff
package that neither helper module is imported anywhere outside
`src/app/api/**`, confirming they belong with the routes, on the Core
side of the split.

### What to explicitly withhold
Everything in `IP_BOUNDARY.md`'s RESTRICTED and OWNER-ONLY buckets, plus
`src/app/api/**` and `src/lib/api.ts`/`validation.ts` per the correction
above:
`src/cohen/**`, `src/approvals/**`, `src/audit/**`, `src/events/**`,
`src/config/**`, `src/repositories/**`, `src/data/**` **except
`src/data/seed.external-dev.ts`** (the one file in that directory that's
deliberately SHAREABLE — see below),
`src/lib/auth.ts`/`tenant-context.ts`/`jsa-cadence.ts`/`api.ts`/`validation.ts`,
`src/integrations/**`, `src/domain/governance.ts`/`memory.ts`/`events.ts`/
`authorization.ts`, `src/core/**`, `src/app/api/**`, every file carrying
the `PROPRIETARY — AgentOS Core` header comment (added the Hardening
phase, so it's `grep`-able: `grep -rl "PROPRIETARY — AgentOS Core" src/`),
all
top-level spec/build-status documents, and real seed data
(`src/data/seed.ts`, `sample-data/`).

### Instructions to send them (copy-paste starting point)

> You're building the AgentOS dashboard UI. You have the frontend
> (pages, components) and the API contract it talks to
> (`API_CONTRACT.md`). You do not have, and don't need, the backend
> reasoning/orchestration code — treat every route in `API_CONTRACT.md` as
> a black box that returns the documented shape. Do not attempt to
> reverse-engineer or request the implementation behind any route. For
> local development, run `AGENTOS_SEED_DATASET=external-dev npm run dev` —
> this runs the app against a sanitized dataset with no real customer,
> staff, or vendor data, shaped identically to what production data looks
> like. Use the sandbox credentials provided separately for any
> integration testing; never request or use production credentials. All
> code you write should go through [your normal PR/review process] before
> merging.

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

**Built in Phase 3A.** `src/data/seed.ts` contains Valley River's actual
business narrative (customer names, staff names, vendor relationships,
service-area place names — styled as real business data because it's
generated from the real business's actual operating detail, even where
individual records are fictionalized). `src/data/seed.external-dev.ts` is
the same 19 entity collections and shapes, with every one of those
identifying strings replaced by a fictional equivalent — including ones
embedded in email-greeting text and tracking-reference abbreviations, not
just the obvious name/id fields. Verified clean by an explicit grep-based
check for every real name/place/vendor string after generation.

**Usage:** `AGENTOS_SEED_DATASET=external-dev npm run dev`
(`src/data/store.ts` selects between the two seed modules based on this
env var; unset, the app behaves exactly as it always has). One real
caveat, found while verifying this: Next.js statically optimizes some
read-only API routes at *build* time, so the env var only takes effect for
those routes if it's set before the app is built, not just before it's
started — set it before `npm run dev` (which always executes fresh, no
caveat) or before `npm run build` if testing a production build. See
`README.md` "External-developer local dev" for the same note in context.

**Send external developers `src/data/seed.external-dev.ts` itself** (it's
in the SHAREABLE code list above) so they have a concrete, readable
reference for exactly what shape of data the app expects — never
`src/data/seed.ts`, which stays withheld.
