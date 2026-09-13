# Tasks, points and automation

## Collection tasks

`col_tasks`, deliberately separate from the app's generic `tasks` collection.
Types: CALL · VISIT · PAYMENT_COLLECTION · WHATSAPP · SEND_STATEMENT ·
SEND_INVOICE · FOLLOW_UP · ESCALATION · VERIFICATION · PROMISE_FOLLOW_UP ·
CUSTOM. Priority LOW/MEDIUM/HIGH/URGENT. Status OPEN → IN_PROGRESS → DONE, or
CANCELLED / EXPIRED. Comments append; completion stamps who and when and
awards points.

## Points

Configurable in `Setting` key `collections.taskPoints`:

```
{ CALL:1, FOLLOW_UP:2, VISIT:3, WHATSAPP:1, PAYMENT_COLLECTION:5,
  HIGH_VALUE_COLLECTION:10, highValueThreshold:100000, ... }
```
Points are computed at completion from the rule in force *then* and stored on
the task, so a later change to the table does not rewrite history. Daily
totals roll into `col_employee_activity`.

## Automation rules

Stored in `collections.automationRules` as a list; each rule has `id, name,
enabled, trigger, conditions, action, params`. Evaluated on events (import
applied, payment confirmed, promise due) and by an hourly tick. Defaults
shipped, all editable:

| Rule | Trigger | Condition | Action |
|---|---|---|---|
| Stale high balance | tick | total ≥ X and no follow-up for N days | task FOLLOW_UP, HIGH |
| Promise due today | tick | promise PENDING, date = today | task PROMISE_FOLLOW_UP, MEDIUM |
| Promise broken | tick | promise PENDING, date < today | promise → BROKEN; task PROMISE_FOLLOW_UP, HIGH |
| Cleared | event CLEARED | — | cancel open collection tasks for the dealer; notify salesman |
| New after clearance | event REOPENED | — | cycle already opened by the engine; task CALL, MEDIUM |
| Long overdue | tick | ageDays > D and no payment for N days | task ESCALATION assigned to salesman's approver |

Actions are idempotent per `(ruleId, dealerId, cycleId, day)` so a rule never
creates the same task twice. Every automation action writes a TASK_CREATED
event with `source:'automation'` and `ruleId`.

## Notifications

`col_notifications` rows per user for: task assigned, promise broken on my
dealer, payment confirmed on my dealer, import applied (admins). Surfaced as a
bell count in the module shell; read state per user.
