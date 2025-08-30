
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '../supabase/storage';
import { redirect } from 'next/navigation';

export async function createEventAction(formData: FormData) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to create an event.' };
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

    const scannerEmails = scanners;
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
    revalidatePath('/');
    return { success: true, data: eventData };
}


export async function updateEventAction(eventId: string, formData: FormData) {
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


export async function getEventDetails(eventId: string) {
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
    const eventWithAttendeeCount = {
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }
  
    return { data: eventWithAttendeeCount, error: null };
}

export async function getEventAttendees(eventId: string) {
    const supabase = createClient();

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
            profiles:user_id (
                id,
                first_name,
                last_name,
                email
            )
        `)
        .eq('event_id', eventId);

    if (error) {
        console.error('Error fetching attendees:', error);
        return { data: null, error: 'Could not fetch attendees.' };
    }

    return { data, error: null };
}


export async function deleteEventAction(formData: FormData) {
    const supabase = createClient();
    const eventId = formData.get('eventId') as string;
  
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      throw new Error('You must be logged in to delete an event.');
    }
  
    const { error } = await supabase.from('events').delete().eq('id', eventId);
  
    if (error) {
        console.error('Error deleting event:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
    }
  
    revalidatePath('/dashboard/events');
    redirect('/dashboard/events');
}


export async function createSessionAction(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const eventId = formData.get('eventId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const start_at = formData.get('start_at') as string;
    const end_at = formData.get('end_at') as string;
    const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null;

    if (!eventId || !name || !start_at || !end_at) {
        return { success: false, error: 'Missing required fields' };
    }

    const { error } = await supabase.from('sessions').insert({
        event_id: eventId,
        name,
        description,
        location,
        start_at,
        end_at,
        capacity
    });

    if (error) {
        console.error("Error creating session", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/events/${eventId}/manage`);
    return { success: true };
}

export async function getEventSessions(eventId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('sessions').select('*').eq('event_id', eventId);
    if(error) return { data: [], error: 'Could not fetch sessions' };
    return { data, error: null };
}


export async function createScanPointAction(formData: FormData) {
    const supabase = createClient();
    const eventId = formData.get('eventId') as string;
    const name = formData.get('name') as string;

    const { error } = await supabase.from('scan_points').insert({ event_id: eventId, name });
    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/events/${eventId}/manage`);
    return { success: true };
}


export async function getEventScanPoints(eventId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('scan_points').select('*').eq('event_id', eventId);
    if(error) return { data: [], error: 'Could not fetch scan points' };
    return { data, error: null };
}

export async function getEventScanners(eventId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('scanner_assignments').select(`
        profiles (id, first_name, last_name, email),
        scan_points (name)
    `).eq('event_id', eventId);

    if (error) return { data: [], error: "Could not fetch scanners" };
    return { data, error: null };
}

export async function assignScannerAction(formData: FormData) {
    const supabase = createClient();
    const eventId = formData.get('eventId') as string;
    const scannerId = formData.get('scannerId') as string;
    const scanPointId = formData.get('scanPointId') as string;

    if(!scannerId || !scanPointId) return { success: false, error: "Missing scanner or scan point" };

    const { error } = await supabase.from('scanner_assignments').upsert({
        event_id: eventId,
        scan_point_id: scanPointId,
        scanner_id: scannerId,
    }, { onConflict: 'scan_point_id, scanner_id' });

    if (error) {
        console.error("Error assigning scanner:", error);
        return { success: false, error: error.message };
    }
    revalidatePath(`/dashboard/events/${eventId}/manage`);
    return { success: true };
}
