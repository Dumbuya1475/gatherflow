'use server';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Users, CalendarCheck, Activity, Calendar as CalendarIcon } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


async function getDashboardStats() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { totalEvents: 0, activeEvents: 0, totalAttendees: 0, checkInsToday: 0, recentEvents: [] };

  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', user.id);

  const { count: activeEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', user.id)
    .gt('date', new Date().toISOString());

  const { data: eventIds, error: eventIdsError } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', user.id);

  let totalAttendees = 0;
  if (eventIds) {
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('event_id', eventIds.map(e => e.id));
    totalAttendees = count || 0;
  }
  
  // Placeholder for check-ins today
  const checkInsToday = 0;

  const { data: recentEventsData, error: recentEventsError } = await supabase
    .from('events')
    .select('*, tickets(count)')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentEvents = (recentEventsData || []).map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
  }));

  return {
    totalEvents: totalEvents || 0,
    activeEvents: activeEvents || 0,
    totalAttendees: totalAttendees || 0,
    checkInsToday,
    recentEvents
  };
}

export default async function DashboardPage() {
  const { totalEvents, activeEvents, totalAttendees, checkInsToday, recentEvents } = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h1>
        <Button asChild>
          <Link href="/dashboard/events/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">All events you have created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents}</div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendees}</div>
            <p className="text-xs text-muted-foreground">Across all your events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{checkInsToday}</div>
            <p className="text-xs text-muted-foreground">Scanned tickets today</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your latest events and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Attendees</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length > 0 ? (
                recentEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Link href={`/dashboard/events/${event.id}/manage`} className="font-medium hover:underline">
                        {event.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={new Date(event.date) > new Date() ? 'default' : 'secondary'} className={new Date(event.date) > new Date() ? 'bg-green-500' : ''}>
                        {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{event.attendees}</TableCell>
                    <TableCell className="text-right">{new Date(event.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No recent events.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
             <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/events">
                    View All Events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
