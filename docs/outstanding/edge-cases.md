# Edge cases (decided behaviour)

| Situation | Behaviour |
|---|---|
| Party name without a code | match by exact normalised name → alias → manual; never fuzzy |
| Two rows in one file for the same code | flagged `duplicatesInFile`; amounts **not** summed; user picks or fixes the file |
| Code present but name differs from master | matched by code; the new spelling saved to `aliases`; ASSIGNMENT unchanged |
| Code on a row conflicts with a *different* dealer's bound code | row UNMAPPED with reason "code bound to X"; manual resolution |
| Negative amount in a cell | validation error on that row (credit balances are not receivables); row ERROR |
| Blank cell vs 0 | in buckets mode both mean 0 for that bucket; in snapshot mode blank = "not stated" |
| Period header unparseable | file rejected at validation with the header quoted |
| Same asOn uploaded again with different figures | new import supersedes the earlier snapshot for that asOn; both imports on record |
| Import of an older asOn than the latest | accepted as history; does **not** overwrite current state; flagged in preview |
| Statement decrease larger than all recorded payments | DECREASED + RECONCILIATION_DIFFERENCE; nothing invented |
| Payment recorded, then statement still shows old balance | payment stands; negative difference shown; balance = statement total minus unreflected confirmed payments? **No** — balance follows the statement; the unreflected payment is listed on Reconciliation until the next statement absorbs it |
| Payment larger than balance | allowed (advance); `unallocated` > 0; balance floors at 0 |
| Cheque bounces after confirmation | status BOUNCED; balance restored; promise credit reversed; event; task ESCALATION |
| Promise date on a Sunday/holiday | accepted; broken check runs the next working day |
| Dealer reassigned mid-month | balances/tasks/promises/follow-ups `salesmanId` updated by the existing handover hooks (additive); history keeps the old employee on each event |
| Dealer deleted in the master | balances/cycles/events kept, dealer shown as "(removed)"; nothing cascades |
| Import job dies mid-apply | resumed from `appliedChunks`; no chunk half-written |
| Two admins apply the same import | second apply sees status APPLIED and returns it; no double write |
| Unmapped party mapped weeks later | its staged row applies as of the import's asOn; events dated then |
| Salesman records a payment | RECORDED only; not counted until confirmed by accounts |
| Two parties share a name but carry different codes (two branches) | a name match is refused when the dealer already holds a different code; "add as new dealer" creates it as `NAME (CODE)` with the plain name as an alias, because the rest of the application joins on dealer name |
| Two rows in one file resolve to the same dealer with different codes | the second row is UNMAPPED with the reason; a person decides |
