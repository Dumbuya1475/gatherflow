
'use server';

import { createClient } from 'monime-package';
import type { Result } from 'monime-package/dist/client';
import type { CreateCheckout, OneCheckout } from 'monime-package/dist/resources/checkout';

interface MonimeCheckoutParams {
  name: string;
  amount: number;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  description?: string;
  financialAccountId?: string;
}

interface MonimeCheckoutResponse {
  id: string;
  url: string;
}

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const accessToken = process.env.MONIME_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MONIME_API_KEY environment variable is not set.');
  }

  const client = createClient({
    monimeSpaceId: process.env.MONIME_SPACE_ID!,
    accessToken: accessToken,
  });

  try {
    const checkout: Result<CreateCheckout> = await client.checkoutSession.create(
      params.name,
      params.amount,
      params.quantity,
      params.successUrl,
      params.cancelUrl,
      params.description,
      params.financialAccountId
    );

    if (checkout.success && checkout.data?.result.redirectUrl) {
      return {
        id: checkout.data.result.id!,
        url: checkout.data.result.redirectUrl!,
      };
    } else {
      const errorMessage = checkout.error?.message || 'Failed to create Monime checkout session using SDK.';
      console.error("Monime SDK Error:", checkout.error);
      throw new Error(errorMessage);
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
  const accessToken = process.env.MONIME_ACCESS_TOKEN;
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
