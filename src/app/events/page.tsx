
'use server';

import type { EventWithAttendees } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { EventCard } from '@/components/event-card';
import { Footer } from '@/components/footer';
import { PublicHeader } from '@/components/public-header';
import Link from 'next/link';

async function getAllPublicEvents() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events, error } = await supabase
    .from('events')
    .select('*, tickets(count)')
    .eq('is_public', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all public events:', error.message);
    return [];
  }

  const eventsWithAttendeeCount = events.map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
  }));

  if (!user) {
    return eventsWithAttendeeCount;
  }

  const { data: userTickets, error: ticketError } = await supabase
    .from('tickets')
    .select('event_id, id')
    .in('event_id', events.map(e => e.id))
    .eq('user_id', user.id);

  if (ticketError) {
    console.error('Error fetching user tickets for all events:', ticketError);
  }

  const userTicketMap = new Map(userTickets?.map(t => [t.event_id, t.id]));

  return eventsWithAttendeeCount.map(event => ({
    ...event,
    ticket_id: userTicketMap.get(event.id),
  }));
}

export default async function AllEventsPage() {
  const allEvents: EventWithAttendees[] = await getAllPublicEvents();
  const { data: { user } } = await createClient().auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-28 md:py-36">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">All Public Events</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Browse through all the exciting public events on GatherFlow.
                </p>
              </div>
            </div>
            {allEvents.length > 0 ? (
              <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
                {allEvents.map((event) => (
                  <EventCard key={event.id} event={event} isLoggedIn={!!user} isMyEvent={user ? event.organizer_id === user.id : false}/>
                ))}
              </div>
            ) : (
              <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                <h3 className="text-xl font-semibold tracking-tight">No public events found</h3>
                <p className="text-sm text-muted-foreground">Please check back later.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
