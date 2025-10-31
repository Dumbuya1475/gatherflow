
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
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  Ticket,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getOrganizerStats() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, price, status')
    .eq('organizer_id', user.id);

  if (eventsError) {
    return { error: 'Could not fetch events' };
  }

  const eventIds = events.map(event => event.id);

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('event_id, ticket_price, platform_fee, payment_processor_fee')
    .in('event_id', eventIds)
    .eq('monime_payment_status', 'paid');

  if (ticketsError) {
    return { error: 'Could not fetch ticket data' };
  }

  const totalSales = tickets.reduce((acc, t) => acc + (t.ticket_price || 0) + (t.platform_fee || 0), 0);
  const totalPlatformFees = tickets.reduce((acc, t) => acc + (t.platform_fee || 0), 0);
  const totalMonimeFees = tickets.reduce((acc, t) => acc + (t.payment_processor_fee || 0), 0);
  const netRevenue = totalSales - totalPlatformFees - totalMonimeFees;
  
  const eventsWithStats = events.map(event => {
    const eventTickets = tickets.filter(t => t.event_id === event.id);
    const revenue = eventTickets.reduce((acc, t) => acc + (t.ticket_price || 0) + (t.platform_fee || 0), 0);
    const ticketsSold = eventTickets.length;
    return {
      ...event,
      revenue,
      ticketsSold,
    };
  });

  return {
    totalSales,
    totalPlatformFees,
    netRevenue,
    totalTicketsSold: tickets.length,
    events: eventsWithStats,
  };
}

export default async function OrganizerDashboardPage() {
  const stats = await getOrganizerStats();

  if (stats.error) {
    return <p className="text-destructive">{stats.error}</p>;
  }

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SLE' }).format(amount);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
        <p className="text-muted-foreground">
          Your financial overview and event performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">Gross revenue from all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.netRevenue)}</div>
            <p className="text-xs text-muted-foreground">After all fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPlatformFees)}</div>
            <p className="text-xs text-muted-foreground">Fees paid to GatherFlow</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTicketsSold}</div>
            <p className="text-xs text-muted-foreground">Across all paid events</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events Summary</CardTitle>
          <CardDescription>Financial performance of each event.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tickets Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.events?.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>{event.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{event.ticketsSold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(event.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/organizer/${event.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
