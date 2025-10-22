# Monime Test Mode Implementation Guide

## Problem Statement

Monime's API **does not support test mode for checkout sessions**. When using a test API key (`mon_test_...`), the `/v1/checkout-sessions` endpoint returns a `403 Forbidden` error with the message:

```
"Test mode is not supported for this endpoint: '/v1/checkout-sessions'. 
Please check your request path or consult the API documentation."
```

This makes it impossible to test the payment flow without processing real transactions.

## Solution: Test Mode Bypass

We implemented a bypass mechanism that detects test API keys and mocks the checkout flow for development/testing purposes.

---

## Implementation Steps

### 1. Detect Test Mode

Check if the API key starts with `mon_test_`:

```typescript
const isTestMode = process.env.MONIME_SECRET_KEY?.startsWith('mon_test_');
// or
const isTestMode = process.env.MONIME_ACCESS_TOKEN?.startsWith('mon_test_');
```

### 2. Mock Checkout Response

When in test mode, instead of calling the Monime API, return a mock response:

```typescript
export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const { name, lineItems, successUrl, cancelUrl, metadata } = params;
  const item = lineItems[0];
  
  // Check if we're in test mode
  const isTestMode = process.env.MONIME_SECRET_KEY?.startsWith('mon_test_');
  
  if (isTestMode) {
    console.log('🧪 Test Mode: Bypassing Monime API, using mock checkout');
    
    // Generate a mock checkout ID
    const mockCheckoutId = `test_checkout_${Date.now()}`;
    
    // Return mock response with success URL
    return {
      id: mockCheckoutId,
      url: successUrl.replace('{CHECKOUT_SESSION_ID}', mockCheckoutId)
    };
  }
  
  // Production code: Make real API call
  const response = await monime.checkoutSession.create(
    name,
    item.price.value,
    item.quantity,
    successUrl,
    cancelUrl,
    item.name
  );

  if (response.success && response.data?.result) {
    return {
      id: response.data.result.id,
      url: response.data.result.redirectUrl,
    };
  } else {
    throw new Error(
      `Failed to create Monime checkout session: ${response.error?.message || "Unknown error"}`
    );
  }
}
```

### 3. Flow Comparison

#### Test Mode Flow (with bypass):
```
User clicks "Buy Ticket"
    ↓
Create unpaid ticket in database
    ↓
Detect test API key
    ↓
Generate mock checkout ID
    ↓
Redirect directly to success URL (skip payment page)
    ↓
User sees success page
```

#### Production Flow (with live API):
```
User clicks "Buy Ticket"
    ↓
Create unpaid ticket in database
    ↓
Call Monime API to create checkout session
    ↓
Redirect to Monime's hosted payment page
    ↓
User completes payment on Monime
    ↓
Monime redirects to success URL
    ↓
Monime sends webhook to mark ticket as approved
    ↓
User receives email with ticket
```

---

## Environment Configuration

### For Development (Test Mode)
```env
# .env
MONIME_SECRET_KEY=mon_test_moz8eNtYW35y45lQpjIff7HLrzfNHf2C1pD4v5CM23EUjzvvnxtQxytHjp6FAmty
MONIME_SPACE_ID=spc-k6J7uzTNXfi1C1N7woU1T7BFRfY
```

### For Production (Live Mode)
```env
# .env.production or Vercel Environment Variables
MONIME_SECRET_KEY=mon_TlCsZ1xtZlhyxvLI8jP4latYFbuOWJp5cTr8Z1VRCun3VhTSBhPZ1rkqJyT9ZvKr
MONIME_SPACE_ID=spc-k6J7uzTNXfi1C1N7woU1T7BFRfY
MONIME_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## Advantages of This Approach

✅ **No real payments during development** - Safe to test without processing actual transactions  
✅ **Fast iteration** - No need to wait for external payment pages  
✅ **Test complete flow** - Can test ticket creation, success pages, and user notifications  
✅ **Automatic switching** - Automatically uses real API when live key is detected  
✅ **No code changes needed** - Just swap environment variables to switch modes  

---

## Limitations

⚠️ **Cannot test payment UI** - You won't see Monime's actual payment page in test mode  
⚠️ **No webhook testing** - Webhooks won't be triggered in test mode (you'd need to manually update ticket status)  
⚠️ **No payment validation** - Test mode skips all payment provider interactions  

---

## Testing Webhooks in Development

Since test mode bypasses the API, you won't receive webhooks. To test webhook handling:

### Option 1: Manually Trigger Webhook
Create a test script to POST to your webhook endpoint:

```typescript
// test-webhook.ts
const payload = {
  event: "checkout_session.completed",
  data: {
    id: "test_checkout_123",
    status: "completed"
  }
};

