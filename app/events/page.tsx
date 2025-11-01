
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { EventWithAttendees } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { EventCard } from '@/components/event-card';
import { Footer } from '@/components/footer';
import { PublicHeader } from '@/components/public-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

async function getAllPublicEvents(user: { id: string } | null) {
  const supabase = createClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_public', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all public events:', error);
    return [];
  }

  if (events.length === 0) {
    return [];
  }

  const eventIds = events.map(event => event.id);
  const { data: counts, error: countError } = await supabase.rpc('get_event_attendee_counts', { event_ids: eventIds });

  if (countError || !Array.isArray(counts)) {
    console.error('Error fetching attendee counts:', {
      error: countError,
      counts,
      eventIds,
    });
  }

  const countMap = new Map(counts?.map((c: { event_id_out: number; attendee_count: number }) => [c.event_id_out, c.attendee_count]));

  const eventsWithCounts = events.map(event => ({
    ...event,
    attendees: countMap.get(event.id) || 0,
  }));

  const organizerIds = events.map(event => event.organizer_id).filter(Boolean) as string[];
  if (organizerIds.length === 0) {
    return eventsWithCounts;
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', organizerIds);

  if (profileError) {
    console.error('Error fetching organizer profiles:', profileError);
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  // Fetch organization data
  const organizationIds = events.map(event => event.organization_id).filter(Boolean) as string[];
  let organizationMap = new Map();

  if (organizationIds.length > 0) {
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, description')
      .in('id', organizationIds);

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
    } else {
      organizationMap = new Map(organizations?.map(o => [o.id, o]));
    }
  }

  const eventsWithOrganizer = eventsWithCounts.map(event => ({
    ...event,
    organizer: event.organizer_id ? profileMap.get(event.organizer_id) : null,
    organization: event.organization_id ? organizationMap.get(event.organization_id) : null,
  }));

  if (!user) {
    return eventsWithOrganizer;
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

  return eventsWithOrganizer.map(event => ({
    ...event,
    ticket_id: userTicketMap.get(event.id),
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

export default function AllEventsPage() {
  const [allEvents, setAllEvents] = useState<EventWithAttendees[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchInitialData = async () => {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const eventsData = await getAllPublicEvents(currentUser);
        setAllEvents(eventsData);
        setIsLoading(false);
    }
    fetchInitialData();
  }, []);

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter(event => {
        if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        const eventDate = new Date(event.date);
        if (dateFilter === 'upcoming' && eventDate < new Date()) {
          return false;
        }
        if (dateFilter === 'past' && eventDate >= new Date()) {
          return false;
        }
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

            <div className="mt-12 max-w-5xl mx-auto">
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
            </div>

            {isLoading ? (
                <div className="mt-12"><EventsLoadingSkeleton /></div>
            ) : filteredEvents.length > 0 ? (
              <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} isMyEvent={false}/>
                ))}
              </div>
            ) : (
              <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                <h3 className="text-xl font-semibold tracking-tight">No public events found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
