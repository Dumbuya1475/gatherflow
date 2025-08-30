

'use server';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import { PlusCircle } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TimelineEventCard } from '@/components/timeline-event-card';

async function getMyEvents(userId: string) {
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

  return events.map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
  }));
}

async function getRegisteredEvents(userId: string) {
    const supabase = createClient();
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('events(*, tickets(count)), id')
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
    .select('*, tickets(count)')
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
        .select('events(*, tickets(count))')
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

    return uniquePastEvents;
}


export default async function EventsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const myEvents: EventWithAttendees[] = user ? await getMyEvents(user.id) : [];
  const allEvents: EventWithAttendees[] = await getAllEvents(user);
  const registeredEvents = user ? await getRegisteredEvents(user.id) : [];
  const pastEvents = user ? await getPastEvents(user.id) : [];


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

      <Tabs defaultValue="all-events">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-events">All Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
          <TabsTrigger value="registered">My Tickets</TabsTrigger>
           <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="all-events">
          {allEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
              {allEvents.map(event => (
                <EventCard key={event.id} event={event} isLoggedIn={!!user} isMyEvent={user ? event.organizer_id === user.id : false} />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <h3 className="text-xl font-semibold tracking-tight">
                No public events found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check back later for new events!
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="my-events">
          {myEvents.length > 0 ? (
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
          )}
        </TabsContent>
         <TabsContent value="registered">
          {registeredEvents.length > 0 ? (
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
          )}
        </TabsContent>
        <TabsContent value="timeline">
             {pastEvents.length > 0 ? (
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
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
