
'use client';
import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Users, Download, AlertCircle } from 'lucide-react';



import { createClient } from '@/lib/supabase/client';

import { useEffect } from 'react';



const OrganizerDashboard = () => {

  const [activeTab, setActiveTab] = useState('overview');

  const [earnings, setEarnings] = useState({ totalSales: 0, platformFees: 0, monimeFees: 0, availableBalance: 0, pendingPayout: 0, totalPayouts: 0 });

  const [events, setEvents] = useState([]);

  const [payoutHistory, setPayoutHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    async function fetchData() {

      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();



      if (user) {

        const { data: userEvents, error } = await supabase

          .from('events')

          .select('*, tickets(count)')

          .eq('organizer_id', user.id)

          .order('date', { ascending: false });



        if (error) {

          console.error('Error fetching user events:', error);

          return;

        }



        const totalSales = userEvents.reduce((acc, event) => acc + (event.price || 0) * (event.tickets[0]?.count || 0), 0);

        const platformFees = totalSales * 0.1;

        const monimeFees = totalSales * 0.03;

        const availableBalance = totalSales - platformFees - monimeFees;



        setEvents(userEvents.map(event => ({

          id: event.id,

          name: event.title,

          date: event.date,

          ticketPrice: event.price || 0,

          ticketsSold: event.tickets[0]?.count || 0,

          revenue: (event.price || 0) * (event.tickets[0]?.count || 0),

          status: new Date(event.date) < new Date() ? 'completed' : 'active',

          organizer_gets: (event.price || 0) * (event.tickets[0]?.count || 0) * 0.87,

        })));



        setEarnings({

          totalSales,

          platformFees,

          monimeFees,

          availableBalance,

          pendingPayout: 0, // You might need to adjust this based on your logic

          totalPayouts: 0, // You might need to adjust this based on your logic

        });

      }

      setIsLoading(false);

    }



    fetchData();

  }, []);

  const formatCurrency = (amount) => {
    return `NLE ${(amount / 1000).toFixed(0)}`;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your events and earnings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.totalSales)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings.availableBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">After all fees</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payout</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(earnings.pendingPayout)}</p>
                <p className="text-xs text-gray-500 mt-1">Available in 3 days</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid Out</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.totalPayouts)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Download className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">Fee Structure</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Platform Fee: <span className="font-bold">10%</span></p>
              <p className="text-blue-600">{formatCurrency(earnings.platformFees)}</p>
            </div>
            <div>
              <p className="text-blue-700">Payment Processing (Monime): <span className="font-bold">~3%</span></p>
              <p className="text-blue-600">{formatCurrency(earnings.monimeFees)}</p>
            </div>
            <div>
              <p className="text-blue-700">You Keep: <span className="font-bold">~87%</span></p>
              <p className="text-blue-600 font-semibold">{formatCurrency(earnings.availableBalance)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Events & Sales
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payouts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payout History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payout Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Your Events</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Request Payout
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">You Get</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {events.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Calendar className="text-gray-400 mr-2" size={16} />
                              <span className="font-medium text-gray-900">{event.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{event.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(event.ticketPrice)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm">
                              <Users className="text-gray-400 mr-1" size={16} />
                              <span className="font-medium">{event.ticketsSold}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(event.revenue)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(event.organizer_gets)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              event.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {event.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Payout History</h2>
                <div className="space-y-4">
                  {payoutHistory.map((payout) => (
                    <div key={payout.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</p>
                          <p className="text-sm text-gray-600 mt-1">{payout.events}</p>
                          <p className="text-xs text-gray-500 mt-1">Ref: {payout.reference}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            {payout.status}
                          </span>
                          <p className="text-sm text-gray-600 mt-2">{payout.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Payout Settings</h2>
                <div className="max-w-2xl space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Money Number (Orange Money)
                    </label>
                    <input
                      type="text"
                      placeholder="+232 XX XXX XXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Payouts will be sent to this number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payout Schedule
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>3 days after event</option>
                      <option>7 days after event</option>
                      <option>Weekly (Every Monday)</option>
                      <option>Monthly (1st of month)</option>
                      <option>Manual (On request)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Payout Amount
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>NLE 50 (No minimum)</option>
                      <option>NLE 100</option>
                      <option>NLE 500</option>
                      <option>NLE 1,000</option>
                    </select>
                  </div>

                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrganizerDashboard;
