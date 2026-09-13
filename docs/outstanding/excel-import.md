# Excel import pipeline

Excel is **input**, never the system of record. Every file becomes an immutable
`col_imports` record whether or not it is applied.

## Stages

```
1 receive    multer (memory, ≤ 15 MB, .xlsx/.xls/.csv only)
2 hash       sha256 → existing APPLIED import with same hash → status DUPLICATE, stop
3 parse      SheetJS, first sheet, header row auto-detected (first row containing a
             party/dealer/name column)
4 stage      one col_import_rows doc per data row; nothing else touched
5 validate   amounts numeric; period headers recognisable; at least one period;
             party non-empty; per-row errors recorded, not fatal
6 normalise  party → { name, code } (code = trailing -SSL##### / SSL ##### );
             period header → YYYY-MM (handles "Aug", "(3)\nAug", "Aug-26",
             "August 2026", ISO dates, Excel serials); amounts → whole rupees
7 match      code → tallyGuid → exact normalised name → alias → none
             (never fuzzy); binds code/alias on the dealer on first sight
8 diff       against the latest APPLIED snapshot per dealer for the same
             source: NEW / INCREASED / DECREASED / CLEARED / UNCHANGED /
             REOPENED (see reconciliation-engine.md)
9 preview    stats + top changes + unmapped + errors + potential duplicates;
             user sets/confirms asOn and balanceMode
10 confirm   POST /imports/:id/apply → job enqueued (> 1,000 rows) or inline
11 apply     chunked transactions (database-design.md)
12 events    col_events per classified row; automation rules fire
13 audit     col_audit rows; import status APPLIED with duration
```

## Period detection (rolling window)

Periods are whatever the file contains — no month is hard-coded. A file with
Aug…Jun (11 columns) and a file with Jul/Aug/Sep (3) are both valid. Periods
present in an earlier import but absent from this one are **not deleted**: they
remain in `col_snapshots` and are visible under History. The dealer's *current*
buckets are replaced by this file's buckets, because a file is a full statement.

## Balance mode

| `balanceMode` | Column meaning | `total` | ageing |
|---|---|---|---|
| `buckets` | pending from bills raised in that month | Σ columns | from bucket month |
| `snapshot` | balance as at that month end | latest column | from invoices if any, else unknown |

Detected heuristically (many zero cells with isolated values → buckets;
monotone non-decreasing rows → snapshot) and shown in the preview for the
user to confirm. The default comes from `collections.balanceModeDefault`.

## asOn

The date the statement represents. Taken from a date in the file name or a
header cell if present; otherwise the user enters it in the preview. Defaults
to today. Two imports with the same `(source, asOn)` replace each other's
snapshot rather than stacking.

## Idempotency and safety

- Same file twice → DUPLICATE (hash).
- Same statement date re-uploaded (corrected file) → snapshot for that asOn replaced; the earlier import stays on record as SUPERSEDED in stats.
- Apply is resumable and never leaves partial current state (transactions per chunk; `appliedChunks`).
- Manual payments are never deleted by an import (payment-system.md).
- Unmapped parties are stored with their amounts on the import row and can be mapped later without re-upload; mapping applies the row then.

## Preview payload

```
fileName, fileHash, source, balanceMode (+ detected), asOn, periods[],
stats { rows, parties, matched, unmapped, errors, new, increased, decreased,
        cleared, unchanged, reopened, totalBefore, totalAfter },
topChanges[≤100] { dealer, before, after, delta, classification },
unmapped[] { row, rawParty, code, suggestions[] (exact-name after code strip only) },
errors[] { row, message },
duplicatesInFile[] { code|name, rows[] }
```
