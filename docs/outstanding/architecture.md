# Architecture

## Boundaries

```
client/src/collections/            server/collections/
  index.jsx  (module shell)          routes/      HTTP only: parse → authorize → call service → respond
  screens/   Dashboard, Today,       services/    business logic; no req/res; unit-testable
             Outstanding, History,   engines/     import, reconciliation, cycles, automation
             Dealer360, Payments,    models/      Mongoose schemas (col_* collections)
             FollowUps, Promises,    jobs/        runner + job types
             Tasks, Imports,         integrations/whatsapp (Meta Cloud API adapter)
             Reconciliation,         lib/         scope, money, dates, audit
             Reports, Employees,     compat/      legacy-shape endpoints for untouched consumers
             Settings
  api.js     (module API client)
```

Mounted at `/api/collections`. The legacy `/api/outstanding` and `/api/followups`
stay mounted, gated by the `legacyOutstanding` feature flag (default: API on,
navigation off) for one release, then removed.

## Request path

`protect` → `scope(req)` resolves the caller's dealer scope **once** (reusing the
exact rules in `routes/dealers.js`: superadmin all; salesman own book; others
by states/cities/zones/salesmen) → route validates input → service → Mongo.
Every list endpoint is paginated (`page`, `limit ≤ 200`, `sort`) and filtered
server-side. No endpoint returns an unbounded collection.

## State model

Four kinds of truth, kept in separate collections and never conflated:

| Kind | Collection | Written by | Mutability |
|---|---|---|---|
| Current state | `col_balances`, `col_cycles`, `col_invoices` | reconciliation engine, payment service | updated in place, versioned |
| Snapshot history | `col_snapshots`, `col_import_rows` | import engine | append-only |
| Event history | `col_events` | every engine and service | append-only |
| Business records | `col_payments`, `col_payment_allocations`, `col_followups`, `col_promises`, `col_tasks`, `col_whatsapp_messages` | services | append; status changes only |

Audit (`col_audit`) records who changed what, with before/after, for all of them.

## Flows

**Import** — see excel-import.md. File → hash → stage → validate → match →
diff → preview → confirm → apply (chunked transactions) → events → tasks →
audit. Large files run as a job; the UI polls `col_jobs`.

**Payment** — see payment-system.md. Explicit, allocated, confirmed. Reduces
`col_balances.total` only when confirmed; the next import's observed figure
is reconciled against it, never overwritten by it.

**Automation** — see task-system.md. Rules in settings, evaluated on events
(import applied, payment confirmed, promise due) and on an hourly tick.

## Jobs

`jobs/runner.js`: a single in-process worker pulling from `col_jobs`
(status QUEUED → RUNNING → DONE/FAILED, with `progress` and `heartbeatAt`).
Work is chunked with `setImmediate` so the event loop stays responsive. A job
that dies mid-way is resumable because every apply step is idempotent on
`(importId, dealerId)`. Interface: `enqueue(type, payload)`, `handlers[type]`.
Swapping in BullMQ later touches only this file.

## Compatibility layer

`compat/` serves the three untouched consumers with the shapes they expect:

- `GET /compat/outstanding` → `[{ _id, dealerName, monthlyOutstanding }]` built from `col_balances`
- `GET /compat/followups` → legacy follow-up rows built from `col_followups` + `col_promises`
- `PUT /compat/followups/:id` → maps legacy `status:'done'` onto promise/task completion

`api.getOutstanding` and `api.getFollowups` are repointed here; nothing else in
those components changes.
