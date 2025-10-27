
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
  metadata: Record<string, any>;
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
    throw new Error('MONIME_ACCESS_TOKEN environment variable is not set.');
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
      process.env.MONIME_FINANCIAL_ACCOUNT_ID, // Use dedicated financial account ID
      undefined, // primaryColor
      undefined, // images
      params.metadata
    );

    if (checkout.success && checkout.data?.result.redirectUrl) {
      return {
        id: checkout.data.result.id!,
        url: checkout.data.result.redirectUrl!,
      };
    } else {
      console.error("Monime SDK Error:", checkout.error);
      throw new Error(checkout.error?.message || 'Failed to create Monime checkout session using SDK.');
    }
  } catch (error) {
    console.error("Checkout Error in createMonimeCheckout:", error);
    if (error instanceof Error) {
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
  client: any, // Pass the initialized client
  params: MonimePayoutParams
): Promise<{ id: string }> {
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
