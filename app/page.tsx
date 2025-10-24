
'use server';

import { createClient } from '@@/app/lib/supabase/server';
import type { EventWithAttendees } from '@/lib/types';
import { LandingPageClient } from '@/components/landing-page-client';
import { cookies } from 'next/headers';

async function getRecentEvents() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*, tickets(count)')
    .eq('is_public', true)
    .gt('date', new Date().toISOString()) // Only upcoming events
    .order('date', { ascending: true }) // Get the soonest events
    .limit(4);

  if (error) {
    console.error('Error fetching recent events:', error);
    return [];
  }

  const eventsWithAttendees = events.map(event => ({
    ...event,
    attendees: event.tickets[0]?.count || 0,
  }));

  const organizerIds = events.map(event => event.organizer_id).filter(Boolean) as string[];
    if (organizerIds.length === 0) return eventsWithAttendees;

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', organizerIds);

    if (profileError) {
        console.error('Error fetching organizer profiles for recent events:', profileError);
    }
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    return eventsWithAttendees.map(event => ({
      ...event,
      organizer: event.organizer_id ? profileMap.get(event.organizer_id) : null,
    }));
}

async function getFeaturedEvents() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Get 5 upcoming public events with cover images for the carousel
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, date, location, price, cover_image')
    .eq('is_public', true)
    .gt('date', new Date().toISOString())
    .not('cover_image', 'is', null) // Only events with cover images
    .order('date', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching featured events:', error);
    return [];
  }

  return events || [];
}


export default async function LandingPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    const recentEvents = await getRecentEvents();

    return <LandingPageClient recentEvents={recentEvents} user={user} />;
}
