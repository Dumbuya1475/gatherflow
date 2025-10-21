export interface PricingResult {
  tier: string;
  icon: string;
  label: string;
  discount: number;
  percentage: number;
  platformFee: number;
  buyerPays: number;
  organizerGets: number;
  saved: number;
  ticketsLeftInTier: number;
}

export function calculateEarlyBirdPricing(
  ticketPrice: number,
  ticketsSold: number,
  feeModel: 'buyer_pays' | 'organizer_pays'
): PricingResult {
  // Base percentage by ticket price
  let basePercentage: number;
  if (ticketPrice >= 500) basePercentage = 5;
  else if (ticketPrice >= 100) basePercentage = 8;
  else if (ticketPrice >= 50) basePercentage = 10;
  else basePercentage = 15;

  // Early Bird tiers
  let tier: string, discount: number, icon: string, label: string;
  let tierMax: number;

  if (ticketsSold < 25) {
    tier = 'super_early';
    discount = -3;
    icon = '🦅';
    label = 'Super Early Bird';
    tierMax = 25;
  } else if (ticketsSold < 50) {
    tier = 'early';
    discount = -2;
    icon = '🐦';
    label = 'Early Bird';
    tierMax = 50;
  } else if (ticketsSold < 100) {
    tier = 'regular';
    discount = 0;
    icon = '🎫';
    label = 'Regular Price';
    tierMax = 100;
  } else if (ticketsSold < 200) {
    tier = 'standard';
    discount = 1;
    icon = '🎟️';
    label = 'Standard Price';
    tierMax = 200;
  } else {
    tier = 'late';
    discount = 2;
    icon = '⏰';
    label = 'Last Minute';
    tierMax = Infinity;
  }

  const percentage = Math.max(basePercentage + discount, 3);
  const platformFee = Math.max(ticketPrice * (percentage / 100), 5);
  const ticketsLeftInTier = tierMax === Infinity ? Infinity : tierMax - ticketsSold;

  if (feeModel === 'buyer_pays') {
    const saved = discount < 0 ? Math.abs((discount / 100) * ticketPrice) : 0;
    return {
      tier,
      icon,
      label,
      discount,
      percentage,
      platformFee,
      buyerPays: ticketPrice + platformFee,
      organizerGets: ticketPrice,
      saved,
      ticketsLeftInTier
    };
  } else {
    return {
      tier,
      icon,
      label,
      discount,
      percentage,
      platformFee,
      buyerPays: ticketPrice,
      organizerGets: ticketPrice - platformFee,
      saved: 0,
      ticketsLeftInTier
    };
  }
}