
'use server';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Users, CalendarCheck, Activity, Calendar as CalendarIcon, TrendingUp, Clock, MapPin, Ticket, Info } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cookies } from 'next/headers';


async function getDashboardStats(user: { id: string } | null) {
  if (!user) {
    return { isOrganizer: false, totalEvents: 0, activeEvents: 0, totalAttendees: 0, checkInsToday: 0, recentEvents: [] };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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

    const { data: events, error: eventIdsError } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', user.id);
      
    if (eventIdsError) throw eventIdsError;
    
    let totalAttendees = 0;
    let countsByEvent: Record<number, number> = {};

    if (events && events.length > 0) {
        const eventIds = events.map(e => e.id);
        const supabaseAdmin = createServiceRoleClient(cookieStore);
        const { data: countsRaw, error: ticketsCountError } = await supabaseAdmin
            .rpc('get_event_attendee_counts', { event_ids: eventIds });

        type CountRow = { event_id_out: number; attendee_count: number | string | null };

        if (ticketsCountError) {
            console.error("Error calling get_event_attendee_counts RPC:", ticketsCountError);
            throw ticketsCountError;
        }

        const counts = countsRaw as CountRow[] | null;

        if (counts && counts.length > 0) {
            countsByEvent = counts.reduce((acc, { event_id_out, attendee_count }: CountRow) => {
                acc[event_id_out] = Number(attendee_count || 0);
                return acc;
            }, {} as Record<number, number>);
            totalAttendees = Object.values(countsByEvent).reduce((acc, count) => acc + count, 0);
        }
    }
    
    // Placeholder for check-ins today
    const checkInsToday = 0;

    const { data: recentEventsData, error: recentEventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentEventsError) throw recentEventsError;

    const recentEvents = (recentEventsData || []).map(event => ({
      ...event,
      attendees: countsByEvent[event.id] || 0,
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

async function getAttendeeDashboardStats(user: { id: string }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('events!inner(*), id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    return { registeredEventsCount: 0, upcomingEvents: [], attendedEventsCount: 0 };
  }

  // Supabase can return the joined relation as an object or as an array depending on the query/relationship.
  // Normalize ticket.events to always be an object to avoid "property 'id' does not exist on type any[]".
  const normalizedTickets = tickets.map((t: any) => {
    const evt = Array.isArray(t.events) ? t.events[0] : t.events;
    return { ...t, events: evt };
  });

  const eventIds = normalizedTickets.map(t => t.events?.id).filter(Boolean) as number[];
  let countsByEvent: Record<number, number> = {};

  if (eventIds.length > 0) {
    const supabaseAdmin = createServiceRoleClient(cookieStore);
    const { data: counts, error: countError } = await supabaseAdmin
        .rpc('get_event_attendee_counts', { event_ids: eventIds });

    if (countError) {
        console.error('Error fetching attendee counts:', countError);
    } else if (counts) {
      countsByEvent = (counts as any[]).reduce((acc, { event_id_out, attendee_count }) => {
          acc[event_id_out] = Number(attendee_count || 0);
          return acc;
      }, {} as Record<number, number>);
    }
  }

  const ticketsWithCounts = normalizedTickets.map(ticket => {
      const evt = ticket.events || {};
      return {
          ...ticket,
          events: {
              ...evt,
              attendees: countsByEvent[evt.id] || 0,
          }
      };
  });

  const registeredEventsCount = ticketsWithCounts.length;
  const upcomingEvents = ticketsWithCounts
    .filter(t => t.events && new Date(t.events.date) > new Date())
    .map(t => ({...t.events!, ticket_id: t.id }))
    .slice(0, 5);
  const attendedEventsCount = ticketsWithCounts.filter(t => t.events && new Date(t.events.date) <= new Date()).length;

  return { registeredEventsCount, upcomingEvents, attendedEventsCount };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
    const {
        data: { user },
      } = await supabase.auth.getUser();

  if (!user) {
      // Handle the case where there is no user. 
      // Maybe redirect or show a login prompt.
      // For now, let's pass null to the data fetching functions.
  }

  const { isOrganizer, totalEvents, activeEvents, totalAttendees, checkInsToday, recentEvents } = await getDashboardStats(user);
  const { registeredEventsCount, upcomingEvents, attendedEventsCount } = user ? await getAttendeeDashboardStats(user) : { registeredEventsCount: 0, upcomingEvents: [], attendedEventsCount: 0 };

  const isEventLimitReached = activeEvents >= 3;

  const StatCard = ({ title, value, description, icon: Icon, trend, className = "" }: { 
    title: string; 
    value: number | string; 
    description: string; 
    icon: React.ElementType; 
    trend?: string; 
    className?: string;
  }) => (
    <Card className={`group relative overflow-hidden bg-background/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-secondary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-background/70 group-hover:bg-background transition-all duration-300 group-hover:scale-110">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-2 mb-1">
          <div className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">{value}</div>
          {trend && (
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );

  const CreateEventButton = () => {
    const button = (
      <Button 
        asChild={!isEventLimitReached}
        disabled={isEventLimitReached}
        className="group relative overflow-hidden bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg transition-all duration-300"
      >
        <Link href="/dashboard/events/create">
          <PlusCircle className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Create Event
        </Link>
      </Button>
    );

    if (isEventLimitReached) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div tabIndex={0}>{button}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You've reached your free event limit. Upgrade to create more.</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-700">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {isOrganizer ? 'Manage your events and track performance' : 'View your registered events and tickets'}
          </p>
        </div>
        <CreateEventButton />
      </div>

       {isOrganizer && isEventLimitReached && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Event Limit Reached</AlertTitle>
          <AlertDescription>
            You are on the Free Plan and have reached your limit of 3 active events. To create more events, please upgrade your plan.
          </AlertDescription>
        </Alert>
      )}

      {isOrganizer ? (
        <>
          {/* Enhanced Stat Cards with Animations */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <StatCard
                  title="Total Events"
                  value={totalEvents}
                  description="All events you have created"
                  icon={CalendarIcon}
                  trend={totalEvents > 0 ? "+12%" : undefined}
                />
            </div>
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <StatCard
                title="Active Events"
                value={`${activeEvents} / 3`}
                description="Upcoming events on Free Plan"
                icon={Activity}
                className="border-green-500/20"
              />
            </div>
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <StatCard
                  title="Total Attendees"
                  value={totalAttendees}
                  description="Across all your events"
                  icon={Users}
                  trend={totalAttendees > 0 ? "+24%" : undefined}
                />
            </div>
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
              <StatCard
                title="Check-ins Today"
                value={`+${checkInsToday}`}
                description="Scanned tickets today"
                icon={CalendarCheck}
                className="border-blue-500/20"
              />
            </div>
          </div>

          {/* Enhanced Recent Events Table */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <Card className="relative overflow-hidden bg-background/50 backdrop-blur-sm border-border/50 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] to-secondary/[0.01]"></div>
              <CardHeader className="relative z-10 border-b border-border/40 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-background/70">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </div>
                      Recent Events
                    </CardTitle>
                    <CardDescription className="mt-1">Your latest events and their performance metrics</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-background/70 border-border/50">
                    {recentEvents.length} Events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-muted/30">
                        <TableHead className="font-semibold">Event</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Attendees</TableHead>
                        <TableHead className="text-right font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentEvents.length > 0 ? (
                        recentEvents.map((event, index) => (
                          <TableRow 
                            key={event.id} 
                            className="group border-border/40 hover:bg-muted/50 transition-all duration-300"
                          >
                            <TableCell>
                              <Link 
                                href={`/dashboard/events/${event.id}/manage`} 
                                className="font-medium hover:text-primary transition-colors duration-200 group-hover:underline flex items-start gap-2"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{event.title}</div>
                                  {event.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={new Date(event.date) > new Date() ? 'default' : 'secondary'} 
                                className={`transition-all duration-200 ${
                                  new Date(event.date) > new Date() 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                }`}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{event.attendees}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="p-3 rounded-full bg-muted">
                                <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-muted-foreground">No recent events</p>
                                <p className="text-sm text-muted-foreground/70">Create your first event to get started</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="relative z-10 border-t border-border/40 bg-background/30 backdrop-blur-sm">
                <Button asChild variant="outline" size="sm" className="ml-auto group">
                  <Link href="/dashboard/events">
                    View All Events 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Enhanced Attendee Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <StatCard
                title="My Tickets"
                value={registeredEventsCount}
                description="Total events you've registered for"
                icon={Ticket}
                className="border-blue-500/20"
              />
            </div>
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <StatCard
                title="Upcoming Events"
                value={upcomingEvents.length}
                description="Events you're registered for that are coming up"
                icon={CalendarIcon}
                className="border-green-500/20"
              />
            </div>
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <StatCard
                title="Events Attended"
                value={attendedEventsCount}
                description="Events you've attended in the past"
                icon={CalendarCheck}
                className="border-purple-500/20"
              />
            </div>
          </div>

          {/* Enhanced Upcoming Events for Attendees */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
            <Card className="relative overflow-hidden bg-background/50 backdrop-blur-sm border-border/50 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] to-secondary/[0.01]"></div>
              <CardHeader className="relative z-10 border-b border-border/40 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-background/70">
                        <Ticket className="h-4 w-4 text-primary" />
                      </div>
                      Your Upcoming Events
                    </CardTitle>
                    <CardDescription className="mt-1">Events you are registered to attend</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-background/70 border-border/50">
                    {upcomingEvents.length} Tickets
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-muted/30">
                        <TableHead className="font-semibold">Event</TableHead>
                        <TableHead className="text-right font-semibold">Date</TableHead>
                        <TableHead className="text-right font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event, index) => (
                          <TableRow 
                            key={event.id} 
                            className="group border-border/40 hover:bg-muted/50 transition-all duration-300"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium group-hover:text-primary transition-colors duration-200">
                                  {event.title}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {new Date(event.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm" className="group">
                                <Link href={`/dashboard/tickets/${event.ticket_id}`}>
                                  <Ticket className="mr-1 h-3 w-3" />
                                  View Ticket
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="p-3 rounded-full bg-muted">
                                <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-muted-foreground">No upcoming events</p>
                                <p className="text-sm text-muted-foreground/70">Browse events to find something interesting</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="relative z-10 border-t border-border/40 bg-background/30 backdrop-blur-sm">
                <Button asChild variant="outline" size="sm" className="ml-auto group">
                  <Link href="/dashboard/events">
                    Browse Events 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
