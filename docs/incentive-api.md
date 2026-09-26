# Billing-incentive read API

Read-only. For showing the billing incentive in another system. Same numbers as the
Incentive page (same roster, lookback months, bands and deduction), because it calls the
same scoring code.

## Auth

Header `X-API-Key: <key>` (or `?key=<key>` in the URL). The key is `INCENTIVE_API_KEY`
in the server `.env`. No login. Nothing here writes.

Base URL: `https://sequence.salestracker.in/api/external/incentive`

## Endpoints

| Call | Returns |
|---|---|
| `GET /months` | `{ months: ["2026-09", "2026-08", …] }` newest first |
| `GET /` | latest month, everyone |
| `GET /?month=2026-09` | that month, everyone |
| `GET /?month=2026-09&person=Sahana` | one person; name, display name or code (`SSL 81`) — case-insensitive |
| `GET /?from=2026-09-01&to=2026-09-10` | units billed in that window, scored against the target of the month `to` falls in |

## Response

```json
{
  "month": "2026-09",
  "range": null,
  "source": "upload",
  "rates": { "low": 0.5, "high": 1, "deductionPct": 0.3, "pointsPerRupee": 4 },
  "lookbackMonths": ["2026-06", "2026-07", "2026-08"],
  "totals": { "people": 7, "units": 11759, "grossAmount": 5879.5, "deduction": 1763.85, "amount": 4115.65, "grossPoints": 23518, "points": 16462 },
  "people": [
    {
      "name": "Sahana V Naik", "code": "SSL 81", "key": "Sahana",
      "units": 2976, "lines": 255, "invoices": 255,
      "average": 6236, "averageSource": "history", "monthsOfHistory": 3,
      "target": 6860, "topThreshold": 7360, "band": "base",
      "calculation": "2,976 × ₹0.50",
      "grossAmount": 1488, "deduction": 446.4, "deductionPct": 0.3, "amount": 1041.6,
      "grossPoints": 5952, "points": 4166,
      "unitsToNextBand": null
    }
  ],
  "generatedAt": "2026-09-16T06:32:25.291Z"
}
```

- `amount` / `points` are net — what is paid. `grossAmount` and `deduction` are alongside.
- `band`: `base` (up to target, low rate), `mid` (above target, excess at high rate), `top` (above top threshold, every unit at high rate).
- `averageSource`: `history` (from the lookback months), `opening` (manually set opening average), `none` (no history — paid at the top rate; check before relying on it).
- `source`: `upload` when the month came from an uploaded sheet, `erp` when from invoice lines.
- `range` is filled only for `from`/`to` calls: `{ from, to, daysWithData, missingMonths }`.

## Errors

| Code | Meaning |
|---|---|
| 401 | missing or wrong key |
| 404 | no figures for that month, or no such person (the reply lists valid people) |
| 503 | `INCENTIVE_API_KEY` not set on the server |

## Example

```bash
curl -H "X-API-Key: YOUR_KEY" "https://sequence.salestracker.in/api/external/incentive?month=2026-09"
```

---

# Salesman-incentive read API

The laminate scheme (Sales Incentive page). Same key, same style, separate base URL.

Base URL: `https://sequence.salestracker.in/api/external/sales-incentive`
Auth: header `X-API-Key: <key>` (or `?key=<key>`), the same `INCENTIVE_API_KEY`.

## Endpoints

| Call | Returns |
|---|---|
| `GET /months` | `{ months: ["2026-09", …] }` newest first |
| `GET /` | latest month, every salesman in the scheme |
| `GET /?month=2026-09` | that month |
| `GET /?month=2026-09&person=rakesh` | one salesman — user id, name, or employee code (`SSL 12`), case-insensitive |
| `GET /?from=2026-09-01&to=2026-09-10` | invoice lines in that window, scored against the month's targets |

Only active salesmen with a laminate basic target for the month are listed (the same list as the dashboard).

## Response

```json
{
  "month": "2026-09",
  "range": null,
  "source": "erp-lines",
  "scheme": { "gateCategory": "LAMINATE", "gateAll": true, "retroBase": 25, "retroStep": 5, "retroCap": 40, "projectCredit": 0.5, "badDebtClawback": 0.25, "deductionPct": 0.3, "pointsPerRupee": 4, "holdDays": 90, "salaryDay": 7, "...": "…" },
  "payout": { "status": "open", "monthEnd": "2026-09-30", "holdEnd": "2026-12-29", "payDate": "2027-01-07", "payMonth": "2027-01" },
  "totals": { "people": 9, "gateOpen": 0, "laminateSheets": 8691, "earned": 0, "badDebtRecovered": 0, "deduction": 0, "amount": 0, "grossPoints": 0, "points": 0, "paid": 0, "projectApprovalsPending": 6 },
  "people": [
    {
      "salesmanId": "rakesh", "empCode": "SSL 12", "name": "Rakesh Boriwal",
      "basic": 4500,
      "laminate": { "sold": 2579, "project": 54, "late": 0, "credited": 2552, "gateOpen": false, "shortfall": 1948, "excess": 0, "rate": 0, "mode": "gate-closed", "amount": 0 },
      "products": [ { "key": "rolls", "label": "Rolls", "category": "ROLLS", "target": 20, "targetSource": "rule", "actual": 3, "late": 0, "excess": 0, "rate": 100, "amount": 0 } ],
      "display": { "value": 0, "amount": 0 },
      "earned": 0,
      "badDebt": { "outstanding": 0, "recovered": 0, "carriedForward": 0 },
      "deductionPct": 0.3, "deduction": 0,
      "amount": 0, "grossPoints": 0, "points": 0,
      "projectApproval": "pending",
      "atRiskUnits": 4949, "excludedUnits": 20, "returnedUnits": 0,
      "payout": { "status": "open", "monthEnd": "2026-09-30", "holdEnd": "2026-12-29", "payDate": "2027-01-07", "payMonth": "2027-01", "paidAt": null, "paidBy": "" }
    }
  ],
  "generatedAt": "2026-09-19T06:40:00.000Z"
}
```

- `empCode` is the HR employee code set on the user (Admin → Users). Blank when none is set.
- `amount` / `points` are net — what is paid. `earned` is before bad-debt recovery and the deduction.
- `laminate.credited` = sold − late − half of project sheets; the gate and the slabs use this figure.
- `laminate.mode`: `gate-closed` (basic not crossed), `starter` (bands), `retroactive` (one rate on the whole excess).
- `projectApproval`: `pending` (project sheets found, payout awaits management approval), `approved`, `not-needed`.
- `atRiskUnits`: units on dealers whose outstanding for this month is still open. Forfeited at `payout.holdEnd` if not cleared; 0 once the check is final.
- `payout.status`: `open` (month running), `held` (closed, waiting the hold), `payable` (hold over, pays on `payDate`), `paid` (marked paid, figures frozen).
- `source`: `erp-lines` (invoice lines — project sales and exclusions detected) or `rollup` (monthly totals only — late payment still checked).

## Errors

| Code | Meaning |
|---|---|
| 401 | missing or wrong key |
| 404 | no figures for that month, or no such salesman (the reply lists valid ones) |
| 503 | `INCENTIVE_API_KEY` not set on the server |

## Example

```bash
curl -H "X-API-Key: YOUR_KEY" "https://sequence.salestracker.in/api/external/sales-incentive?month=2026-09&person=rakesh"
```
