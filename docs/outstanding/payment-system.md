# Payments and allocation

Payments are explicit transactions. They are never inferred from a statement
and are never overwritten or deleted by an import.

## Payment record

`col_payments`: number (Counter `col_payment`), dealer, cycle, date, amount,
mode, reference, bank reference, collected by, entered by, remarks, proof
(attachment id), status.

Status flow: `RECORDED → CONFIRMED` (accounts/admin) → optionally `BOUNCED`
(cheque) or `CANCELLED` (with reason). Only **CONFIRMED** payments reduce the
current balance and count toward promises and reviews. A salesman may
*record*; only `employee` with the `collections.payments` feature, `admin`
or `superadmin` may *confirm* — enforced server-side.

## Allocation

One payment → many invoices (or the cycle when no invoices are known):

```
Payment ₹1,00,000
  Invoice A  ₹40,000
  Invoice B  ₹35,000
  Invoice C  ₹25,000
```

Stored in `col_payment_allocations`; Σ allocations ≤ amount; the remainder is
`unallocated` on the payment and shown until allocated. Allocation defaults to
oldest open invoice first (FIFO) and can be edited. In bucket mode with no
invoices, allocation targets the cycle and the oldest bucket is reduced first.

## Effect on state

On confirm (in one transaction): balance.total −= amount (floor 0);
buckets/invoices reduced per allocation; `lastPaymentAt`; open promises for
the dealer credited oldest-first (promise status → PARTIALLY_FULFILLED /
FULFILLED); PAYMENT_CONFIRMED event; if total reaches 0 the cycle is CLEARED;
automation rule "cleared → close tasks" fires.

On the next import the reconciliation engine compares the statement's
decrease with confirmed payments and reports any difference — it does not
undo the payment.

## Migration of legacy credits

Legacy `credits[]` on follow-ups: `source:'manual'` → a CONFIRMED payment
(`source:'migrated'`, entered by the credit's `by`); `source:'upload'` (an
inferred balance drop) → an `ADJUSTMENT` event, **not** a payment, because it
was never evidence of money received.

## Statement decreases → pending approvals (added 14 Sep 2026)

The morning statement often shows a dealer owing less than the day before
with no payment recorded in the app. The engine already records that gap as
a `RECONCILIATION_DIFFERENCE` event (amount = observed decrease − confirmed
payments in the interval). Those events are now the **pending approvals**
queue:

- `GET  /api/collections/payments/pending-approvals` — unapproved decreases in scope, with dealer, months, balance, open promises.
- `POST /api/collections/payments/approvals/:eventId/approve` (`collections.payments`) — money received: writes a CONFIRMED `col_payments` row with `source:'statement'`, dated the statement, credits promises (open first, then broken), adds to the cycle's `paidTotal`, marks the event `meta.approved=true`. **The balance is not changed** — the statement already moved it.
- `POST …/approvals/:eventId/dismiss` — not a payment (credit note, return, correction): `meta.approved=false` + reason.

UI: the dashboard tile "Statement decreases to approve", the banner + button on
Today's work, and an amber "₹X came · pending approval" chip on any dealer row
until accounts decides. Dealers that reached ₹0 drop out of the day's work
list on their own. Test: `collections/tests/approvals.integration.test.mjs`.
