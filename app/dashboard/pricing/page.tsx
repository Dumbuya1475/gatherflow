
'use client';
import React, { useState } from 'react';
import { TrendingDown, DollarSign, Users, Info } from 'lucide-react';

const PricingPreview = () => {
  const [ticketPrice, setTicketPrice] = useState(100);

  const calculateEarlyBirdFee = (price: number, ticketsSold: number) => {
    let basePercentage;
    if (price >= 500) basePercentage = 5;
    else if (price >= 100) basePercentage = 8;
    else if (price >= 50) basePercentage = 10;
    else basePercentage = 15;
    
    // EARLY BUYERS GET DISCOUNT!
    let earlyBirdDiscount = 0;
    if (ticketsSold < 50) earlyBirdDiscount = 2;       // First 50: -2%
    else if (ticketsSold < 100) earlyBirdDiscount = 1; // Next 50: -1%
    else if (ticketsSold < 200) earlyBirdDiscount = 0; // Next 100: 0%
    else earlyBirdDiscount = -1; // After 200: +1% (late fee!)
    
    const finalPercentage = Math.max(
      basePercentage - earlyBirdDiscount,
      3
    );
    
    const platformFee = Math.max(
      price * (finalPercentage / 100),
      5
    );
    
    return {
      finalPercentage,
      platformFee,
      buyerPays: price + platformFee,
      organizerGets: price,
      isEarlyBird: earlyBirdDiscount > 0,
      saved: earlyBirdDiscount > 0 ? (price * (earlyBirdDiscount / 100)) : 0
    };
  };

  const scenarios = [
    { tickets: 1, label: "Starting out", icon: "🎫" },
    { tickets: 50, label: "Growing", icon: "📈" },
    { tickets: 100, label: "Popular", icon: "🔥" },
    { tickets: 200, label: "Hot Event", icon: "⭐" },
    { tickets: 500, label: "Massive", icon: "🚀" }
  ];

  const pricingData = scenarios.map(scenario => ({
    ...scenario,
    ...calculateEarlyBirdFee(ticketPrice, scenario.tickets)
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Calculator</h1>
        <p className="text-gray-600">See how your fees decrease as you sell more tickets!</p>
        
        {/* Ticket Price Input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Ticket Price
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-48 px-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
            <span className="text-2xl font-bold text-gray-700">NLE</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How it works:</p>
            <p>You keep <span className="font-bold">100% of your ticket price (NLE {ticketPrice})</span>. We add a small service fee that buyers pay. The more tickets you sell, the lower the fee percentage!</p>
          </div>
        </div>
      </div>

      {/* Pricing Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {pricingData.map((scenario, index) => (
          <div 
            key={index}
            className={`bg-white rounded-lg shadow-lg overflow-hidden transform transition hover:scale-105 ${
              scenario.tickets >= 200 ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {/* Card Header */}
            <div className={`p-4 ${
              scenario.tickets >= 500 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
              scenario.tickets >= 200 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              scenario.tickets >= 100 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-gradient-to-r from-gray-500 to-slate-500'
            }`}>
              <div className="text-white">
                <div className="text-4xl mb-2">{scenario.icon}</div>
                <h3 className="text-xl font-bold">{scenario.label}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Users size={16} />
                  <span className="text-sm">{scenario.tickets} tickets sold</span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Fee Percentage */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Platform Fee</span>
                  {scenario.saved > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                      Save {scenario.saved.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {scenario.finalPercentage.toFixed(1)}%
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Buyer Pays</span>
                  <span className="text-lg font-semibold text-gray-900">
                    NLE {scenario.buyerPays.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform Fee</span>
                  <span className="text-sm text-gray-600">
                    -NLE {scenario.platformFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                  <span className="text-sm font-semibold text-green-700">You Get</span>
                  <span className="text-xl font-bold text-green-600">
                    NLE {scenario.organizerGets.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-gray-900">
                  NLE {(scenario.organizerGets * scenario.tickets).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({scenario.tickets} tickets × NLE {scenario.organizerGets})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Volume Discount Breakdown</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer Pays</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">You Keep</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pricingData.map((scenario, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{scenario.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{scenario.tickets}</div>
                        <div className="text-xs text-gray-500">{scenario.label}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      scenario.finalPercentage <= 5 ? 'bg-green-100 text-green-800' :
                      scenario.finalPercentage <= 8 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {scenario.finalPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    NLE {scenario.platformFee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    NLE {scenario.buyerPays.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    NLE {scenario.organizerGets.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    NLE {(scenario.organizerGets * scenario.tickets).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-blue-600" size={20} />
              <span className="text-sm font-semibold text-blue-900">Volume Discounts</span>
            </div>
            <p className="text-xs text-blue-700">
              Sell more tickets, pay less in fees. Rates drop from {pricingData[0].finalPercentage.toFixed(1)}% to {pricingData[pricingData.length - 1].finalPercentage.toFixed(1)}%
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={20} />
              <span className="text-sm font-semibold text-green-900">You Keep 100%</span>
            </div>
            <p className="text-xs text-green-700">
              Your ticket price (NLE {ticketPrice}) goes directly to you. Service fee is paid by the buyer.
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-purple-600" size={20} />
              <span className="text-sm font-semibold text-purple-900">Minimum Fee</span>
            </div>
                         <p className="text-xs text-purple-700">
                           Minimum platform fee is NLE 5 per ticket to keep the platform running.
                         </p>          </div>
        </div>
      </div>

      {/* Pricing Tiers Explanation */}
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How Our Pricing Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Base Rates by Ticket Price</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">NLE 0-49</span>
                <span className="font-semibold text-gray-900">15% base</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">NLE 50-99</span>
                <span className="font-semibold text-gray-900">10% base</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">NLE 100-499</span>
                <span className="font-semibold text-gray-900">8% base</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">NLE 500+</span>
                <span className="font-semibold text-gray-900">5% base</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Volume Discounts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">50-99 tickets</span>
                <span className="font-semibold text-green-600">-0.5%</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">100-199 tickets</span>
                <span className="font-semibold text-green-600">-1.0%</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">200-499 tickets</span>
                <span className="font-semibold text-green-600">-1.5%</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">500+ tickets</span>
                <span className="font-semibold text-green-600">-2.0%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> Payment processing fees (~3%) charged by Monime are separate and deducted from the total payment before funds reach your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPreview;
