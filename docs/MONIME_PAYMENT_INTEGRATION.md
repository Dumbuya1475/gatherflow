# Monime Payment Integration Guide

Complete guide for integrating Monime payments in Next.js applications.

## Table of Contents
- [Overview](#overview)
- [Key Differences from Other Payment Providers](#key-differences)
- [Setup](#setup)
- [Implementation](#implementation)
- [Common Issues & Solutions](#common-issues--solutions)
- [Testing](#testing)

---

## Overview

Monime is a payment provider for Sierra Leone (SLE currency) that handles mobile money payments. This guide documents the integration patterns and gotchas discovered during GatherFlow's implementation.

**Official Docs:** https://docs.monime.io

---

## Key Differences from Other Payment Providers

### 🚨 Critical: Monime Uses POST for Success/Cancel URLs

Unlike Stripe, PayPal, and most payment providers that **redirect** users with GET requests, **Monime sends POST requests** to your success and cancel URLs.

**This means:**
- ❌ **DON'T** use page routes like `/checkout/success`
- ✅ **DO** use API routes like `/api/payment/success`
- ✅ **DO** return 303 redirects to convert POST → GET

**Example Flow:**
```
User completes payment on Monime
    ↓
Monime POSTs to: /api/payment/success?orderId=123
    ↓
Your API route processes payment
    ↓
Return: NextResponse.redirect('/success-page', { status: 303 })
    ↓
User's browser redirects to success page (GET request)
```

### Idempotency Keys

Monime uses idempotency keys to prevent duplicate charges. The SDK handles this automatically, but you may encounter **409 Conflict** errors if:
- User tries to pay for the same order twice
- Old checkout sessions aren't cleared

**Solution:** Clear old session IDs before creating new checkouts.

---

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# Monime Credentials
MONIME_ACCESS_TOKEN=mon_test_xxxxxxxxxxxxxxxxxxxxxxxxx
MONIME_SPACE_ID=spc-xxxxxxxxxxxxxxxx
MONIME_WEBHOOK_SECRET=your_webhook_secret_here

# App URL (used for success/cancel URLs)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

**Find your credentials:**
- Access Token: https://dashboard.monime.io → Developer → Personal Access Tokens
- Space ID: https://dashboard.monime.io → Developer → Spaces
- Webhook Secret: Configure webhook endpoint in dashboard

### 2. Install Monime Package

```bash
npm install monime-package
```

### 3. Create Monime Client

Create `lib/monime.ts`:

```typescript
import { createClient } from "monime-package";

const monime = createClient({
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
  monimeSpaceId: process.env.MONIME_SPACE_ID!,
});

export async function createMonimeCheckout(params: {
  name: string;
  lineItems: Array<{
    name: string;
    price: { currency: string; value: number }; // value in cents
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, any>;
}) {
  const { name, lineItems, successUrl, cancelUrl, metadata } = params;
  const item = lineItems[0];

  const response = await monime.checkoutSession.create(
    name,
    item.price.value, // Amount in cents (e.g., 2000 = 20.00 SLE)
    item.quantity,
    successUrl,
    cancelUrl,
    item.name, // description
    metadata.financialAccountId, // optional
    undefined, // primaryColor
    undefined  // images
  );

  if (response.success && response.data?.result) {
    return {
      id: response.data.result.id,
      url: response.data.result.redirectUrl,
    };
  } else {
    throw new Error(
      `Failed to create checkout: ${response.error?.message || "Unknown error"}`
    );
  }
}
```

---

## Implementation

### Step 1: Create Checkout Endpoint

Create `app/api/checkout/create-session/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createMonimeCheckout } from '@/lib/monime';

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, eventTitle } = await req.json();
    
    // Build success/cancel URLs (MUST be API routes, not pages!)
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/api/payment/success?orderId=${orderId}`;
    const cancelUrl = `${appUrl}/api/payment/cancel?orderId=${orderId}`;

    // Create checkout session
    const checkoutSession = await createMonimeCheckout({
      name: `Order ${orderId}`,
      lineItems: [
        {
          name: eventTitle,
          price: {
            currency: 'SLE',
            value: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      successUrl,
      cancelUrl,
      metadata: {
        orderId: orderId.toString(),
      }
    });
    
    // Store checkout session ID for later verification
    // await db.orders.update(orderId, { 
    //   checkoutSessionId: checkoutSession.id 
    // });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
```

### Step 2: Handle Success Callback

Create `app/api/payment/success/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 🚨 IMPORTANT: This must be a POST handler, not GET!
export async function POST(req: NextRequest) {
  try {
    // Extract order ID from URL params
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    console.log('Payment success callback:', orderId);
    
    if (!orderId) {
      return NextResponse.redirect(new URL('/orders', req.url), { status: 303 });
    }

    // Update order status in your database
    // await db.orders.update(orderId, { 
    //   status: 'paid',
    //   paidAt: new Date()
    // });

    // Perform any post-payment actions
    // - Send confirmation email
    // - Generate QR codes
    // - Create invoices
    // - etc.

    // 🚨 IMPORTANT: Use 303 redirect to convert POST → GET
    const successPageUrl = new URL(`/orders/${orderId}/success`, req.url);
    return NextResponse.redirect(successPageUrl, { status: 303 });
    
  } catch (error) {
    console.error('Payment success handler error:', error);
    return NextResponse.redirect(new URL('/orders', req.url), { status: 303 });
  }
}
```

### Step 3: Handle Cancel Callback

Create `app/api/payment/cancel/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// 🚨 IMPORTANT: This must be a POST handler, not GET!
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    console.log('Payment cancelled:', orderId);
    
    if (orderId) {
      // Update order status
      // await db.orders.update(orderId, { 
      //   status: 'cancelled',
      //   cancelledAt: new Date()
      // });
    }

    // Redirect back to checkout/order page
    const cancelPageUrl = orderId 
      ? new URL(`/orders/${orderId}?payment_cancelled=true`, req.url)
      : new URL('/orders', req.url);
    
    return NextResponse.redirect(cancelPageUrl, { status: 303 });
    
  } catch (error) {
    console.error('Payment cancel handler error:', error);
    return NextResponse.redirect(new URL('/orders', req.url), { status: 303 });
  }
}
```

### Step 4: Setup Webhooks (Recommended)

Create `app/api/webhooks/monime/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Verify webhook signature
async function verifySignature(req: NextRequest): Promise<boolean> {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  if (!secret) return false;

  const signature = req.headers.get('monime-signature');
  if (!signature) return false;

  const bodyText = await req.text();
  
  // Parse timestamped signature: "t=TIMESTAMP,v1=SIGNATURE"
  const parts = signature.split(',');
  let timestamp = '';
  let receivedSig = '';
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') receivedSig = value;
  }

  if (!timestamp || !receivedSig) return false;

  // Verify timestamp (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const skew = Math.abs(now - parseInt(timestamp));
  if (skew > 300) return false; // 5 minutes

  // Verify signature
  const payload = `${timestamp}.${bodyText}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSig = hmac.digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(receivedSig)
  );
}

export async function POST(req: NextRequest) {
  // Verify signature (recommended)
  // const isValid = await verifySignature(req);
  // if (!isValid) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  // }

  const bodyText = await req.text();
  const event = JSON.parse(bodyText);

  console.log('Webhook event:', event.event);

  switch (event.event) {
    case 'checkout_session.completed': {
      const session = event.data;
      console.log('Payment completed:', session.id);
      
      // Update your database
      // const orderId = session.metadata?.orderId;
      // await db.orders.update(orderId, { status: 'paid' });
      
      return NextResponse.json({ received: true });
    }

    case 'checkout_session.expired': {
      const session = event.data;
      console.log('Checkout expired:', session.id);
      
      // Mark as expired
      // await db.orders.update(orderId, { status: 'expired' });
      
      return NextResponse.json({ received: true });
    }

    case 'checkout_session.cancelled': {
      const session = event.data;
      console.log('Checkout cancelled:', session.id);
      
      // Mark as cancelled
      // await db.orders.update(orderId, { status: 'cancelled' });
      
      return NextResponse.json({ received: true });
    }

    default:
      console.log('Unhandled event:', event.event);
      return NextResponse.json({ received: true });
  }
}
```

### Step 5: Client-Side Integration

```typescript
async function handleCheckout() {
  try {
    const response = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order_123',
        amount: 25.00, // SLE
        eventTitle: 'My Event',
      }),
    });

    if (!response.ok) {
      throw new Error('Checkout failed');
    }

    const { checkoutUrl } = await response.json();
    
    // Redirect to Monime checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to start checkout');
  }
}
```

---

## Common Issues & Solutions

### 1. 405 Method Not Allowed

**Problem:** Monime POSTs to your success/cancel URLs but you're using page routes.

**Solution:**
```typescript
// ❌ DON'T: app/checkout/success/page.tsx
export default function SuccessPage() { ... }

// ✅ DO: app/api/payment/success/route.ts
export async function POST(req: NextRequest) { ... }
```

### 2. 409 Conflict Error

**Problem:** Trying to create a checkout with the same data/session.

**Solution:** Clear old checkout session IDs before creating new ones:
```typescript
// Clear old session before creating new checkout
await db.orders.update(orderId, { checkoutSessionId: null });
```

### 3. User Stuck on "Redirecting..." Screen

**Problem:** Your API route isn't returning a proper redirect.

**Solution:** Always use 303 redirects:
```typescript
return NextResponse.redirect(successUrl, { status: 303 });
```

### 4. Webhook Signature Verification Fails

**Problem:** Unclear signature format from Monime.

**Temporary Solution:** Log signatures and contact Monime support:
```typescript
console.log('Received signature:', signature);
console.log('Expected signature:', expectedSig);
// Temporarily bypass verification for testing
```

### 5. Amount in Wrong Format

**Problem:** Sending amount as 25.00 instead of 2500.

**Solution:** Always convert to cents:
```typescript
const amountInCents = Math.round(price * 100);
```

---

## Testing

### Test Mode

Monime provides test credentials with prefix `mon_test_`:
- Use test access token for development
- Test payments won't charge real money
- Test webhooks work the same as production

### Testing Checklist

- [ ] Create checkout session
- [ ] Complete payment on Monime
- [ ] Verify POST to success URL works
- [ ] Verify redirect to success page
- [ ] Test cancel flow
- [ ] Test webhook events
- [ ] Test idempotency (pay twice)
- [ ] Test expired sessions
- [ ] Verify webhook signatures

### Local Testing with ngrok

To test webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# Expose localhost to internet
ngrok http 3000

# Use ngrok URL in Monime dashboard
# Webhook URL: https://abc123.ngrok.io/api/webhooks/monime
```

---

## Production Checklist

Before going live:

- [ ] Use production access token (`mon_live_...`)
- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Configure webhook URL in Monime dashboard
- [ ] Enable webhook signature verification
- [ ] Test complete payment flow end-to-end
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Add logging for debugging
- [ ] Test edge cases (expired sessions, cancelled payments)
- [ ] Verify email notifications work
- [ ] Test mobile responsiveness on Monime checkout

---

## Key Takeaways

1. **Monime POSTs to success/cancel URLs** - Use API routes, not pages
2. **Always use 303 redirects** - Converts POST → GET for browser navigation
3. **Clear old sessions** - Prevents 409 idempotency conflicts
4. **Amount in cents** - Math.round(price * 100)
5. **Webhooks are authoritative** - Don't rely solely on success callback
6. **Log everything** - Makes debugging much easier
7. **Test thoroughly** - Payment bugs are costly

---

## Support

- **Monime Docs:** https://docs.monime.io
- **Monime Dashboard:** https://dashboard.monime.io
- **Monime Support:** support@monime.io

---

## Example Implementation

See GatherFlow's complete implementation:
- `app/api/checkout/create-session/route.ts` - Checkout creation
- `app/api/payment/success/route.ts` - Success handler
- `app/api/payment/cancel/route.ts` - Cancel handler
- `app/api/webhooks/monime/route.ts` - Webhook handler
- `lib/monime.ts` - Monime client wrapper

---

*Last updated: October 24, 2025*
*Based on GatherFlow's production integration*
