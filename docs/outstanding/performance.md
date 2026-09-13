# Performance

Targets: 100k dealers, millions of payments/follow-ups/audit rows, 50k-row
imports, without loading collections into the browser.

- **Indexes** as listed in database-design.md; compound indexes match the list screens' filter+sort.
- **Pagination everywhere**: `page/limit(≤200)/sort`; cursor pagination on the timeline and audit (`at:-1, _id`).
- **Server-side filtering and aggregation**: dashboard tiles are `$group` aggregations, cached for 60 s per scope key.
- **Import**: staged in bulk (`insertMany` 1,000 rows at a time), matched with two in-memory maps built once (code→dealer, normalised name→dealer), applied in 500-dealer transactional chunks, run as a job above 1,000 rows so the request returns immediately.
- **Current-state reads** never touch snapshots or events; `col_balances` alone serves the Outstanding list.
- **Denormalised `salesmanId`** on balances/tasks/promises so scope filters are single-index hits.
- **Activity rollups** precomputed nightly; reports read rollups, not raw events.
- **Exports** stream with ExcelJS row-by-row; never buffered whole in memory.
- **No N+1**: lists join dealer names via one `$lookup` or one `$in` fetch.
- **Attachments** out of line so list documents stay small.
- The compat endpoints (legacy shape) are the only place a full-collection read remains; they are gated to the legacy consumers and paginated internally.
