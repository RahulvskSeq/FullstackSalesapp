# Testing

Everything runs with `node --test` from `server/`. Integration suites create
their own scratch database on the same Atlas cluster (`test_col_*_<ts>`),
copy nothing but `dealers` from live (read-only), and drop it at the end.
No test writes to the live database.

```bash
cd server
node --test collections/tests/periods.test.mjs               # 12 · pure parsing
node --test collections/tests/reconcile.test.mjs             # 5  · classification, totals, ageing, status
node --test collections/tests/engine.integration.test.mjs    # 8  · the real ERP file + edges 1–6, 13, 14 (~5 min)
node --test collections/tests/flows.integration.test.mjs     # 7  · tests 7–12 + hand-over (~30 s)
node collections/tests/perf.mjs 50000                        # timing run, see below
```

## What is covered (all passing, 13 Sep 2026)

| # | Case | Where | Assert |
|---|---|---|---|
| — | the real `Outstanding Till june.xlsx` | engine | 380 rows staged, 11 months detected as buckets, unmapped mapped/added, 373 NEW, Σ matches the sheet, codes bound |
| 1 | same file twice | engine | second upload `DUPLICATE` by hash; nothing written |
| 2 | 1,00,000 → 70,000 | engine | DECREASED 30,000, cause UNKNOWN, no payment invented |
| 3 | 70,000 → 0 | engine | CLEARED; cycle 1 CLEARED, `finalTotal` 0 |
| 4 | later 50,000 | engine | cycle 2 OPEN; cycle 1 untouched |
| 5 | a month drops out of the file | engine | earlier snapshot still readable |
| — | an older statement uploaded later | engine | recorded as history; current figure unchanged |
| 6 | name changes, code same | engine | same dealer, alias learned, nothing unmapped |
| 7 | invoices for one dealer | flows | `col_invoices` per bill |
| 8 | one payment, two invoices | flows | allocations exact; over-allocation refused; bounce reopens the bills |
| 9 | payment confirmed here, then the statement | flows | decrease explained; no RECONCILIATION_DIFFERENCE |
| 10 | promise date passes | flows | BROKEN by the sweep; one PROMISE_FOLLOW_UP task, never repeated |
| 11 | dealer cleared | flows | cycle CLEARED; open tasks CANCELLED |
| 12 | money after clearance | flows | REOPENED; cycle 2; CALL task |
| 13 | invalid files | engine | refused with a reason; a bad cell fails only its row |
| 14 | crash mid-apply | engine | chunk 1 kept, chunk 2 not recorded; resume finishes with exactly one snapshot per row |
| — | hand-over | flows | balance scope and open work follow the dealer's new salesman |

Also exercised by hand on a scratch copy of live data (`test_col_ui`):
migrations M1→M2→M3 → verify; every screen of the UI; the follow-up form
from the browser; record → confirm → bounce of a payment through the API,
checking that the balance, the promise and the cycle move and move back.

## Performance (generated files, Atlas shared tier, from the dev machine)

| rows | stage | preview | apply | list page 500 | result |
|---|---|---|---|---|---|
| 10,000 | 5.5 s | 2.5 s | 25.9 s | 0.0 s | every row present, Σ balances = Σ file |
| 50,000 | 50.8 s | 28.9 s | all 100 chunks written, then the run hit the cluster's **space quota** on the final row update | — | not completable on the current cluster |

The 50,000-row run needs about 95 MB of working space; the live cluster is
a 512 MB shared tier with ~80 MB free, so Atlas refused the last write
("would put you over your space quota") and the scratch database was
dropped. The engine itself is linear — 500-row chunks, five reads and four
bulk writes per chunk — and the apply runs as a background job above 1,000
matched rows, so the request returns at once and the UI polls the job.
Most of the time measured here is Atlas round-trips from a laptop; on the
VPS next to the cluster it is several times faster. For 100k dealers the
cluster tier, not the code, is the constraint.
