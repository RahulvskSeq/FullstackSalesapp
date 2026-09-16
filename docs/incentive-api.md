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
