# Monime Webhook Configuration Guide

This guide shows you how to set up webhooks in the Monime dashboard to receive payment notifications for your Gatherflow ticketing platform.

---

## Overview

Webhooks allow Monime to notify your application when payment events occur (e.g., successful payments, cancelled sessions, expired sessions). Your application then processes these notifications to update ticket statuses, send confirmation emails, and more.

---

## Configuration Steps

### 1. Access Monime Dashboard

1. Log in to [my.monime.io](https://my.monime.io)
2. Navigate to **Resources** → **Webhooks**
3. Click **"Create Webhook"**

---

### 2. Basic Webhook Settings

| Field | Value | Description |
|-------|-------|-------------|
| **Name** | `Gatherflow Ticket Payment Listener` | Descriptive name for the webhook |
| **URL** | `https://gatherflow-mocha.vercel.app/api/webhooks/monime` | Your webhook endpoint URL |

> 💡 **Tip**: Update the URL if you deploy to a different domain

---

### 3. Verification Method

**Select:** `Shared Secret (HMAC)`

**Secret:** 
```
whsec_test_1234567890abcdef
```

> ⚠️ **Important**: 
> - For **testing**, use the test secret from your `.env` file
> - For **production**, Monime will generate a real webhook secret
> - After creating the webhook, **copy the generated secret** and update your environment variables

**Why HMAC?**
- ✅ More secure than just checking the source IP
- ✅ Ensures the request actually came from Monime
- ✅ Prevents unauthorized webhook calls
- ✅ Your code automatically verifies the signature

---

### 4. Event Selection

Select the following events to subscribe to:

#### **Essential (Required):**
- ✅ **`checkout_session.completed`** - Customer successfully paid
- ✅ **`checkout_session.expired`** - Payment session timed out
- ✅ **`checkout_session.cancelled`** - Customer cancelled payment

#### **Optional (For Future Features):**
- ⚪ **`payout.completed`** - Payout to organizer succeeded
- ⚪ **`payout.failed`** - Payout to organizer failed

> 💡 **Why these events?**
> - `completed` → Approve ticket, generate QR code, send email
> - `expired` → Clean up unpaid tickets
> - `cancelled` → Mark ticket as cancelled
> - `payout.*` → Track organizer earnings (future feature)

---

### 5. Enable Webhook

**Enable:** ✅ **Checked**

This makes the webhook active immediately upon creation so it can start receiving events.

---

### 6. Custom Headers

**Header name:** *(leave empty)*  
**Header value:** *(leave empty)*

> 💡 **Why skip custom headers?**
> Your webhook already uses HMAC signature verification for security, so custom headers are redundant.

---

### 7. API Release

**Select:** `Latest stable release` (from dropdown)

This ensures your webhook receives payloads in the latest published API version with backward-compatible updates.

---

## Final Configuration Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Webhook Configuration                                        │
├─────────────────────────────────────────────────────────────┤
│ Name:           Gatherflow Ticket Payment Listener          │
│ URL:            https://gatherflow-mocha.vercel.app         │
│                 /api/webhooks/monime                        │
│ Method:         Shared Secret (HMAC)                        │
│ Secret:         whsec_test_1234567890abcdef                 │
│ Events:         ✅ checkout_session.completed               │
│                 ✅ checkout_session.expired                 │
│                 ✅ checkout_session.cancelled               │
│ Enabled:        ✅ Yes                                       │
│ Custom Headers: (none)                                       │
│ API Release:    Latest stable                               │
└─────────────────────────────────────────────────────────────┘
```

---

## After Creating the Webhook

### Step 1: Copy the Webhook Secret

After clicking "Create Webhook", Monime will display the webhook details. **Copy the webhook secret** (it may be different from what you entered).

### Step 2: Update Environment Variables

#### Local Development (.env)
```env
MONIME_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

#### Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add or update:
   ```
   MONIME_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
   ```
4. Select environment: **Production** (and optionally Preview/Development)
5. Click **Save**
6. **Redeploy** your application to apply changes

### Step 3: Test the Webhook

#### Option 1: Real Payment Test
1. Visit your event page: `https://gatherflow-mocha.vercel.app/events/[event-id]`
2. Click "Buy Ticket"
3. Complete payment on Monime's payment page
4. Verify:
   - ✅ Ticket status changed to `approved` in database
   - ✅ QR code generated
   - ✅ Confirmation email sent
   - ✅ Webhook logged in Vercel

#### Option 2: Check Monime Dashboard
1. Go to **Resources** → **Webhooks**
2. Click on your webhook
3. View recent deliveries and responses
4. Check for any failed attempts

#### Option 3: Check Vercel Logs
1. Go to Vercel project dashboard
2. Navigate to **Deployments** → Select latest deployment
3. Click **Functions** → Find `api/webhooks/monime`
4. View logs for webhook requests

---

## What Each Event Does

### `checkout_session.completed`
```typescript
✅ Find ticket by checkout session ID
✅ Update ticket status: unpaid → approved
✅ Generate QR code (qr_token)
✅ Update payment status: paid
✅ Send confirmation email with ticket
✅ Revalidate event pages
```

### `checkout_session.expired`
```typescript
✅ Find unpaid ticket by checkout session ID
✅ Update ticket status: unpaid → expired
✅ Update payment status: expired
✅ Log event for monitoring
```

### `checkout_session.cancelled`
```typescript
✅ Find unpaid ticket by checkout session ID
✅ Update ticket status: unpaid → cancelled
✅ Update payment status: cancelled
✅ Log event for monitoring
```

### `payout.completed` *(Future)*
```typescript
// TODO: Implement organizer payout tracking
- Update payout record in database
- Send notification to organizer
- Update financial reports
```

### `payout.failed` *(Future)*
```typescript
// TODO: Implement payout failure handling
- Mark payout as failed
- Notify organizer
- Implement retry logic
```

---

## Troubleshooting

### Issue: Webhook not receiving events

**Check:**
1. ✅ Webhook is **enabled** in Monime dashboard
2. ✅ URL is correct: `https://gatherflow-mocha.vercel.app/api/webhooks/monime`
3. ✅ Events are selected (checkout_session.completed, etc.)
4. ✅ Application is deployed and accessible
5. ✅ No firewall blocking Monime's IP addresses

**Test:**
```bash
curl -X POST https://gatherflow-mocha.vercel.app/api/webhooks/monime \
  -H "Content-Type: application/json" \
  -H "monime-signature: test" \
  -d '{"event":"checkout_session.completed","data":{"id":"test_123"}}'
```

---

### Issue: Webhook returns 403 Forbidden

**Cause:** Invalid signature verification

**Fix:**
1. Verify `MONIME_WEBHOOK_SECRET` matches the secret in Monime dashboard
2. Check environment variable is deployed to Vercel
3. Redeploy application after updating env vars

**Debug:**
Check Vercel logs for signature verification errors:
```
Webhook received without signature.
Invalid webhook signature.
```

---

### Issue: Ticket not updating after payment

**Check:**
1. ✅ Webhook received (check Monime dashboard delivery status)
2. ✅ Ticket exists in database with correct `monime_checkout_session_id`
3. ✅ Ticket status is `unpaid` (not already processed)
4. ✅ Supabase credentials are correct in environment variables

**Debug:**
Check Vercel function logs for errors:
```
Webhook Error: Ticket not found for checkout session
Webhook Error: Failed to update ticket status
```

---

### Issue: Email not sending

**Check:**
1. ✅ `RESEND_API_KEY` is set in environment variables
2. ✅ `RESEND_FROM_EMAIL` is configured
3. ✅ Email address exists in ticket profile
4. ✅ Resend account is active and verified

**Test Email:**
Visit: `https://gatherflow-mocha.vercel.app/test-email`

---

## Security Best Practices

### 1. Always Verify Signatures
```typescript
// ✅ Good - Your code already does this
const signature = req.headers.get("monime-signature");
const hmac = crypto.createHmac("sha256", secret);
hmac.update(bodyText);
const isValid = digest === signature;
```

### 2. Keep Webhook Secret Secure
- ❌ Never commit secrets to git
- ✅ Use environment variables
- ✅ Different secrets for dev/production
- ✅ Rotate secrets periodically

### 3. Implement Idempotency
```typescript
// ✅ Your code already does this
if (ticket.status === 'approved') {
  return NextResponse.json({ received: true, message: "Already processed" });
}
```

### 4. Handle Errors Gracefully
```typescript
// ✅ Return 200 OK even on errors to prevent retries
return NextResponse.json({ error: "..." }, { status: 500 });
```

---

## Webhook Payload Examples

### checkout_session.completed
```json
{
  "event": "checkout_session.completed",
  "data": {
    "id": "checkout_abc123xyz",
    "status": "completed",
    "amount": 5000,
    "currency": "SLL",
    "metadata": {
      "ticket_id": "ticket_xyz"
    }
  },
  "timestamp": "2025-10-22T12:34:56Z"
}
```

### checkout_session.expired
```json
{
  "event": "checkout_session.expired",
  "data": {
    "id": "checkout_abc123xyz",
    "status": "expired",
    "amount": 5000,
    "currency": "SLL"
  },
  "timestamp": "2025-10-22T13:04:56Z"
}
```

### checkout_session.cancelled
```json
{
  "event": "checkout_session.cancelled",
  "data": {
    "id": "checkout_abc123xyz",
    "status": "cancelled",
    "amount": 5000,
    "currency": "SLL"
  },
  "timestamp": "2025-10-22T12:45:30Z"
}
```

---

## Monitoring Webhooks

### Monime Dashboard
- View delivery history
- Check response status codes
- Retry failed deliveries
- See payload and response

### Vercel Logs
```bash
# View webhook function logs
vercel logs [deployment-url] --filter=/api/webhooks/monime
```

### Database Queries
```sql
-- Check recent ticket status changes
SELECT id, status, monime_payment_status, created_at, updated_at
FROM tickets
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Count tickets by status
SELECT status, COUNT(*) as count
FROM tickets
GROUP BY status;
```

---

## Migration Checklist

When moving from test to production:

- [ ] Generate live API key (starts with `mon_`, not `mon_test_`)
- [ ] Create production webhook in Monime dashboard
- [ ] Copy production webhook secret
- [ ] Update Vercel environment variables:
  - [ ] `MONIME_ACCESS_TOKEN=mon_...`
  - [ ] `MONIME_WEBHOOK_SECRET=whsec_...`
  - [ ] `MONIME_SPACE_ID=spc-...`
- [ ] Redeploy application
- [ ] Test with small payment amount
- [ ] Verify webhook delivery in Monime dashboard
- [ ] Check Vercel logs
- [ ] Confirm ticket approved and email sent
- [ ] Monitor for 24 hours

---

## Additional Resources

- [Monime API Documentation](https://docs.monime.io)
- [Monime Webhook Guide](https://docs.monime.io/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Gatherflow Test Mode Implementation](./MONIME_TEST_MODE_IMPLEMENTATION.md)

---

## Support

If you encounter issues:

1. **Check Monime Dashboard** - View webhook delivery attempts and errors
2. **Check Vercel Logs** - Look for function errors and console output
3. **Contact Monime Support** - [support@monime.io](mailto:support@monime.io)
4. **Review Docs** - [https://docs.monime.io](https://docs.monime.io)

---

*Last Updated: October 22, 2025*
