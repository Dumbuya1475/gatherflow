
import { OpenAPI, CheckoutSessionService, PayoutService, ApiError } from './monime-client';
import crypto from 'crypto';

OpenAPI.BASE = 'https://api.monime.io';
OpenAPI.TOKEN = process.env.MONIME_API_KEY;

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
    const idempotencyKey = crypto.randomUUID();
    const response = await CheckoutSessionService.createCheckoutSession(
      idempotencyKey,
      process.env.MONIME_SPACE_ID!,
      null,
      {
        name: params.name,
        lineItems: params.lineItems,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${params.metadata.event_id}/register/success?ticketId=${params.metadata.ticket_id}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${params.metadata.event_id}/register?payment_cancelled=true`,
        metadata: params.metadata,
      }
    );

    if (response.result) {
      return {
        id: response.result.id!,
        url: response.result.redirectUrl!,
      };
    } else {
      throw new Error('Failed to create Monime checkout session');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Monime API error: ${error.body?.message || 'Unknown error'}`);
    }
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
    if (error instanceof ApiError) {
      throw new Error(`Monime payout error: ${error.body.message || 'Unknown error'}`);
    }
    throw error;
  }
}
