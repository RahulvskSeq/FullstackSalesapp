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
