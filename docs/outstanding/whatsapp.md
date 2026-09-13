# WhatsApp (Meta Cloud API)

Official WhatsApp Business Platform only. No web automation, no unofficial
clients. The adapter is one file (`integrations/whatsapp/metaCloud.js`) behind
an interface (`send(template, to, variables)`, `verifyWebhook`,
`parseWebhook`), so a BSP could replace it.

## Configuration (environment variables)

`WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_VERIFY_TOKEN`, `WA_APP_SECRET`,
`WA_API_VERSION` (default v20.0). Missing config → the feature reports
"not configured" and queues nothing.

## Templates

Registry in `col_whatsapp_templates` mirroring templates approved in the Meta
Business Manager: `key`, `metaName`, `language`, `body` (for preview),
`variables` in order. Variables available:
`{{dealer_name}} {{outstanding_amount}} {{promise_amount}} {{promise_date}}
{{salesman_name}} {{company_name}} {{payment_amount}} {{payment_date}}
{{oldest_bill_days}}`. Templates are managed in Settings; the body shown in
the app is a preview — the message that goes out is the approved Meta
template with the variables substituted.

## Sending

Outbox pattern: a send creates a `col_whatsapp_messages` row QUEUED; the job
runner posts it; the row moves to SENT with `providerMessageId`. Webhook
(`POST /api/collections/whatsapp/webhook`, signature verified with the app
secret) advances it to DELIVERED / READ / FAILED and stores the raw event.
Rate: the runner respects a configurable per-minute cap.

## Compliance

- `dealers.whatsappOptOut` — no template is ever queued to an opted-out number; the UI says so.
- Inbound "STOP" / "UNSUBSCRIBE" via webhook sets the opt-out and audits it.
- Only templated messages are sent (Meta requires templates outside the 24-hour window).
- Every send is audited with the template and variables used.
