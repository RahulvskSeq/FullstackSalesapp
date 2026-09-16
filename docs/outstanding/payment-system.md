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

## The sheet as proof — automatic confirmation (15 Sep 2026)

A payment a salesman **recorded** is confirmed on its own when a statement
shows the dealer down by at least that amount (payment date ≤ statement
date). Runs after every applied statement (hook `import.applied`) and again
the moment a payment is recorded, in case the statement already showed the
drop. Effect: payment → CONFIRMED (remarks note the statement), promises
credited, cycle `paidTotal` moved, the decrease event's `amount` reduced by
what it explains (fully explained → `meta.approved=true, auto:true`). The
balance is never touched — the statement moved it. What the sheet cannot
account for stays in Pending approvals: a bigger drop leaves the remainder;
a recorded payment bigger than the drop stays RECORDED for accounts.
Test: `collections/tests/autoconfirm.integration.test.mjs`.

Promises count as proof too: an open (or broken) promise whose remaining
amount is ≤ the unexplained decrease is written as a confirmed payment from
the statement and marked kept. A drop smaller than the promise is not proof
— it waits for accounts, and the promise stays open.

## The statement is the record (15 Sep 2026, final rule)

No buttons. After every applied statement, for each dealer whose figure
dropped:
1. recorded payments (dated ≤ statement) that fit the drop → CONFIRMED;
2. open/broken promises that fit what is left → kept, written as a
   `source:'statement'` payment;
3. whatever is still left → written as a `source:'statement'` payment too
   (`unmatched` = its amount), so it shows as collected everywhere.
A salesman who records a payment *after* the sheet already counted it gets
his record confirmed against those statement payments, which shrink by that
amount (money counted once, collection credited to him). A record bigger
than any drop stays RECORDED (amber row) until a sheet shows it.
Today's work opens with **Payments came · statement of <date>**. The manual
approval queue still exists behind `COLLECTIONS_APPROVALS=1` (tests cover
both modes); the UI no longer shows Confirm/Bounce/Approve.

Partial cover: a recorded entry bigger than any one day's drop shows
"came so far ₹X · not yet ₹Y" in the Pending list (`cameSoFar` = statement
payments for that dealer dated on/after the entry, still unmatched, capped
at the entry). Once several days add up to the entry it is confirmed and
takes over that much of the statement payments. What came is always in
Payments; the entry itself is never counted until covered.
