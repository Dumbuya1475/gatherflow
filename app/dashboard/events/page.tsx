'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import { PlusCircle, Search } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TimelineEventCard } from '@/components/timeline-event-card';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';


async function getMyEvents(userId: string): Promise<EventWithAttendees[]> {
  const supabase = createClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*, tickets(count)')
    .eq('organizer_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching user events:', error);
    return [];
  }

  // Fetch organization data for events
  const organizationIds = events?.map(event => event.organization_id).filter(Boolean) as string[];
  let organizationMap = new Map();

  if (organizationIds.length > 0) {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, description')
      .in('id', organizationIds);
    
    if (organizations) {
      organizationMap = new Map(organizations.map(o => [o.id, o]));
    }
  }

  return events.map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
    organization: event.organization_id ? organizationMap.get(event.organization_id) : null,
  }));
}

async function getRegisteredEvents(userId: string): Promise<EventWithAttendees[]> {
    const supabase = createClient();
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('events!inner(*, tickets(count)), id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error('Error fetching registered events:', error);
        return [];
    }
    
    // Type assertion: events from !inner join is actually a single object, not an array
        type TicketWithEvent = {
            id: number;
            events: EventWithAttendees & { tickets: { count: number }[] };
        };
        
        const typedTickets = tickets as unknown as TicketWithEvent[];
        const events = typedTickets
            .filter(ticket => ticket.events)
            .map(ticket => ticket.events);
        
        const organizerIds = events.map(event => event.organizer_id).filter(Boolean) as string[];
    
        if (organizerIds.length === 0) {
            return typedTickets
            .filter(ticket => ticket.events)
            .map(ticket => ({
                ...(ticket.events as EventWithAttendees),
                attendees: ticket.events.tickets[0]?.count || 0,
                ticket_id: ticket.id,
            })) as EventWithAttendees[];
        }

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, created_at, updated_at, first_name, last_name, username, full_name, avatar_url, website, email, is_guest, phone')
        .in('id', organizerIds);
    
    if (profileError) {
         console.error('Error fetching organizer profiles for registered events:', profileError);
    }
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    // Fetch organization data
    const organizationIds = new Set(
      events
        .filter((event: Record<string, unknown>) => event.organization_id)
        .map((event: Record<string, unknown>) => event.organization_id)
    );
    
    let organizationMap = new Map();

    if (organizationIds.size > 0) {
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name, description')
        .in('id', Array.from(organizationIds));
      
      if (organizations) {
        organizationMap = new Map(organizations.map(o => [o.id, o]));
      }
    }

    return typedTickets
      .filter(ticket => ticket.events) // Ensure event data is not null
      .map(ticket => ({
        ...ticket.events,
        attendees: ticket.events.tickets[0]?.count || 0,
        ticket_id: ticket.id,
        organizer: ticket.events.organizer_id ? profileMap.get(ticket.events.organizer_id) : null,
        organization: ticket.events.organization_id ? organizationMap.get(ticket.events.organization_id) : null,
    }));
}


async function getAllEvents(currentUser: { id: string } | null): Promise<EventWithAttendees[]> {
  const supabase = createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select('*, tickets(count)')
    .eq('is_public', true)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching all events:', error.message);
    return [];
  }
  
  const organizerIds = events.map(event => event.organizer_id).filter(Boolean) as string[];
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', organizerIds);

  if (profileError) {
    console.error('Error fetching profiles for all events:', profileError);
  }
  const profileMap = new Map(profiles?.map(p => [p.id, p]));
  
  const eventsWithOrganizer = events.map(event => ({
    ...event,
    organizer: event.organizer_id ? profileMap.get(event.organizer_id) : null,
    attendees: event.tickets[0]?.count || 0,
  }));
  
  if (!currentUser) {
    return eventsWithOrganizer;
  }

  const { data: userTickets, error: ticketError } = await supabase
    .from('tickets')
    .select('event_id, id')
    .in('event_id', events.map(e => e.id))
    .eq('user_id', currentUser.id);
  
  if (ticketError) {
      console.error('Error fetching user tickets for all events:', ticketError);
  }
  
  const userTicketMap = new Map(userTickets?.map(t => [t.event_id, t.id]));

  return eventsWithOrganizer.map(event => ({
    ...event,
    ticket_id: userTicketMap.get(event.id),
  }));
}

