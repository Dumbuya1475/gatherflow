'use client';
import React, { useState } from 'react';
import { DollarSign, TrendingDown, AlertCircle } from 'lucide-react';

const MonimeFeeBreakdown = () => {
  const [ticketPrice, setTicketPrice] = useState(100);
  const [feeModel, setFeeModel] = useState('buyer_pays');

  const [ticketsSold, setTicketsSold] = useState(0);

  const calculateComplete = (price: number, model: string, ticketsSold: number) => {
    const getBasePercentage = (price) => {
      if (price >= 500) return 5;
      if (price >= 100) return 8;
      if (price >= 50) return 10;
      return 15;
    };

    const basePercentage = getBasePercentage(price);
    let earlyBirdDiscount = 0;
    if (ticketsSold < 50) earlyBirdDiscount = 2;
    else if (ticketsSold < 100) earlyBirdDiscount = 1;
    else if (ticketsSold < 200) earlyBirdDiscount = 0;
    else earlyBirdDiscount = -1;

    const finalPercentage = Math.max(basePercentage - earlyBirdDiscount, 3);
    const platformFee = Math.max(price * (finalPercentage / 100), 5);
    const monimeFeePercentage = 3;

    if (model === 'buyer_pays') {
      const buyerPays = price + platformFee;
      const monimeFee = buyerPays * (monimeFeePercentage / 100);
      const netReceived = buyerPays - monimeFee;
      const platformProfit = platformFee - (platformFee * (monimeFeePercentage / 100));
      const organizerGets = price;

      return {
        ticketPrice: price,
        platformFee: platformFee,
        buyerPays: buyerPays,
        monimeFee: monimeFee,
        netReceived: netReceived,
        organizerGets: organizerGets,
        platformProfit: platformProfit
      };
    } else {
      const buyerPays = price;
      const monimeFee = buyerPays * (monimeFeePercentage / 100);
      const netReceived = buyerPays - monimeFee;
      const organizerGets = netReceived - platformFee;
      const platformProfit = platformFee;

      return {
        ticketPrice: price,
        platformFee: platformFee,
        buyerPays: buyerPays,
        monimeFee: monimeFee,
        netReceived: netReceived,
        organizerGets: organizerGets,
        platformProfit: platformProfit
      };
    }
  };

  const breakdown = calculateComplete(ticketPrice, feeModel, ticketsSold);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Money Flow Breakdown</h1>
          <p className="text-gray-600 mt-2">See exactly where every Leone goes</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Price (NLE)
              </label>
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tickets Sold
              </label>
              <input
                type="number"
                value={ticketsSold}
                onChange={(e) => setTicketsSold(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Model
              </label>
              <select
                value={feeModel}
                onChange={(e) => setFeeModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="buyer_pays">Buyer Pays Fee</option>
                <option value="organizer_pays">Organizer Pays Fee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Flow Chart */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Money Flow</h2>
          
          {feeModel === 'buyer_pays' ? (
            // BUYER PAYS MODEL
            <div className="space-y-4">
              {/* Step 1: Buyer */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">👤 Buyer Pays</h3>
                    <p className="text-sm text-blue-700">At checkout via Monime</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-900">
                      NLE {breakdown.buyerPays.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-700">
                      (NLE {breakdown.ticketPrice} ticket + NLE {breakdown.platformFee.toFixed(2)} fee)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <TrendingDown className="text-gray-400" size={32} />
              </div>

              {/* Step 2: Monime Takes Fee */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-red-900">💳 Monime Takes Their Fee</h3>
                    <p className="text-sm text-red-700">3% payment processing fee</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-900">
                      -NLE {breakdown.monimeFee.toFixed(2)}
                    </div>
                    <div className="text-xs text-red-700">
                      (3% of NLE {breakdown.buyerPays.toFixed(2)})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <TrendingDown className="text-gray-400" size={32} />
              </div>

              {/* Step 3: Net Received */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-purple-900">🏦 GatherFlow Receives</h3>
                    <p className="text-sm text-purple-700">In your Monime account</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-900">
                      NLE {breakdown.netReceived.toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-700">
                      (NLE {breakdown.buyerPays.toFixed(2)} - NLE {breakdown.monimeFee.toFixed(2)})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-2xl">↙️ ↘️</div>
              </div>

              {/* Step 4: Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                  <div>
                    <h3 className="text-lg font-bold text-green-900">🎤 Organizer Gets</h3>
                    <p className="text-sm text-green-700 mb-2">Via payout 3 days after event</p>
                    <div className="text-3xl font-bold text-green-900">
                      NLE {breakdown.organizerGets.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      (Full ticket price)
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900">💰 Platform Keeps</h3>
                    <p className="text-sm text-yellow-700 mb-2">Your profit per ticket</p>
                    <div className="text-3xl font-bold text-yellow-900">
                      NLE {breakdown.platformProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      (Fee minus Monime's cut)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ORGANIZER PAYS MODEL
            <div className="space-y-4">
              {/* Step 1: Buyer */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">👤 Buyer Pays</h3>
                    <p className="text-sm text-blue-700">Clean price - no added fees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-900">
                      NLE {breakdown.buyerPays.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-700">
                      (Just the ticket price)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <TrendingDown className="text-gray-400" size={32} />
              </div>

              {/* Step 2: Monime Takes Fee */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-red-900">💳 Monime Takes Their Fee</h3>
                    <p className="text-sm text-red-700">3% payment processing fee</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-900">
                      -NLE {breakdown.monimeFee.toFixed(2)}
                    </div>
                    <div className="text-xs text-red-700">
                      (3% of NLE {breakdown.buyerPays.toFixed(2)})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <TrendingDown className="text-gray-400" size={32} />
              </div>

              {/* Step 3: Net Received */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-purple-900">🏦 GatherFlow Receives</h3>
                    <p className="text-sm text-purple-700">In your Monime account</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-900">
                      NLE {breakdown.netReceived.toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-700">
                      (NLE {breakdown.buyerPays.toFixed(2)} - NLE {breakdown.monimeFee.toFixed(2)})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-2xl">↙️ ↘️</div>
              </div>

              {/* Step 4: Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                  <div>
                    <h3 className="text-lg font-bold text-orange-900">🎤 Organizer Gets</h3>
                    <p className="text-sm text-orange-700 mb-2">After platform fee deduction</p>
                    <div className="text-3xl font-bold text-orange-900">
                      NLE {breakdown.organizerGets.toFixed(2)}
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      (NLE {breakdown.netReceived.toFixed(2)} - NLE {breakdown.platformFee.toFixed(2)} fee)
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900">💰 Platform Keeps</h3>
                    <p className="text-sm text-yellow-700 mb-2">Your profit per ticket</p>
                    <div className="text-3xl font-bold text-yellow-900">
                      NLE {breakdown.platformProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      (Full platform fee)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary Breakdown</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Party</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 font-medium text-blue-900">💰 Buyer Pays (Total)</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-900">
                    NLE {breakdown.buyerPays.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-700">100%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">└─ Ticket Price</td>
                  <td className="px-6 py-4 text-right">NLE {breakdown.ticketPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {((breakdown.ticketPrice / breakdown.buyerPays) * 100).toFixed(1)}%
                  </td>
                </tr>
                {feeModel === 'buyer_pays' && (
                  <tr>
                    <td className="px-6 py-4">└─ Platform Fee</td>
                    <td className="px-6 py-4 text-right">NLE {breakdown.platformFee.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {((breakdown.platformFee / breakdown.buyerPays) * 100).toFixed(1)}%
                    </td>
                  </tr>
                )}
                <tr className="bg-red-50">
                  <td className="px-6 py-4 font-medium text-red-900">💳 Monime Fee (Deducted)</td>
                  <td className="px-6 py-4 text-right font-bold text-red-900">
                    -NLE {breakdown.monimeFee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-700">-3%</td>
                </tr>
                <tr className="bg-purple-50">
                  <td className="px-6 py-4 font-medium text-purple-900">🏦 Net Received by Platform</td>
                  <td className="px-6 py-4 text-right font-bold text-purple-900">
                    NLE {breakdown.netReceived.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-purple-700">
                    {((breakdown.netReceived / breakdown.buyerPays) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className={feeModel === 'buyer_pays' ? 'bg-green-50' : 'bg-orange-50'}>
                  <td className="px-6 py-4 font-medium" style={{color: feeModel === 'buyer_pays' ? '#065f46' : '#9a3412'}}>
                    🎤 Organizer Gets (Payout)
                  </td>
                  <td className="px-6 py-4 text-right font-bold" style={{color: feeModel === 'buyer_pays' ? '#065f46' : '#9a3412'}}>
                    NLE {breakdown.organizerGets.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right" style={{color: feeModel === 'buyer_pays' ? '#047857' : '#c2410c'}}>
                    {((breakdown.organizerGets / breakdown.buyerPays) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="px-6 py-4 font-medium text-yellow-900">💰 Platform Profit</td>
                  <td className="px-6 py-4 text-right font-bold text-yellow-900">
                    NLE {breakdown.platformProfit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-yellow-700">
                    {((breakdown.platformProfit / breakdown.buyerPays) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Key Insight:</p>
                <p>
                  Monime's 3% fee comes from the <strong>TOTAL payment</strong> (what buyer pays), not just from the platform fee. 
                  This is standard for payment processors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonimeFeeBreakdown;