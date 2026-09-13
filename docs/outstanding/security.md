# Security

## Reused as-is

JWT bearer auth (`protect`), role checks (`adminOnly`, `superAdminOnly`),
per-user `permissions` scoping, feature flags (`requireFeature`). No change to
login, users or roles.

## Enforced server-side in this module

- **Scope on every read and write.** `lib/scope.js` resolves the caller's dealer set once per request using the same rules as `routes/dealers.js`; every query filters by it. A salesman cannot read, follow up, or record a payment on a dealer outside their book, whatever the UI shows.
- **Feature keys** (added to `lib/actionPermissions.js`): `collections.import`, `collections.payments` (record/confirm), `collections.settings`, `collections.whatsapp`, `collections.reviews`. Role defaults: superadmin/admin all; employee needs explicit keys for payments/settings; salesman none of these.
- **Input validation** on every route (types, ranges, enums, string lengths, date shapes) before any service call; unknown fields dropped.
- **Uploads**: 15 MB cap, extension and MIME allow-list, parsed in memory, never written to disk; parse errors return 400 with a message, never a stack.
- **Rate limiting** (per user per minute) on import, payment and WhatsApp routes via a small in-memory limiter (no new dependency).
- **Webhook signature** verification (HMAC-SHA256 with `WA_APP_SECRET`) before any WhatsApp event is processed.
- **Secrets** only from environment; none in code or settings documents.
- **Errors** return a message and a request id; stacks go to the server log only.
- **Audit** of every state-changing action with before/after (`col_audit`).
- **Attachments** stored in their own collection with size and MIME checks; served only to callers in scope.

## Found, flagged, deliberately not changed

- Passwords are stored and compared in plain text (`User.pass`, `routes/auth.js`). `bcryptjs` is already a dependency. Changing this touches login for every user and is outside the instructed scope; it should be the next piece of work. A migration path: hash on next successful login, then require hashes.
- No CSRF protection is needed for bearer-token APIs (no cookie session); noted for completeness.
- HTTPS termination is the deployment's responsibility (nginx per the existing deployment notes).
