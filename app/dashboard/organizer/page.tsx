
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



  const formatCurrency = (amount: number) => {
    return `NLE ${(amount / 1000).toFixed(0)}`;
  };

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
          pendingPayout: 850000, // Mock data
          totalPayouts: 1281500, // Mock data
        });

        setPayoutHistory([
          {
            id: 1,
            date: '2025-10-15',
            amount: 850000,
            status: 'completed',
            reference: 'PAYOUT-001',
            events: 'Moe AI Tutor Launch'
          },
          {
            id: 2,
            date: '2025-10-10',
            amount: 431500,
            status: 'completed',
            reference: 'PAYOUT-002',
            events: 'Web Dev Workshop'
          }
        ]);
      }
      setIsLoading(false);
    }

    fetchData();
  }, []);
};

export default OrganizerDashboard;
