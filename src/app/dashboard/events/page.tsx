
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


async function getMyEvents(userId: string) {
  const supabase = createClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*, tickets(count), organizer:profiles!inner(*)')
    .eq('organizer_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching user events:', error);
    return [];
  }

  return events.map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
  }));
}

async function getRegisteredEvents(userId: string) {
    const supabase = createClient();
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('events!inner(*, tickets(count), organizer:profiles!inner(*)), id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error('Error fetching registered events:', error);
        return [];
    }

    return tickets
      .filter(ticket => ticket.events) // Ensure event data is not null
      .map(ticket => ({
        ...ticket.events!,
        attendees: ticket.events!.tickets[0]?.count || 0,
        ticket_id: ticket.id,
    }));
}


async function getAllEvents(user: any) {
  const supabase = createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select('*, tickets(count), organizer:profiles!inner(*)')
    .eq('is_public', true)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching all events:', error.message);
    return [];
  }
  
  if (!user) {
    return events.map(event => ({
      ...event,
      attendees: event.tickets[0]?.count || 0,
    }));
  }

  const { data: userTickets, error: ticketError } = await supabase
    .from('tickets')
    .select('event_id, id')
    .in('event_id', events.map(e => e.id))
    .eq('user_id', user.id);
  
  if (ticketError) {
      console.error('Error fetching user tickets for all events:', ticketError);
      // Proceed without ticket info if this fails
  }
  
  const userTicketMap = new Map(userTickets?.map(t => [t.event_id, t.id]));

  return events.map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
    ticket_id: userTicketMap.get(event.id),
  }));
}

async function getPastEvents(userId: string) {
    const supabase = createClient();
    
    // Fetch events the user attended
    const { data: attendedTickets, error: attendedError } = await supabase
        .from('tickets')
        .select('events!inner(*, tickets(count), organizer:profiles!inner(*))')
        .eq('user_id', userId);

    if(attendedError) {
        console.error('Error fetching past attended events:', attendedError);
    }
    
    const attendedEvents = (attendedTickets || [])
      .filter(t => t.events && new Date(t.events.date) < new Date())
      .map(t => ({...t.events!, type: 'attended' as const, attendees: t.events!.tickets[0]?.count || 0 }));


    // Fetch events the user organized
    const { data: organizedEvents, error: organizedError } = await supabase
        .from('events')
        .select('*, tickets(count), organizer:profiles!inner(*)')
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

    return uniquePastEvents;
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
  const [user, setUser] = useState<any>(null);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Events
        </h1>
        <Button asChild>
          <Link href="/dashboard/events/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>
      
       <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search events by title..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
           <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
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
                  You haven't created any events yet
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
