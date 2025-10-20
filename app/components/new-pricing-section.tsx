
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const NewPricingSection = () => {
  const [ticketPrice, setTicketPrice] = useState(100);

  const calculateEarlyBirdFee = (price: number, ticketsSold: number) => {
    let basePercentage;
    if (price >= 500) basePercentage = 5;
    else if (price >= 100) basePercentage = 8;
    else if (price >= 50) basePercentage = 10;
    else basePercentage = 15;

    let earlyBirdDiscount = 0;
    if (ticketsSold < 25) earlyBirdDiscount = 3;
    else if (ticketsSold < 50) earlyBirdDiscount = 2;
    else if (ticketsSold < 100) earlyBirdDiscount = 0;
    else if (ticketsSold < 200) earlyBirdDiscount = -1;
    else earlyBirdDiscount = -2;

    const finalPercentage = Math.max(basePercentage - earlyBirdDiscount, 3);
    const platformFee = Math.max(price * (finalPercentage / 100), 5);

    return {
      finalPercentage,
      platformFee,
      buyerPays: price + platformFee,
      isEarlyBird: earlyBirdDiscount > 0,
      savings: earlyBirdDiscount > 0 ? (price * (earlyBirdDiscount / 100)) : 0
    };
  };

  const pricingTiers = [
    {
      tier: 'super_early',
      label: 'Super Early Bird',
      sales: 'First 25 tickets',
      ticketsSold: 0,
    },
    {
      tier: 'early',
      label: 'Early Bird',
      sales: 'Next 25 tickets',
      ticketsSold: 25,
    },
    {
      tier: 'normal',
      label: 'Regular Price',
      sales: 'Next 50 tickets',
      ticketsSold: 50,
    },
    {
      tier: 'standard',
      label: 'Standard Price',
      sales: 'Next 100 tickets',
      ticketsSold: 100,
    },
    {
      tier: 'late',
      label: 'Last Minute',
      sales: '200+ tickets',
      ticketsSold: 200,
    },
  ];

  return (
    <section id="pricing" className="w-full py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent"></div>
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-background/50 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-primary/20">
              Transparent Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
              A Fairer Pricing Model for <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Everyone</span>
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our dynamic fee model rewards you for selling more tickets. The earlier your fans buy, the more they save. It’s that simple.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-md text-center my-8">
          <Input
            type="number"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your ticket price"
          />
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-5 mt-16">
          {pricingTiers.map((tier, index) => {
            const { buyerPays, savings } = calculateEarlyBirdFee(ticketPrice, tier.ticketsSold);
            return (
              <Card
                key={tier.tier}
                className={`flex flex-col relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700`}
                style={{ animationDelay: `${300 + index * 150}ms` }}
              >
                <CardHeader className="text-center relative z-10">
                  <CardTitle className="text-2xl font-bold">{tier.label}</CardTitle>
                  <p className="text-muted-foreground">{tier.sales}</p>
                </CardHeader>
                <CardContent className="flex-1 relative z-10">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold mt-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{`NLE ${buyerPays.toFixed(2)}`}</p>
                    <p className="text-muted-foreground">{`You save NLE ${savings.toFixed(2)}`}</p>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button asChild className={`w-full group relative overflow-hidden transition-all duration-300`} variant={'outline'}>
                    <Link href="/signup">
                      <span className="relative z-10">
                        Create an Event
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewPricingSection;
