# Reconciliation engine

Runs at apply time, per dealer, comparing this import's figure with the
dealer's **latest applied snapshot from the same source**. It also runs when a
payment is confirmed. It writes snapshots, updates the balance, drives the
cycle engine and appends events. It never guesses cause.

## Classification

| previous | current | classification | event |
|---|---|---|---|
| none / 0, no prior cycle | > 0 | NEW | NEW_OUTSTANDING |
| 0 with a CLEARED cycle | > 0 | REOPENED | REOPENED (+ new cycle) |
| a | b > a | INCREASED | INCREASED (amount b−a) |
| a | b < a, b > 0 | DECREASED | DECREASED (amount a−b, cause UNKNOWN) |
| a > 0 | 0 | CLEARED | CLEARED (+ cycle closed) |
| a | a | UNCHANGED | UNCHANGED (no event unless verbose) |

## The accounting rule

A decrease observed in a statement is **not** a payment. It is recorded as
`DECREASED` with `cause: 'UNKNOWN'`. Causes are attached only when there is
evidence:

| Evidence | Recorded as |
|---|---|
| payment confirmed in Payments | PAYMENT_CONFIRMED, allocated to cycle/invoices |
| credit/debit note entered | ADJUSTMENT |
| invoice disappears from invoice-level source | INVOICE_SETTLED |
| none | DECREASED (unknown) |

After each import the engine computes, per dealer over the interval since the
previous snapshot:

```
observedDecrease  = max(0, prevTotal − currentTotal)
explainedDecrease = Σ confirmed payments + Σ adjustments in the interval
difference        = observedDecrease − explainedDecrease
```

A non-zero difference is written as `RECONCILIATION_DIFFERENCE` and shown on
the Reconciliation screen (positive = money arrived that nobody recorded;
negative = a recorded payment the ERP does not yet reflect). Neither side is
altered to force agreement.

## Bucket-mode detail

In `buckets` mode the engine also diffs per bucket, so "the March bill got
paid, a June bill was added" is visible even when the total is unchanged.
`oldestPeriod` and `ageDays` come from the oldest non-zero bucket.

## Snapshot-mode detail

Only the total is comparable. Ageing comes from `col_invoices` where the
invoice-level source has populated them; otherwise `ageDays` is null and the
UI says "ageing unavailable" rather than inventing one.

## Balance status derivation (after every change)

```
total == 0                          → CLEARED (then CLOSED once the cycle is closed)
promise pending, date ≥ today       → PROMISED
promise BROKEN                      → FOLLOW_UP_REQUIRED
confirmed payment in cycle, total>0 → PARTIAL_PAYMENT
ageDays > overdueDays (settings)    → OVERDUE
total ≥ highValue (settings)        → HIGH_PRIORITY
new cycle, no follow-up yet         → NEW
else                                → OPEN
```
Priority is derived from total, ageDays and broken-promise count with
thresholds in `collections.priorityThresholds`.