fetch('http://localhost:3000/api/webhooks/monime', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'monime-signature': 'test_signature'
  },
  body: JSON.stringify(payload)
});
```

### Option 2: Use Live API with Small Amounts
Test with real but minimal payments (e.g., 100 SLL) to verify the complete flow.

### Option 3: Mock Webhook in Test Mode
Add logic to automatically approve tickets when test mode is detected:

```typescript
// After creating checkout in test mode
if (isTestMode) {
  // Automatically approve the ticket
  await supabase
    .from('tickets')
    .update({ 
      status: 'approved',
      qr_token: crypto.randomUUID()
    })
    .eq('id', ticketId);
}
```

---

## Switching to Production

When ready for production:

1. **Generate live API key** from [my.monime.io](https://my.monime.io):
   - Set **Test Mode: OFF**
   - Grant permissions: `checkout_sessions:write`, `payments:read`, etc.
   - Copy the key (starts with `mon_`, not `mon_test_`)

2. **Update environment variables** in Vercel:
   ```
   MONIME_SECRET_KEY=mon_YOUR_LIVE_KEY
   MONIME_SPACE_ID=spc-YOUR_SPACE_ID
   MONIME_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

3. **Configure webhook URL** in Monime dashboard:
   ```
   https://yourdomain.com/api/webhooks/monime
   ```

4. **Deploy and test** with a small real payment

---

## Code Example: Complete Implementation

```typescript
// lib/monime.ts
import { createClient } from "monime-package";

const monime = createClient({
  accessToken: process.env.MONIME_SECRET_KEY!,
  monimeSpaceId: process.env.MONIME_SPACE_ID!,
});

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const { name, lineItems, successUrl, cancelUrl, metadata } = params;
  const item = lineItems[0];
  
  // Detect test mode
  const isTestMode = process.env.MONIME_SECRET_KEY?.startsWith('mon_test_');
  
  if (isTestMode) {
    console.log('🧪 Test Mode: Bypassing Monime API');
    const mockCheckoutId = `test_checkout_${Date.now()}`;
    return {
      id: mockCheckoutId,
      url: successUrl.replace('{CHECKOUT_SESSION_ID}', mockCheckoutId)
    };
  }
  
  // Production: Real API call
  console.log('📡 Production: Creating real Monime checkout');
  const response = await monime.checkoutSession.create(
    name,
    item.price.value,
    item.quantity,
    successUrl,
    cancelUrl,
    item.name
  );

  if (response.success && response.data?.result) {
    return {
      id: response.data.result.id,
      url: response.data.result.redirectUrl,
    };
  } else {
    throw new Error(
      `Monime API error: ${response.error?.message || "Unknown error"}`
    );
  }
}
```

---

## Applying This to Other Projects

When integrating payment providers that don't support test modes:

1. **Check API key format** - Identify test vs live keys (prefix, format, etc.)
2. **Implement detection logic** - Add environment-based checks
3. **Mock responses** - Return fake data that matches production structure
4. **Log clearly** - Use console.log to indicate test mode is active
5. **Document behavior** - Make it clear what's being bypassed
6. **Easy toggle** - Switching should be as simple as changing env vars

---

## Summary

This test mode bypass allows you to:
- Develop locally without real payments
- Test application logic without external dependencies
- Iterate quickly during development
- Seamlessly switch to production with environment variables

The key is detecting the API key type and conditionally bypassing the external API call while maintaining the same interface and response structure.
