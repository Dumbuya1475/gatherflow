
import { createClient, type DestinationOption } from "monime-package";

console.log('Monime Configuration:', {
  hasAccessToken: !!process.env.MONIME_ACCESS_TOKEN,
  hasSpaceId: !!process.env.MONIME_SPACE_ID,
  spaceId: process.env.MONIME_SPACE_ID,
  tokenPrefix: process.env.MONIME_ACCESS_TOKEN?.substring(0, 8)
});

const monime = createClient({
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
  monimeSpaceId: process.env.MONIME_SPACE_ID!,
});

interface MonimeCheckoutParams {
  metadata: Record<string, any>;
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
  
  console.log('Creating Monime checkout with:', {
    name,
    amount: item.price.value,
    quantity: item.quantity,
    successUrl,
    cancelUrl,
    description: item.name,
    metadata
  });

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

  console.log('Monime response:', { success: response.success, error: response.error });

  if (response.success && response.data?.result) {
    return {
      id: response.data.result.id,
      url: response.data.result.redirectUrl,
    };
  } else {
    // Log the full error details
    console.error('Monime API Error Details:', {
      message: response.error?.message,
      error: response.error,
      // @ts-ignore - accessing axios error details
      axiosData: response.error?.response?.data
    });
    throw new Error(
      `Failed to create Monime checkout session: ${response.error?.message || "Unknown error"}`
    );
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

