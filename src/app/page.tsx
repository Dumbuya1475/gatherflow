
'use server';

import { createClient } from '@/lib/supabase/server';
import type { EventWithAttendees } from '@/lib/types';
import { LandingPageClient } from '@/components/landing-page-client';


async function getRecentEvents() {
    const supabase = createClient();
    const { data: events, error } = await supabase
      .from('events')
      .select('*, tickets(count)')
      .eq('is_public', true)
      .order('date', { ascending: true })
      .limit(4);
  
    if (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }

    const organizerIds = events.map(event => event.organizer_id).filter(Boolean) as string[];
    if (organizerIds.length === 0) {
        return events.map(event => ({...event, attendees: event.tickets[0]?.count || 0 }));
    }

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', organizerIds);

    if (profileError) {
        console.error('Error fetching organizer profiles:', profileError);
        // Return events without organizer info if profiles fail
        return events.map(event => ({...event, attendees: event.tickets[0]?.count || 0 }));
    }
    
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    return events.map(event => ({
      ...event,
      attendees: event.tickets[0]?.count || 0,
      organizer: event.organizer_id ? profileMap.get(event.organizer_id) : null,
    }));
}

export default async function LandingPage() {
    const recentEvents: EventWithAttendees[] = await getRecentEvents();
    const { data: { user } } = await createClient().auth.getUser();

    return <LandingPageClient recentEvents={recentEvents} user={user} />;
}
