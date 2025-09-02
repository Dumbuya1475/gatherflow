
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '../supabase/storage';
import { redirect } from 'next/navigation';
import type { Attendee } from '../types';

const EVENT_LIMIT = 3;

export async function createEventAction(formData: FormData) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to create an event.' };
    }

    // Check event limit
    const { count, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', user.id)
        .gt('date', new Date().toISOString());

    if (countError) {
        console.error('Error counting active events:', countError);
        return { success: false, error: 'Could not verify your event count.' };
    }
    
    if (count !== null && count >= EVENT_LIMIT) {
        return { success: false, error: 'You have reached your limit of 3 active events for the free plan.' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const end_date = formData.get('end_date') as string | null;
    const location = formData.get('location') as string;
    const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null;
    const scanners = JSON.parse(formData.get('scanners') as string || '[]') as string[];
    const cover_image_file = formData.get('cover_image_file') as File | null;
    const is_paid = formData.get('is_paid') === 'true';
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const is_public = formData.get('is_public') === 'true';
  
    if (!title || !description || !date || !location) {
        return { success: false, error: 'Please fill in all required fields.' };
    }
  
    let finalCoverImage: string | undefined;

    if (cover_image_file && cover_image_file.size > 0) {
        try {
            finalCoverImage = await uploadFile(cover_image_file, 'event-images');
        } catch (uploadError) {
            return { success: false, error: 'Failed to upload cover image.' };
        }
    } else {
        finalCoverImage = `https://picsum.photos/seed/${Math.random()}/600/400`;
    }

    const { data: eventData, error } = await supabase.from('events').insert({
        title,
        description,
        date: date,
        end_date: end_date,
        location,
        cover_image: finalCoverImage,
        organizer_id: user.id,
        capacity,
        is_paid,
        price,
        is_public,
    }).select('id').single();

    if (error || !eventData) {
        console.error('Error creating event:', error);
        return { success: false, error: 'Could not create event.' };
    }

    const scannerEmails = scanners.filter(email => email); // Filter out any empty emails
    if (scannerEmails && scannerEmails.length > 0) {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', scannerEmails);

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
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, data: eventData };
}


export async function updateEventAction(eventId: number, formData: FormData) {
    const supabase = createClient();
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
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const end_date = formData.get('end_date') as string | null;
    const location = formData.get('location') as string;
    const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null;
    const cover_image_file = formData.get('cover_image_file') as File | null;
    const is_paid = formData.get('is_paid') === 'true';
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const is_public = formData.get('is_public') === 'true';
    
    let finalCoverImage = existingEvent.cover_image;

    if (cover_image_file && cover_image_file.size > 0) {
       try {
            finalCoverImage = await uploadFile(cover_image_file, 'event-images');
        } catch (uploadError) {
            return { success: false, error: 'Failed to upload new cover image.' };
        }
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
            is_paid,
            price,
            is_public
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


export async function getEventDetails(eventId: number) {
    const supabase = createClient();
    const { data: event, error } = await supabase
      .from('events')
      .select('*, tickets(count)')
      .eq('id', eventId)
      .single();
  
    if (error || !event) {
      console.error('Error fetching event details', error);
      return { data: null, error: 'Event not found' };
    }

    const { data: organizerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', event.organizer_id!)
        .single();
    
    if(profileError) {
        console.error('Error fetching organizer profile for event details', profileError);
    }

    const eventWithAttendeeCount = {
        ...event,
        attendees: event.tickets[0]?.count || 0,
        organizer: organizerProfile,
    }
  
    return { data: eventWithAttendeeCount, error: null };
}

export async function getEventAttendees(eventId: number): Promise<{ data: Attendee[] | null, error: string | null }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: 'You are not authorized to view these attendees.' };
    }
    
    const { data: event } = await supabase.from('events').select('organizer_id').eq('id', eventId).single();

    if (!event || event.organizer_id !== user.id) {
        return { data: null, error: 'You are not authorized to view these attendees.' };
    }

    const { data, error } = await supabase
        .from('tickets')
        .select(`
            id,
            checked_in,
            checked_out,
            profiles (
                first_name,
                last_name,
                email
            )
        `)
        .eq('event_id', eventId);


    if (error) {
        console.error('Error fetching event attendees:', error);
        return { data: null, error: 'Could not fetch event attendees.' };
    }

    const attendees: Attendee[] = data.map(ticket => ({
        ticket_id: ticket.id,
        checked_in: ticket.checked_in,
        checked_out: ticket.checked_out,
        // @ts-ignore
        first_name: ticket.profiles?.first_name || null,
        // @ts-ignore
        last_name: ticket.profiles?.last_name || null,
        // @ts-ignore
        email: ticket.profiles?.email || null,
    }));

    return { data: attendees, error: null };
}


export async function deleteEventAction(formData: FormData) {
    const supabase = createClient();
    const eventId = formData.get('eventId') as string;
  
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      throw new Error('You must be logged in to delete an event.');
    }
  
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('organizer_id', user.id);
  
    if (error) {
        console.error('Error deleting event:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
    }
  
    revalidatePath('/dashboard/events');
    redirect('/dashboard/events');
}
