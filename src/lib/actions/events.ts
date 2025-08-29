'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(2, 'Event title must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  date: z.date({ required_error: 'A date and time is required.' }),
  end_date: z.date().optional(),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  cover_image: z.string().url().optional().or(z.literal('')),
  capacity: z.coerce.number().int().positive().optional(),
  scanners: z.string().optional(),
  targetAudience: z.string().min(2, 'Target audience must be at least 2 characters.'),
});

export async function createEventAction(formData: unknown) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create an event.' };
  }

  const parsed = eventSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: parsed.error.errors.map(e => e.message).join(', ') };
  }
  
  const { title, description, date, end_date, location, cover_image, capacity, scanners } = parsed.data;

  const { data: eventData, error } = await supabase.from('events').insert({
    title,
    description,
    date: date.toISOString(),
    end_date: end_date?.toISOString(),
    location,
    cover_image: cover_image || `https://picsum.photos/seed/${Math.random()}/600/400`,
    organizer_id: user.id,
    capacity
  }).select('id').single();

  if (error || !eventData) {
    console.error('Error creating event:', error);
    return { error: 'Could not create event.' };
  }

  if (scanners) {
    const scannerEmails = scanners.split(',').map(email => email.trim().toLowerCase()).filter(email => z.string().email().safeParse(email).success);

    if (scannerEmails.length > 0) {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, raw_user_meta_data')
            .in('raw_user_meta_data->>email', scannerEmails);

        if(profileError) {
             console.error('Error fetching profiles for scanners:', profileError);
             // Non-fatal, we can proceed without assigning
        }

        if (profiles && profiles.length > 0) {
            const scannerRecords = profiles.map(profile => ({
                event_id: eventData.id,
                user_id: profile.id,
              }));
            const { error: scannerError } = await supabase.from('event_scanners').insert(scannerRecords);
            if (scannerError) {
                console.error('Error assigning scanners:', scannerError);
                // Non-fatal
            }
        }
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

export async function getEventDetails(eventId: string) {
    const supabase = createClient();
    const { data: event, error } = await supabase
      .from('events')
      .select('*, tickets(count)')
      .eq('id', eventId)
      .single();
  
    if (error || !event) {
      console.error('Error fetching event details', error);
      return { error: 'Event not found' };
    }
    const eventWithAttendeeCount = {
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }
  
    return { data: eventWithAttendeeCount };
}

export async function getEventAttendees(eventId: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return { error: 'Not authenticated' };

    const { data: eventData, error: eventError } = await supabase.from('events').select('organizer_id').eq('id', eventId).single();

    if(eventError || !eventData) {
        return { error: 'Could not verify event ownership.' };
    }
    
    if(eventData.organizer_id !== user.id) {
        return { error: 'You are not authorized to view these attendees.' };
    }

    const { data, error } = await supabase
        .from('tickets')
        .select(`
            ticket_id: id,
            checked_in,
            profiles (
                id,
                first_name,
                last_name,
                raw_user_meta_data
            )
        `)
        .eq('event_id', eventId);

    if (error) {
        console.error('Error fetching attendees:', error);
        return { error: 'Could not fetch attendees.' };
    }

    const attendeesWithEmail = data.map(item => {
        const profile = item.profiles as any;
        return {
            ...item,
            profiles: {
                ...profile,
                email: profile?.raw_user_meta_data?.email
            }
        }
    })

    return { data: attendeesWithEmail };
}