async function getPastEvents(userId: string): Promise<EventWithAttendees[]> {
    const supabase = createClient();
    
    // Fetch events the user attended
    const { data: attendedTickets, error: attendedError } = await supabase
        .from('tickets')
        .select('events!inner(*, tickets(count))')
        .eq('user_id', userId);

    if(attendedError) {
        console.error('Error fetching past attended events:', attendedError);
    }
    
    // Type assertion: events from !inner join is actually a single object, not an array
    type TicketWithEvent = {
        events: Record<string, unknown> & { date: string; tickets: { count: number }[] };
    };
    
    const typedAttendedTickets = (attendedTickets || []) as unknown as TicketWithEvent[];
    const attendedEvents = typedAttendedTickets
      .filter(t => t.events && new Date(t.events.date) < new Date())
      .map(t => ({...t.events, type: 'attended' as const, attendees: t.events.tickets[0]?.count || 0 }));


    // Fetch events the user organized
    const { data: organizedEvents, error: organizedError } = await supabase
        .from('events')
        .select('*, tickets(count)')
        .eq('organizer_id', userId)
        .lt('date', new Date().toISOString())
        .order('date', { ascending: false });

    if(organizedError) {
        console.error('Error fetching past organized events:', organizedError);
    }

    const pastOrganizedEvents = (organizedEvents || []).map(e => ({...e, type: 'organized' as const, attendees: e.tickets[0]?.count || 0 }));

    const allPastEvents = [...attendedEvents, ...pastOrganizedEvents];
    
    // Simple deduplication in case user attended their own event
    const uniquePastEvents = Array.from(new Map(allPastEvents.map(e => [e.id, e])).values());
    
    uniquePastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const organizerIds = uniquePastEvents.map(event => event.organizer_id).filter(Boolean) as string[];
    if (organizerIds.length === 0) return uniquePastEvents;

     const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', organizerIds);

    if (profileError) console.error('Error fetching past events organizers:', profileError);

    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    return uniquePastEvents.map(event => ({
      ...event,
      organizer: event.organizer_id ? profileMap.get(event.organizer_id) : null,
    }));
}


function EventsLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <Skeleton className="aspect-[16/10] w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
          <CardFooter className="p-4 pt-0">
             <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}


export default function EventsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [allEvents, setAllEvents] = useState<EventWithAttendees[]>([]);
  const [myEvents, setMyEvents] = useState<EventWithAttendees[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<EventWithAttendees[]>([]);
  const [pastEvents, setPastEvents] = useState<EventWithAttendees[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function fetchUserAndEvents() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if(currentUser) {
        const [
          allEventsData, 
          myEventsData, 
          registeredEventsData, 
          pastEventsData
        ] = await Promise.all([
          getAllEvents(currentUser),
          getMyEvents(currentUser.id),
          getRegisteredEvents(currentUser.id),
          getPastEvents(currentUser.id)
        ]);
        setAllEvents(allEventsData);
        setMyEvents(myEventsData);
        setRegisteredEvents(registeredEventsData);
        setPastEvents(pastEventsData);
      } else {
         const allEventsData = await getAllEvents(null);
         setAllEvents(allEventsData);
      }
      setIsLoading(false);
    }
    fetchUserAndEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter(event => {
        // Search filter
        if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        // Date filter
        const eventDate = new Date(event.date);
        if (dateFilter === 'upcoming' && eventDate < new Date()) {
          return false;
        }
        if (dateFilter === 'past' && eventDate >= new Date()) {
          return false;
        }
        // Type filter
        if (typeFilter === 'free' && event.is_paid) {
          return false;
        }
        if (typeFilter === 'paid' && !event.is_paid) {
          return false;
        }
        return true;
      });
  }, [allEvents, searchTerm, dateFilter, typeFilter]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Events
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover, create, and manage your events
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/organizer">
              Organizer Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/events/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search events by title..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="all-events">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-events">All Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
          <TabsTrigger value="registered">My Tickets</TabsTrigger>
           <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="all-events">
          {isLoading ? <EventsLoadingSkeleton /> : (
            filteredEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} isLoggedIn={!!user} isMyEvent={user ? event.organizer_id === user.id : false} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                <h3 className="text-xl font-semibold tracking-tight">
                  No public events found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check back later or adjust your filters!
                </p>
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="my-events">
           {isLoading ? <EventsLoadingSkeleton /> : (
            myEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                {myEvents.map(event => (
                  <EventCard key={event.id} event={event} isLoggedIn={!!user} isMyEvent={true}/>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                <h3 className="text-xl font-semibold tracking-tight">
                  You haven&apos;t created any events yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first event.
                </p>
                <Button asChild>
                  <Link href="/dashboard/events/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Event
                  </Link>
                </Button>
              </div>
            )
           )}
        </TabsContent>
         <TabsContent value="registered">
          {isLoading ? <EventsLoadingSkeleton /> : (
            registeredEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                {registeredEvents.map(event => (
                  <EventCard key={event.id} event={event} isLoggedIn={!!user} isMyEvent={user ? event.organizer_id === user.id : false} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                <h3 className="text-xl font-semibold tracking-tight">You have no tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Register for an event to get your ticket.
                </p>
              </div>
            )
           )}
        </TabsContent>
        <TabsContent value="timeline">
             {isLoading ? <EventsLoadingSkeleton /> : (
                pastEvents.length > 0 ? (
                  <div className="relative mt-12 pl-6">
                      <div className="absolute left-[30px] top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                      <div className="space-y-12">
                          {pastEvents.map((event) => (
                            <TimelineEventCard key={`${event.id}-${event.type}`} event={event} />
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                      <h3 className="text-xl font-semibold tracking-tight">No past events</h3>
                      <p className="text-sm text-muted-foreground">
                          Your past created and attended events will appear here.
                      </p>
                  </div>
              )
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}