
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { uploadFile } from '../supabase/storage';

// This schema is for server-side validation after the form data is processed
const eventDbSchema = z.object({
  title: z.string().min(2, 'Event title must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  date: z.string(), // ISO string
  end_date: z.string().optional().nullable(),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  cover_image: z.string().url().optional().or(z.literal('')),
  capacity: z.coerce.number().int().positive().optional(),
  scanners: z.array(z.string().email()).optional(),
});


export async function createEventAction(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to create an event.' };
    }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        end_date: formData.get('end_date') || null,
        location: formData.get('location'),
        cover_image: formData.get('cover_image'),
        capacity: formData.get('capacity') ? Number(formData.get('capacity')) : undefined,
        scanners: JSON.parse(formData.get('scanners') as string || '[]'),
    };
    
    const parsed = eventDbSchema.safeParse(rawData);

    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }
  
    const { title, description, date, end_date, location, cover_image, capacity, scanners } = parsed.data;
  
    let finalCoverImage = cover_image;

    if (!finalCoverImage) {
        finalCoverImage = `https://picsum.photos/seed/${Math.random()}/600/400`
    }

    const { data: eventData, error } = await supabase.from('events').insert({
        title,
        description,
        date: date,
        end_date: end_date,
        location,
        cover_image: finalCoverImage,
        organizer_id: user.id,
        capacity
    }).select('id').single();

    if (error || !eventData) {
        console.error('Error creating event:', error);
        return { success: false, error: 'Could not create event.' };
    }

    const scannerEmails = scanners;
    if (scannerEmails && scannerEmails.length > 0) {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, raw_user_meta_data')
            .in('raw_user_meta_data->>email', scannerEmails);

        if(profileError) {
             console.error('Error fetching profiles for scanners:', profileError);
        }

        if (profiles && profiles.length > 0) {
            const scannerRecords = profiles.map(profile => ({
                event_id: eventData.id,
                user_id: profile.id,
              }));
            const { error: scannerError } = await supabase.from('event_scanners').insert(scannerRecords);
            if (scannerError) {
                console.error('Error assigning scanners:', scannerError);
            }
        }
    }

    revalidatePath('/dashboard/events');
    revalidatePath('/');
    return { success: true };
}


export async function updateEventAction(eventId: number, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to update an event.' };
    }

    const { data: existingEvent, error: ownerError } = await supabase
        .from('events')
        .select('organizer_id, cover_image')
        .eq('id', eventId)
        .single();

    if (ownerError || !existingEvent) {
        return { success: false, error: 'Event not found.' };
    }

    if (existingEvent.organizer_id !== user.id) {
        return { success: false, error: 'You are not authorized to update this event.' };
    }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        end_date: formData.get('end_date') || null,
        location: formData.get('location'),
        cover_image: formData.get('cover_image'),
        capacity: formData.get('capacity') ? Number(formData.get('capacity')) : undefined,
    };

    const parsed = eventDbSchema.partial().safeParse(rawData);

    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const { title, description, date, end_date, location, cover_image, capacity } = parsed.data;
    
    let finalCoverImage = cover_image;

    if (!finalCoverImage) {
        finalCoverImage = existingEvent.cover_image
    }

    const { error } = await supabase
        .from('events')
        .update({
            title,
            description,
            date,
            end_date,
            location,
            cover_image: finalCoverImage,
            capacity,
        })
        .eq('id', eventId);

    if (error) {
        console.error('Error updating event:', error);
        return { success: false, error: 'Could not update event.' };
    }

    revalidatePath('/dashboard/events');
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/edit`);
    return { success: true };
}


export async function getEventDetails(eventId: string) {
    const supabase = await createClient();
    const { data: event, error } = await supabase
      .from('events')
      .select('*, tickets(count)')
      .eq('id', eventId)
      .single();
  
    if (error || !event) {
      console.error('Error fetching event details', error);
      return { data: null, error: 'Event not found' };
    }
    const eventWithAttendeeCount = {
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }
  
    return { data: eventWithAttendeeCount, error: null };
}

export async function getEventAttendees(eventId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return { data: null, error: 'Not authenticated' };

    const { data: eventData, error: eventError } = await supabase.from('events').select('organizer_id').eq('id', eventId).single();

    if(eventError || !eventData) {
        return { data: null, error: 'Could not verify event ownership.' };
    }
    
    if(eventData.organizer_id !== user.id) {
        return { data: null, error: 'You are not authorized to view these attendees.' };
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
        return { data: null, error: 'Could not fetch attendees.' };
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

    return { data: attendeesWithEmail, error: null };
}
