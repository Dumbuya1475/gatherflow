
import { createClient, type DestinationOption } from "monime-package";

// Only log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('Monime Configuration:', {
    hasAccessToken: !!process.env.MONIME_ACCESS_TOKEN,
    hasSpaceId: !!process.env.MONIME_SPACE_ID,
  });
}

export const monime = createClient({
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
  monimeSpaceId: process.env.MONIME_SPACE_ID!,
});

interface MonimeCheckoutParams {
  metadata: { financialAccountId?: string } & Record<string, unknown>;
  name: string;
  lineItems: Array<{ name: string; price: { currency: string; value: number }; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
}

interface MonimeCheckoutResponse {
  id: string;
  url: string;
}

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const { name, lineItems, successUrl, cancelUrl, metadata } = params;

  // Extract the first line item (we assume single ticket purchases for now)
  const item = lineItems[0];

  const response = await monime.checkoutSession.create(
    name,
    item.price.value, // Amount in cents
    item.quantity,
    successUrl,
    cancelUrl,
    item.name, // description
    metadata.financialAccountId, // optional financialAccountId
    undefined, // primaryColor
    undefined  // images
  );

  if (response.success && response.data?.result) {
    return {
      id: response.data.result.id,
      url: response.data.result.redirectUrl,
    };
  } else {
    // Log errors in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Monime API Error:', response.error?.message);
    }
    throw new Error(
      `Failed to create Monime checkout session: ${response.error?.message || "Unknown error"}`
    );
  }
}

interface MonimePayoutParams {
  amount: number;
  currency: string;
  recipientPhone: string;
  metadata: Record<string, unknown>;
}

export async function createMonimePayout(
  params: MonimePayoutParams
): Promise<{ id: string }> {
  const { amount, recipientPhone, metadata } = params;

  const destination: DestinationOption = {
    type: "momo",
    providerId: "m17", // Orange Money SL - adjust based on provider
    phoneNumber: recipientPhone,
  };

  const response = await monime.payout.create(
    Math.round(amount * 100), // Convert to cents
    destination,
    process.env.MONIME_DEFAULT_FINANCIAL_ACCOUNT || "" // sourceAccount
  );

  if (response.success && response.data?.result) {
    return {
      id: response.data.result.id,
    };
  } else {
    throw new Error(
      `Failed to create Monime payout: ${response.error?.message || "Unknown error"}`
    );
  }
}

