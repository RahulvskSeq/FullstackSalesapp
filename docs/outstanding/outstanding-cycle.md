# Outstanding cycles

A **cycle** is one continuous period during which a dealer owes money. It
opens when the balance becomes positive, closes when it reaches zero, and is
then permanent. A later balance opens a **new** cycle; a closed cycle is never
reopened.

```
Cycle 1   opened 03 Jun  ₹1,00,000
          payment ₹1,00,000
          CLEARED 28 Jun                       ← immutable from here
Cycle 2   opened 10 Jul  ₹75,000   OPEN        ← a new invoice, a new cycle
```

## Rules

1. At most one OPEN cycle per dealer (unique partial index on `{dealerId, status:'OPEN'}`).
2. Opened by: an import that classifies NEW or REOPENED; a manual invoice entry; an invoice-level import that introduces bills for a dealer with no open cycle.
3. Closed by: an import that classifies CLEARED; confirmed payments/adjustments that bring `total` to 0; a manual close (CLOSED_MANUAL, requires a reason, audited).
4. `openingTotal` and `openedAt` are fixed at open; `peakTotal` tracks the highest total seen; `finalTotal` is 0 for CLEARED.
5. `paidTotal` = Σ confirmed payments allocated to the cycle; `observedDecreaseTotal` = Σ DECREASED events. The gap between them is the cycle's unexplained collection.
6. Every payment, promise, follow-up, task and event carries `cycleId`, so a cycle can be read as a self-contained story.

## What the cycle is not

It is not an invoice. In bucket mode a cycle may contain several bill-month
buckets; in invoice mode it contains several `col_invoices`. Invoice-level
tracking lives in `col_invoices`; the cycle is the dealer-level envelope.

## Cycle numbering

`cycleNo` increments per dealer (1, 2, 3 …), assigned inside the apply
transaction from `max(cycleNo)+1`.
