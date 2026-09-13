# Follow-ups and promises

## Follow-ups are events

Every interaction is one immutable `col_followups` row. Nothing is edited in
place except a typo correction within 15 minutes by its author (audited). The
dealer's history is the ordered list of these rows.

Fields: dealer, cycle, employee, date, time, channel, discussion, outcome,
customer response, promise (id), next follow-up date, next action, remarks,
created by/at.

Outcomes: NO_ANSWER · CALLBACK · PROMISED · DISPUTED · PARTIAL · PAID ·
NOT_REACHABLE · OTHER. Choosing PROMISED requires an amount and a date and
creates the promise in the same request.

Recording a follow-up updates `col_balances.lastFollowupAt` and
`nextFollowupAt`, appends a FOLLOWUP event, and awards task points if a task
of matching type is open for that dealer (task-system.md).

## Promises

`col_promises`: dealer, cycle, employee, amount, promise date, status,
received, source follow-up, notes.

```
PENDING ──(confirmed payment ≥ amount)──► FULFILLED
   │ ──(payment < amount)──────────────► PARTIALLY_FULFILLED ──► FULFILLED
   │ ──(date passes, received < amount)► BROKEN ──(payment)──► FULFILLED
   └ ──(user cancels, reason)──────────► CANCELLED
```

Payments credit a dealer's promises oldest-first. `BROKEN` is set by the
hourly automation tick the day after `promiseDate`; it creates a
PROMISE_FOLLOW_UP task at HIGH priority for the promising employee and a
PROMISE_BROKEN event. A promise is never deleted; cancelling records why.

## Today screen (salesman)

One query, one screen, answering "what do I do today":
today's follow-ups · overdue follow-ups · promises due today · broken
promises · high-priority dealers · open tasks (due today / overdue) · recent
payments confirmed on my dealers · new outstanding since last visit ·
recently cleared. Each row opens the dealer sheet with a single
**Record follow-up** action that captures outcome → promise → next date →
task completion in one form.

## Migration

Legacy follow-ups (285) → `col_followups` one-for-one (`source:'migrated'`,
`legacyId`). Rows with `amount > 0` and `type !== 'collection'` (227 open + 8
settled) also become `col_promises`, status from the legacy commitment state
(OPEN → PENDING, BROKEN → BROKEN, SETTLED → FULFILLED). `type:'no-pickup'` →
outcome NO_ANSWER. See migration.md.
