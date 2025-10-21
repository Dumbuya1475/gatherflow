
'use server';
import { createClient, type AllFinancialAccount, type CreateFinancialAccount } from 'monime-package';

interface MonimeCheckoutParams {
  metadata: Record<string, any>;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface MonimeCheckoutResponse {
  id: string;
  url: string;
}

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const client = createClient({
    monimeSpaceId: process.env.MONIME_SPACE_ID!,
    accessToken: process.env.MONIME_API_KEY!,
  });

  try {
    // Find or create the main financial account
    let financialAccountId: string;
    const accountName = "GatherFlow Main Account";

    const accountsResponse = await client.financialAccount.getAll();
    if (!accountsResponse.success) {
      throw new Error(`Failed to get financial accounts: ${accountsResponse.error?.message}`);
    }

    const existingAccount = accountsResponse.data?.result.find(acc => acc.name === accountName);

    if (existingAccount) {
      financialAccountId = existingAccount.id;
    } else {
      const newAccountResponse = await client.financialAccount.create(accountName);
      if (!newAccountResponse.success) {
        throw new Error(`Failed to create financial account: ${newAccountResponse.error?.message}`);
      }
      financialAccountId = newAccountResponse.data!.result.id;
    }

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
      financialAccountId // Pass the financial account ID
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
  const client = createClient({
    monimeSpaceId: process.env.MONIME_SPACE_ID!,
    accessToken: process.env.MONIME_API_KEY!,
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
