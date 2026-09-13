# Migration and cutover

Principle: nothing is dropped. Old collections stay; old routes stay mounted
behind a flag for one release.

## Order of work

1. **Foundation** (no dependency on open questions): models, scope lib, audit, job runner, dealer code binding, import staging/hash/validation, follow-ups, promises, payments, tasks, settings, compat endpoints.
2. **Apply engine** (needs the balance-mode default confirmed): reconciliation, cycles, events, dashboard.
3. **Migration scripts** (idempotent, dry-run first).
4. **UI** screens.
5. **WhatsApp, automation tick, reviews.**
6. **Cutover**: nav switched; legacy nav hidden; `api.getOutstanding/getFollowups` repointed.

## Data migration (scripts in `server/collections/migrations/`, each `--dry-run`)

### M1 — dealer codes
Read every past input file available (`Outstanding Till june.xlsx` and any
later) and every import row: for each `NAME-SSL#####`, if exactly one dealer
matches the stripped name (normalised), set `dealers.code`. Report the rest
for manual mapping in the Imports screen. Expected from the June file: 8
auto-matches; the remainder are parties not yet in the Dealer master or
spelled differently — surfaced, never guessed.

### M2 — legacy balances → history + current
One import record: `source:'legacy'`, `fileName:'legacy-google-sheet'`,
`balanceMode:'snapshot'`, `asOn` = the latest `updatedAt` in `outstandings`
(2026-08-12 on live), periods `MAY/JUNE/JULY → 2026-05/06/07`. Rows are
matched to dealers by normalised name only (no code exists yet), staged as
import rows, and applied through the same engine as an Excel upload — in
500-row chunks, each chunk one transaction, resumable.

What the 1,583 rows become on live (dry-run figures, 13 Sep 2026):

| rows | what | where they go |
|---|---|---|
| 1,376 | matched a dealer | snapshot + balance; cycle OPEN for the 775 with money |
| 97 | a second spelling of a dealer already matched (double space, dropped `&`), always with a zero balance | import rows `DUPLICATE` — kept, never applied |
| 110 | no dealer with that name | import rows `UNMAPPED` — kept; Σ ₹38,42,286 |

Two spellings of one dealer both carrying money would be a real conflict;
the script refuses to run rather than pick one (none exist on live).
Σ applied = ₹9,19,96,968; plus the name-only rows = ₹9,58,39,254, the sheet's
own total. The cycle's `openedAt` is the legacy row's `createdAt`.

Re-running is a no-op once APPLIED; a run that stopped part-way resumes
from the chunk it reached.

### M3 — follow-ups → follow-ups, promises, payments
285 rows → `col_followups` (`legacyId`). `amount>0 && type!=='collection'` →
`col_promises` (275 on live). Open promises whose date has passed are marked
BROKEN by the first automation sweep, not by the migration. `credits[]`:
manual → CONFIRMED `col_payments` (`source:'migrated'`); upload → ADJUSTMENT
events. Live has no credits of either kind.

### Verification (`verify.mjs --db <name>`)
Prints legacy vs migrated counts and sums. The Σ line compares the sheet's
total against applied + folded + name-only, and the applied rows against the
balances; once later statements or confirmed payments exist the balances
have legitimately moved and the line says so instead of `CHECK`.

### Running on live (only with a go-ahead)
```bash
cd /var/www/FullstackSalesapp/server      # or the local server folder
node collections/migrations/m1-dealer-codes.mjs --dry-run
node collections/migrations/m1-dealer-codes.mjs --apply
node collections/migrations/m2-legacy-balances.mjs --dry-run
node collections/migrations/m2-legacy-balances.mjs --apply      # ~1 min on Atlas
node collections/migrations/m3-followups.mjs --apply
node collections/migrations/verify.mjs
```
Every script prints what it would do under `--dry-run` and writes nothing.
None of them modifies `outstandings`, `outstandingfollowups` or
`outstandingbatches`; M1 sets `dealers.code` on 8 dealers.

## Cutover and rollback

- The nav group is switched on/off with the existing Features toggle
  (`collections`); the legacy `outstanding` page keeps its own toggle.
  After the migrations run, switch the legacy page off and the new group on.
- The legacy consumers (`api.getOutstanding`, `api.getFollowups`, Dealer
  modal, Reports, Sales by Category) keep reading the old routes until the
  two lines in `client/src/api.js` are pointed at
  `/api/collections/compat/outstanding` and `/compat/followups` — a one-line
  change each, deliberately left until M2/M3 have run on live, because until
  then the compat routes would answer with nothing.
- 13 Sep 2026: cutover done on live; the legacy collections were exported to
  `~/Downloads/legacy-outstanding-backup-2026-09-13/` and then dropped at
  the owner's request. Rollback = `mongoimport` the files + flip the toggles.
- One release later: remove old routes/components; old collections archived (renamed `zz_legacy_*`), never deleted without a backup export.
