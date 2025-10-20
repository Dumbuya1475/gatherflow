interface MonimeCheckoutParams {
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}

interface MonimeCheckoutResponse {
  id: string;
  url: string;
}

export async function createMonimeCheckout(
  params: MonimeCheckoutParams
): Promise<MonimeCheckoutResponse> {
  const response = await fetch('https://api.monime.io/v1/checkout-sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
      'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      success_url: `${process.env.NEXT_PUBLIC_URL}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/tickets/cancel`,
      metadata: params.metadata
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Monime API error: ${error.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: data.url
  };
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
  const response = await fetch('https://api.monime.io/v1/payouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
      'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      destination: {
        type: 'mobile_money',
        phone: params.recipientPhone
      },
      metadata: params.metadata
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Monime payout error: ${error.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return { id: data.id };
}