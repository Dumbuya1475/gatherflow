
'use server';
import { ApiError } from '@@/lib/monime-client';

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
  monimeClient: any,
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/events/${params.metadata.event_id}/register/success?ticketId=${params.metadata.ticket_id}`;
    const cancelUrl = `${appUrl}/events/${params.metadata.event_id}/register?payment_cancelled=true`;
    
    const checkout = await monimeClient.checkoutSession.create(
      params.name,
      params.lineItems[0].price.value, // The SDK seems to take amount directly
      params.lineItems[0].quantity,
      successUrl,
      cancelUrl,
      params.lineItems[0].name, // Using item name as description
      undefined, // financialAccountId
      undefined, // primaryColor
      [], // images
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
    if (error instanceof ApiError) {
      // Log the full error for better debugging, then throw a cleaner message.
      console.error("Monime API Error Details:", JSON.stringify(error, null, 2));
      const errorMessage = error.body?.message || error.body?.error?.message || 'Unknown error from Monime API.';
      throw new Error(`Monime API error: ${errorMessage}`);
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
  monimeClient: any,
  params: MonimePayoutParams
): Promise<{ id: string }> {
  const payout = await monimeClient.payout.create(
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
