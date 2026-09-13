# Outstanding + Collection CRM — rebuild

Replaces the legacy Outstanding module inside Sales Tracker Pro. Everything
outside it is untouched. Read in this order: this file → architecture →
database-design → the engine docs → migration → testing.

## Phase 1 findings (13 Sep 2026)

### What exists

| Piece | Where | State |
|---|---|---|
| Balances | `outstandings` (1,583) | keyed on **dealer name**; months `MAY/JUNE/JULY`; last written 18 Jul 2026 |
| Upload batches | `outstandingbatches` (1) | a Postman test only |
| Per-upload history | `outstandinghistories` (0) | **never populated in production** |
| Tally bills | `outstandingbills` (0) | endpoint exists, no data |
| Follow-ups | `outstandingfollowups` (285) | **227 open promises** — live business data |
| Server | `routes/outstanding.js` (744 lines), `routes/Followups.js`, `lib/commitments.js` | |
| Client | `components/Outstanding.jsx` (live code from line 5,652 of 7,569), `FollowupsHub.jsx` | |

### Why the current module does not work with the real data

The ERP export (`Outstanding Till june.xlsx`, 380 parties) names parties with an
embedded code: `CASA LUSSO-SSL14140`. The Dealer master carries no codes, so the
exact-name matcher matches **0 of 380** rows; 372 would be reported unmapped.
The live balances therefore came in through a Google-sheet CSV with a different
layout, which is why their month labels differ from what the route writes and
why the batch/history/revert machinery has never run.

### Two sources, opposite meanings

| Source | Example | Meaning of a month column | Total outstanding |
|---|---|---|---|
| ERP Excel | `CASA LUSSO: Jan 16,000 · Jun 500`, mostly zeros | pending amount from **bills raised in that month** (ageing bucket) | **sum** of columns |
| Legacy Google sheet | `MAY 27,589 · JUNE 35,989 · JULY 35,989` | balance **as at month end** (snapshot) | **latest** column |

The current code assumes the second. The new engine records the mode per
import (`balanceMode`) so both remain correct; the default is a confirmed
business decision (see *Open questions*).

### The ERP is invoice-level underneath

`Outstanding.pdf` (Bizmate ledger, 21 Aug) lists bill ref, bill date, due date,
overdue days and running balance per invoice. The module is designed for
invoice-level data where available and month buckets where not.

### Identity

- No dealer has a code, a phone number or a bound Tally GUID.
- 1,441 dealers, no case-insensitive duplicate names.
- Salesmen are `User.id` strings (`rakesh`), with `permissions.{states,cities,zones,salesmen,features,pages}`.

### Dependencies on the old module (must keep working)

| Consumer | Uses | Handling |
|---|---|---|
| `App.jsx` | holds `outstandingData` from `api.getOutstanding()` (legacy shape via `dbOutstandingToApp`) and a Google-sheet CSV fallback | `api.getOutstanding` repointed to a compatibility endpoint that returns the legacy shape from the new balances; CSV fallback retired |
| `SalesByCategory.jsx` | `outstandingData[].latestOutstanding` for the MTD column | unchanged — served by the compat shape |
| `Reports.jsx` → `OutstandingReport` | `outstandingData` + `api.getFollowups()` | unchanged — compat shapes |
| `DealerModal.jsx` | dealer balance + follow-ups | unchanged — compat shapes; later replaced by a Dealer 360 link |
| `FollowupsHub.jsx` | `api.getFollowups/updateFollowup` (legacy fields) | compat follow-up shape over the new tables |
| `routes/dealers.js:549`, `routes/auth.js:370` | move follow-ups on salesman handover | new tables added to the same move (additive) |
| `lib/actionPermissions.js`, `lib/featureFlags.js` | `manageOutstanding`, page `outstanding` | new `collections.*` keys added; old keys kept |

### Infrastructure the module builds on

JWT auth (`protect`, `adminOnly`, `superAdminOnly`, `requireFeature`), roles
`salesman | employee | admin | superadmin`, `AuditLog`, `Setting`, `Counter`,
Multer memory uploads, SheetJS + ExcelJS. **No** scheduler, queue,
notification store or WhatsApp integration exists. Passwords are compared in
plain text (see security.md — flagged, out of scope by instruction).

## Decisions taken (documented assumptions)

1. **Dealer code is the primary key for matching.** `SSL#####` parsed from the party name, stored on `dealers.code`, bound on first sight, manual mapping for the rest. Matching order: code → Tally GUID → exact normalised name → alias → manual. Never fuzzy.
2. **A file is a full statement.** An import replaces the dealer's *current* buckets; every previous statement is retained as a snapshot. Nothing is deleted.
3. **An observed decrease is not a payment.** It is a `DECREASED` event of unknown cause until a payment, credit note or adjustment explains it.
4. **Whole rupees** (integers), matching the rest of the application.
5. **New namespace, old module retained.** Server `server/collections/`, mounted at `/api/collections`; client `client/src/collections/`. Old routes stay mounted behind a feature flag for one release; old collections are never dropped.
6. **In-process job runner** for imports and automation (no queue infrastructure exists). Designed behind an interface so BullMQ can replace it.
7. **Sunday is not a working day** for follow-up scheduling defaults (consistent with billing data: 31/31 Sundays empty).

## Open questions (financial correctness — need confirmation)

1. Default `balanceMode` for the ERP Excel: **buckets** (recommended, per the evidence above) or snapshot?
2. Primary input going forward: the party-wise Excel, the Bizmate/Tally invoice export, or both?

Everything that does not depend on those answers is built first (see migration.md §Order).

## Where things are (13 Sep 2026)

Server — `server/collections/` (models, engines, services, routes, jobs,
integrations, migrations, tests); mounted at `/api/collections` from
`server/index.js`; feature keys in `lib/actionPermissions.js`; nav toggle
`collections` in `lib/featureFlags.js`; `dealers.code/aliases/phone/
whatsappOptOut` added to both Dealer schemas. `express.json` now keeps the
raw body (`req.rawBody`) for the WhatsApp webhook signature. The
resignation hand-over in `routes/auth.js` also moves the module's balances,
open tasks and pending promises; the hourly sweep re-checks ownership
against the dealer master anyway.

Client — `client/src/collections/` (`api.js`, `ui.jsx`, `forms.jsx`, one
file per screen, `index.jsx` shell). `App.jsx` gained one import, a nav
group `Collections` (ids `col*`, all carrying `flag:'collections'`), one
line in `pageVisible` honouring that flag, and one screen route.
`constants.js` lists the screens for page permissions. `api.js` exports
three helpers so the module shares the base URL, token and error handling.

Screens: Dashboard · Today · Outstanding · Payments · Follow-ups & promises
· Tasks · Import statements · Reconciliation · Reports · Employees ·
Settings (rules, automation, WhatsApp). Dealer 360 opens as a drawer from
any dealer name.
