
'use server';

import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Ticket, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';

async function getEventFinancialDetails(eventId: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, price, status, organizer_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found' };
  }
  if (event.organizer_id !== user.id) {
      return { error: 'You are not authorized to view this page.'}
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_price, platform_fee, payment_processor_fee, monime_payment_status, profiles(first_name, last_name, email)')
    .eq('event_id', eventId);

  if (ticketsError) {
    return { error: 'Could not fetch ticket data' };
  }

  const paidTickets = tickets.filter(t => t.monime_payment_status === 'paid');
  const revenue = paidTickets.reduce((acc, t) => acc + (t.ticket_price || 0) + (t.platform_fee || 0), 0);
  const platformFees = paidTickets.reduce((acc, t) => acc + (t.platform_fee || 0), 0);
  const monimeFees = paidTickets.reduce((acc, t) => acc + (t.payment_processor_fee || 0), 0);
  const netRevenue = revenue - platformFees - monimeFees;

  return {
    event,
    revenue,
    platformFees,
    monimeFees,
    netRevenue,
    tickets: paidTickets,
  };
}

export default async function EventFinancialsPage({ params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  const stats = await getEventFinancialDetails(eventId);

  if (stats.error) {
    return <p className="text-destructive">{stats.error}</p>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SLE' }).format(amount);
  }
  
  const { event, revenue, platformFees, netRevenue, tickets } = stats;

  return (
    <div className="space-y-8">
      <div>
         <Button asChild variant="outline" className="mb-4">
            <Link href="/dashboard/organizer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Finances
            </Link>
        </Button>
        <h1 className="text-3xl font-bold">Financials for: {event.title}</h1>
        <p className="text-muted-foreground">
          A detailed financial breakdown of your event.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformFees)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Individual Transactions</CardTitle>
          <CardDescription>A list of all paid tickets for this event.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Attendee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                  <TableCell>{ticket.profiles?.first_name} {ticket.profiles?.last_name}</TableCell>
                  <TableCell>{ticket.profiles?.email}</TableCell>
                  <TableCell className="text-right">{formatCurrency((ticket.ticket_price || 0) + (ticket.platform_fee || 0))}</TableCell>
                </TableRow>
              ))}
               {tickets.length === 0 && (
                   <TableRow>
                       <TableCell colSpan={4} className="h-24 text-center">
                           No paid tickets found for this event yet.
                       </TableCell>
                   </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
