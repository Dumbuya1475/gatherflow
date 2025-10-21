
import { OpenAPI, PayoutService, ApiError } from '@@/lib/monime-client';
import crypto from 'crypto';

// Use MONIME_SECRET_KEY as the authentication token and allow configurable base URL.
// The sandbox and production environments seem to use the same base URL.
// The API key (test vs. live) determines the environment.
OpenAPI.BASE = process.env.MONIME_API_BASE_URL || 'https://api.monime.io';
OpenAPI.TOKEN = process.env.MONIME_SECRET_KEY;

interface MonimeCheckoutParams {
  metadata: Record<string, any>;
  name: string;
  lineItems: any;
}

interface MonimeCheckoutResponse {
  id: string;
  url: string;
}

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  try {
    const token = process.env.MONIME_API_KEY!;
    const spaceId = process.env.MONIME_SPACE_ID!;
    const idempotencyKey = crypto.randomUUID();

    const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/events/${params.metadata.event_id}/register/success?ticketId=${params.metadata.ticket_id}`;
    const cancelUrl = `${appUrl}/events/${params.metadata.event_id}/register?payment_cancelled=true`;
    
    const response = await fetch('https://api.monime.io/v1/checkout-sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Monime-Space-Id': spaceId,
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            name: params.name, 
            successUrl, 
            cancelUrl, 
            lineItems: params.lineItems, 
            metadata: params.metadata 
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Monime API Error Details:", JSON.stringify(data, null, 2));
        const errorMessage = data?.error?.message || 'Failed to create checkout session.';
        throw new Error(`Monime API error: ${errorMessage}`);
    }

    if (data.result) {
      return {
        id: data.result.id!,
        url: data.result.redirectUrl!,
      };
    } else {
      throw new Error('Failed to create Monime checkout session: Invalid response structure.');
    }
  } catch (error) {
    console.error("Monime API Error Details:", JSON.stringify(error, null, 2));
    if (error instanceof ApiError) {
      // Log the full error for better debugging, then throw a cleaner message.
      const errorMessage = error.body?.message || error.body?.error?.message || 'Unknown error from Monime API.';
      throw new Error(`Monime API error: ${errorMessage}`);
    }
    // Re-throw other errors, including the ones we create
    throw error;
  }
}

interface MonimePayoutParams {
  amount: number;
  currency: string;
  recipientPhone: string;
  metadata: Record<string, any>;
}

export async function createMonimePayout(
  params: MonimePayoutParams
): Promise<{ id: string }> {
  try {
    const idempotencyKey = crypto.randomUUID();
    const response = await PayoutService.createPayout(
      idempotencyKey,
      process.env.MONIME_SPACE_ID!,
      null,
      {
        amount: {
          currency: params.currency,
          value: Math.round(params.amount * 100),
        },
        destination: {
          type: 'momo',
          providerId: 'm17', // Assuming Orange Money SL, this might need to be dynamic
          phoneNumber: params.recipientPhone,
        },
        metadata: params.metadata,
      }
    );

    if (response.result) {
      return {
        id: response.result.id!,
      };
    } else {
      throw new Error('Failed to create Monime payout');
    }
  } catch (error) {
    console.error("Monime Payout Error Details:", JSON.stringify(error, null, 2));
    if (error instanceof ApiError) {
      const errorMessage = error.body?.message || error.body?.error?.message || 'Unknown error from Monime API during payout.';
      throw new Error(`Monime payout error: ${errorMessage}`);
    }
    throw error;
  }
}
