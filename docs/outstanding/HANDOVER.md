# Handover — Outstanding + Collection CRM

_Written 13 Sep 2026. Nothing is committed; everything is in the working tree._

## What was built
A new module, `server/collections/` + `client/src/collections/`, mounted at
`/api/collections` and shown as the **Collections** nav group. The old
Outstanding page, its routes and its collections are untouched and still
work. The design is in the other files of this folder; the short version:

- Excel is an input. Every upload is kept as an import with its rows; the
  current figure per dealer lives in `col_balances`, every statement in
  `col_snapshots`, every change in `col_events`. Nothing is overwritten.
- A decrease in the statement is not a payment. Payments are recorded and
  confirmed here; confirming moves the balance, bouncing moves it back.
- One open cycle per dealer; cleared is permanent; money again opens cycle 2.
- Follow-ups, promises, tasks with points, an hourly automation sweep, the
  employee review matrix, WhatsApp Cloud API (needs the four `WA_*` env
  values), reports as tables or Excel, settings editable in the app.
- The server decides scope and permissions on every request; the UI only
  hides buttons.

## Live cutover — done 13 Sep 2026
1. Legacy `outstandings` (1,583), `outstandingfollowups` (285),
   `outstandingbatches` (1), `outstandinghistories` (0) exported to
   `~/Downloads/legacy-outstanding-backup-2026-09-13/*.json`.
2. M1 (8 codes bound), M2 (1,376 balances, 775 open cycles,
   Σ ₹9,19,96,968), M3 (285 follow-ups, 275 promises) applied to live;
   `verify.mjs` all OK.
3. Features: `outstanding` (legacy page) off; `collections` on.
4. `client/src/api.js`: `getOutstanding`, `getFollowups`, `updateFollowup`
   now read `/api/collections/compat/*` — the Dealer modal, Reports, Sales
   by Category and the legacy Follow-ups hub keep working from `col_*`.
5. The four legacy collections were dropped (counts checked against the
   backup files first). To restore them: `mongoimport --jsonArray` each file.

Still to do on the server: `npm ci` (exceljs) and a restart after you push.
First ERP upload: **Import statements** → the party-wise file; ~363
parties will need mapping or "add as new" once, then codes bind.

## To revert
Tracked files: `git checkout -- <file>` for `server/index.js`,
`server/routes/auth.js`, `server/routes/dealers.js`, `server/models/Dealer.js`,
`server/lib/actionPermissions.js`, `server/lib/featureFlags.js`,
`client/src/App.jsx`, `client/src/api.js`, `client/src/constants.js`.
New folders to delete: `server/collections/`, `client/src/collections/`,
`docs/outstanding/`. Copies of the originals are also in the session
scratchpad under `backup-collections/`.

## Known limits, stated plainly
- Ageing and the ageing chart need a month-wise (bucket) statement; the
  migrated sheet carried running balances, so ageing is empty until the
  first ERP upload.
- Invoice-level data has a model and allocation, but no import path yet
  (the party-wise file has no bills). A ledger export would feed it.
- Passwords in `users` are compared in plain text (pre-existing; noted in
  `security.md`, not changed).
- Follow-up edit window and review weights are settings; the review
  metrics are documented in `employee-review.md` and are a first cut.
