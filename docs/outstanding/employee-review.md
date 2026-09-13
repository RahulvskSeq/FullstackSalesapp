# Employee activity and review matrix

## Activity

`col_employee_activity` is a per-employee-per-day rollup recomputed from the
event tables by the nightly tick (and on demand). It is derived data and can
always be rebuilt.

## Review matrix

Metrics, each 0–100, computed per employee per period (month):

| Key | How it is measured |
|---|---|
| followupDiscipline | % of scheduled follow-ups recorded on or before their date |
| taskCompletion | % of tasks due in the period completed by due date |
| onTimeUpdates | % of follow-ups recorded the same day as their `date` |
| dealerVisits | visits recorded ÷ visit target (settings) |
| promiseFollowUp | % of broken promises with a follow-up within 2 working days |
| dataAccuracy | 100 − % of records edited/cancelled after creation |
| customerManagement | % of assigned dealers with ≥1 contact in the period |
| communicationQuality | manager-rated 0–100 |
| systemUsage | days with any activity ÷ working days |
| taskPoints | points ÷ team median points, capped at 100 |
| collectionActivity | confirmed collections ÷ opening outstanding of assigned dealers |
| managerReview | manager-rated 0–100 |

Weights live in `collections.reviewWeights` (percentages summing to 100;
validated on save). `score = Σ metric × weight / 100`. Each review stores the
weights in force when it was generated, so re-weighting later does not change
past reviews. Manager-rated metrics are entered on the review screen; the
rest are computed and shown with their inputs so they can be checked.
