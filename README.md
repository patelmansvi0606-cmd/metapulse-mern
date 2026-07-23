# MetaPulse (MERN)

AI-native marketing automation for the Meta ecosystem — a MongoDB / Express / React / Node port of the original Next.js + Supabase build. Plain JavaScript throughout, no build step for the backend: Node runs the ESM source directly.

This port is being built in phases, matching the original's own module order. **Phase 1 (multi-tenant foundation) and Phase 2 (Model Router) are done and verified.** See [Current status](#current-status) below.

## Prerequisites

- Node.js >= 20 (developed against 22; 24 LTS recommended for production)
- pnpm (`npm install -g pnpm`)
- MongoDB running **as a replica set** — even a single-node one. Workspace creation and future content-versioning writes use a Mongoose transaction, and transactions require a replica set; a plain standalone `mongod` will not work.

### Starting a local one-node replica set

```bash
mongod --replSet rs0 --dbpath ./data/db
# in another terminal, once it's up:
mongosh --eval "rs.initiate()"
```

On Windows, run the equivalent from PowerShell (create the data directory first if it doesn't exist: `mkdir data\db`).

## Setup

```bash
pnpm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Fill in `.env`:
- `MONGODB_URI` — point at your replica set (see above)
- `JWT_SECRET` — generate one, don't guess one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` — both optional. Leave either or both blank and the app still runs fully; every AI-backed graph node (from Phase 3 on) falls back to its deterministic path instead of the process crashing. This is the resilience behavior the whole port is built around — see `packages/model-router`.

```bash
pnpm dev   # runs apps/api, apps/worker, and apps/client together via Turborepo
```

The API listens on `http://localhost:4000` by default (`GET /health` should return `{ "ok": true }` once Mongo is reachable); the client dev server runs on `http://localhost:5173` and proxies `/api` calls to it.

## Project structure

```
packages/
  schemas/       Zod contracts — the single source of truth for shapes crossing a
                 process boundary (roles, workspace/auth inputs, content/engagement
                 structured-output contracts)
  db/            Mongoose models, the AppError hierarchy, and tenancy.js — the
                 app-layer replacement for Postgres RLS (MongoDB has no RLS
                 equivalent, so this is the one place access control is allowed
                 to live)
  model-router/  Provider-agnostic AI routing — runs with Claude, Gemini, both,
                 or neither configured
  agents/        Content Graph + Engagement Graph (LangGraph.js), the
                 deterministic fallbacks split optimistic/conservative by node,
                 and RunRecorder — the audit trail
apps/
  api/           Express 5 — auth, workspaces, brand briefs, content-run and
                 comment-event routes (these enqueue work), Change Streams ->
                 Socket.io wiring
  worker/        Background job processing — polls the Mongo-native queue,
                 runs the Content/Engagement graphs
  client/        React 19 + Vite + Tailwind v4, Socket.io-connected, the
                 Studio kanban board
```

## Current status

| Phase | What | Status |
|---|---|---|
| 1 | Multi-tenant foundation — auth, workspaces, roles, tenancy enforcement | ✅ Done |
| 2 | Model Router — Claude/Gemini adapters, per-task routing, provider-optional resilience | ✅ Done |
| 3 | Content Graph + Engagement Graph + fallbacks + RunRecorder (the resilience upgrade itself) | ✅ Done |
| 4 | Worker fleet + Mongo-native job queue + the API routes that enqueue work | ✅ Done |
| 5 | React client — Socket.io live updates via Change Streams, brand palette, Studio kanban board | ✅ Done |

## Testing

```bash
pnpm test        # runs every package's suite via Turborepo
```

Two kinds of tests exist. Pure-logic and component tests (schema validation, role ranking, password/JWT utilities, the Model Router's retry logic and both agent graphs' full resilience behavior against mock providers, the poller's control flow, `ContentCard`'s status-driven rendering) run anywhere with no setup — 64 passing as of Phase 5. DB-integration tests (`packages/db/src/tenancy.test.js` and `queue.test.js`, `packages/agents/src/run-recorder.test.js` — 18 tests total) need a real MongoDB replica set and skip cleanly without one; set `MONGODB_TEST_URI` to a scratch database to run them for real.

## Design notes worth knowing before touching this code

- **`packages/db/src/tenancy.js` is the only place workspace access should ever be checked.** MongoDB has no RLS — there is no database-level backstop here the way the original had in Postgres. Every workspace-scoped route goes through `requireWorkspaceRole` (`apps/api/src/middleware/workspace-access.js`), and every service method takes `workspaceId` as a required parameter. Re-implementing a membership check anywhere else is a bug waiting to drift out of sync.
- **The queue (Phase 4) will be Mongo-native, not BullMQ/Redis** — Redis isn't one of the four MERN letters, and the original chose pgmq specifically so the queue lives in the same database as the data it's queuing. Same reasoning, Mongo-native equivalent.
- **The Model Router distinguishes "nothing configured" from "everything configured failed."** `ProviderUnavailableError` only fires when zero providers are set up for a task — nothing was attempted. If one or more providers were tried and all failed, an `IntegrationError` propagates instead. `content-graph.js`'s `routeApproval` branches on this exact distinction, the same way the original did.
- **`routeApproval` checks `usedFallback` before it checks pass/fail.** Compliance and quality-review fallbacks always return `passed: false` / `approved: false` — but a fallback's conservative default and a real AI check's genuine rejection are different claims, and routing them the same way (both to `rejected`) would turn "we couldn't check this" into "we checked this and it's bad." `usedFallback` is what keeps those separate: genuinely-failed routes to `rejected`, fallback-fired routes to `in_review`.
- **LangGraph.js (`StateSchema`) will not let a node name collide with a state field name** — ran into this directly while building the Content Graph (a node called `research` next to a state field called `research`). Renamed the node to `runResearch`; worth knowing before adding new nodes to either graph.
- **The queue's entire safety guarantee rests on one atomic `findOneAndUpdate`** in `packages/db/src/queue.js`'s `dequeue()` — that's what makes it safe to run more than one worker process against the same queue. Everything else in that file (attempts, backoff, the visibility-timeout re-claim) is bookkeeping around that one atomic operation, not a second source of correctness.
- **`apps/api`'s comment-event route is a stand-in, not the real Meta webhook.** It's an authenticated creation endpoint that exercises the Engagement Graph and queue correctly, but it's deliberately not yet HMAC signature verification against a Meta app secret, the subscription challenge/verify handshake, or page-to-workspace resolution — that's real, separate integration work with Meta's platform.
- **A dependency version bump broke `socket.js` silently until it was actually run** — `cookie` v2 renamed its exports (no more default export), and `node --check` (syntax-only) had no way to catch that; only actually importing the module surfaced the `SyntaxError`. `socket.test.js` exists specifically so every file gets imported by the test suite at least once, not just syntax-checked.
- **The client never talks to the worker, and the worker never talks to Socket.io.** They're separate processes. `apps/api/src/change-streams.js` watches `ContentItem`/`AgentRunStep`/`CommentEvent` via MongoDB Change Streams (needs the replica set already required for transactions) and re-emits over the socket — that's the entire bridge. No Redis pub/sub, no direct process link.
- **`eslint-plugin-react-hooks`'s advertised flat-config export (`configs['recommended-latest']`) is actually legacy-eslintrc-shaped** (`plugins: ["react-hooks"]` as a string array, which throws in real flat config). The genuinely flat-compatible version is nested one level deeper, at `configs.flat['recommended-latest']` — found by inspecting the installed package directly rather than trusting the obvious-looking property name.
- **`@testing-library/react` does not auto-cleanup between tests under Vitest** unless you either set `globals: true` or explicitly call `afterEach(cleanup)` — without it, each test's `render()` accumulates in the same DOM, so a later test can "find" an element a previous test rendered instead of testing its own output. `test-setup.js` wires this explicitly.
