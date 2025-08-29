
'use server';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Users, CalendarCheck, Activity, Calendar as CalendarIcon } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


async function getDashboardStats(user: any) {
  if (!user) {
    return { isOrganizer: false, totalEvents: 0, activeEvents: 0, totalAttendees: 0, checkInsToday: 0, recentEvents: [] };
  }

  try {
    const supabase = createClient();

    const { count: totalEvents, error: totalEventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', user.id);

    if (totalEventsError) throw totalEventsError;

    const { count: activeEvents, error: activeEventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', user.id)
      .gt('date', new Date().toISOString());

    if (activeEventsError) throw activeEventsError;

    const { data: eventIds, error: eventIdsError } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', user.id);

    if (eventIdsError) throw eventIdsError;

    let totalAttendees = 0;
    if (eventIds && eventIds.length > 0) {
      const { count, error: ticketsCountError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds.map(e => e.id));
      if (ticketsCountError) throw ticketsCountError;
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

    if (recentEventsError) throw recentEventsError;

    const recentEvents = (recentEventsData || []).map(event => ({
      ...event,
      attendees: event.tickets[0]?.count || 0,
    }));
    
    const isOrganizer = totalEvents !== null && totalEvents > 0;

    return {
      isOrganizer,
      totalEvents: totalEvents || 0,
      activeEvents: activeEvents || 0,
      totalAttendees: totalAttendees || 0,
      checkInsToday,
      recentEvents
    };
  } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Return a default state in case of any error
      return { isOrganizer: false, totalEvents: 0, activeEvents: 0, totalAttendees: 0, checkInsToday: 0, recentEvents: [] };
  }
}

async function getAttendeeDashboardStats(user: any) {
  const supabase = createClient();
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('events(*, tickets(count))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { registeredEventsCount: 0, upcomingEvents: [], attendedEventsCount: 0 };
  }

  const registeredEventsCount = tickets.length;
  const upcomingEvents = tickets
    .filter(t => t.events && new Date(t.events.date) > new Date())
    .map(t => ({...t.events!, attendees: t.events!.tickets[0]?.count || 0, ticket_id: t.id }))
    .slice(0, 5);
  const attendedEventsCount = tickets.filter(t => t.events && new Date(t.events.date) <= new Date()).length;

  return { registeredEventsCount, upcomingEvents, attendedEventsCount };
}

export default async function DashboardPage() {
  const supabase = createClient();
    const {
        data: { user },
      } = await supabase.auth.getUser();

  const { isOrganizer, totalEvents, activeEvents, totalAttendees, checkInsToday, recentEvents } = await getDashboardStats(user);
  const { registeredEventsCount, upcomingEvents, attendedEventsCount } = user ? await getAttendeeDashboardStats(user) : { registeredEventsCount: 0, upcomingEvents: [], attendedEventsCount: 0 };

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

      {isOrganizer ? (
        <>
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
        </>
      ) : (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Tickets</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{registeredEventsCount}</div>
                        <p className="text-xs text-muted-foreground">Total events you've registered for</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                         <p className="text-xs text-muted-foreground">Events you're registered for that are coming up</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attendedEventsCount}</div>
                        <p className="text-xs text-muted-foreground">Events you've attended in the past</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                <CardTitle>Your Upcoming Events</CardTitle>
                <CardDescription>Events you are registered for.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => (
                        <TableRow key={event.id}>
                            <TableCell>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-sm text-muted-foreground">{event.location}</div>
                            </TableCell>
                            <TableCell className="text-right">{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/tickets/${event.ticket_id}`}>View Ticket</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            You have no upcoming events.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/events">
                            Browse Events <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </>
      )}

    </div>
  );
}
