
'use server';
import { createClient } from 'monime-package';
import type { ApiError } from 'monime-package';

interface MonimeCheckoutParams {
  metadata: Record<string, any>;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  financialAccountId: string;
}

interface MonimeCheckoutResponse {
  id: string;
  url: string;
}

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const accessToken = process.env.MONIME_API_KEY;
  if (!accessToken) {
    throw new Error('MONIME_API_KEY environment variable is not set.');
  }

  const client = createClient({
    monimeSpaceId: process.env.MONIME_SPACE_ID!,
    accessToken: accessToken,
  });

  try {

    const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/events/${params.metadata.event_id}/register/success?ticketId=${params.metadata.ticket_id}`;
    const cancelUrl = `${appUrl}/events/${params.metadata.event_id}/register?payment_cancelled=true`;
    
    const checkout = await client.checkoutSession.create(
      params.name,
      params.price, // SDK expects amount in minor units
      params.quantity,
      successUrl,
      cancelUrl,
      params.description,
      params.financialAccountId
    );

    if (checkout.success && checkout.data?.result.redirectUrl) {
      return {
        id: checkout.data.result.id!,
        url: checkout.data.result.redirectUrl!,
      };
    } else {
      console.error("Monime SDK Error:", checkout.error?.message);
      throw new Error(checkout.error?.message || 'Failed to create Monime checkout session using SDK.');
    }
  } catch (error) {
    if (error instanceof Error) {
        console.error("Checkout Error in createMonimeCheckout:", error.message);
        throw new Error(`Monime API error: ${error.message}`);
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
  const accessToken = process.env.MONIME_API_KEY;
  if (!accessToken) {
    throw new Error('MONIME_API_KEY environment variable is not set.');
  }

  const client = createClient({
    monimeSpaceId: process.env.MONIME_SPACE_ID!,
    accessToken: accessToken,
  });

  const payout = await client.payout.create(
      params.amount,
      {
          type: "momo",
          providerId: "m17", // Assuming Orange Money SL
          phoneNumber: params.recipientPhone
      },
      undefined, // sourceFinancialAccountId
      params.metadata
  );

  if (payout.success) {
      return {
          id: payout.data!.result.id!
      };
  } else {
      console.error('Monime Payout Error:', payout.error?.message);
      throw new Error(payout.error?.message || 'Failed to create Monime payout');
  }
}
