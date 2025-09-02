
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '../supabase/storage';
import { redirect } from 'next/navigation';

const EVENT_LIMIT = 3;

export async function createEventAction(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'You must be logged in.' };

    const { count, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', user.id)
        .gt('date', new Date().toISOString());
        
    if (countError) {
        console.error("Error counting events:", countError);
        return { success: false, error: 'Could not verify your event count.' };
    }

    if (count !== null && count >= EVENT_LIMIT) {
        return { success: false, error: `You have reached your limit of ${EVENT_LIMIT} active events on the free plan.` };
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
        return { success: false, error: 'Please fill all required fields.' };
    }
    
    let finalCoverImage: string | null = null;
    
    if (cover_image_file && cover_image_file.size > 0) {
        try {
            finalCoverImage = await uploadFile(cover_image_file, 'event-images');
        } catch (uploadError: any) {
            console.error('Image upload failed:', uploadError);
            return { success: false, error: 'Failed to upload cover image.' };
        }
    } else {
        // If no file is uploaded, assign a random placeholder
        finalCoverImage = `https://picsum.photos/seed/${Math.random()}/600/400`;
    }

    const { data: eventData, error } = await supabase
        .from('events')
        .insert({
            title,
            description,
            date,
            end_date,
            location,
            cover_image: finalCoverImage,
            organizer_id: user.id,
            capacity,
            is_paid,
            price,
            is_public,
        })
        .select('id')
        .single();

    if (error || !eventData) {
        console.error('Error creating event:', error);
        return { success: false, error: 'Could not create event.' };
    }

    // Assign scanners if any are provided
    const scannerEmails = scanners.filter(email => email);
    if (scannerEmails.length > 0) {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', scannerEmails);

        if (profileError) {
            console.error("Error fetching scanner profiles:", profileError);
            // Don't fail the whole action, just log the error
        }

        if (profiles && profiles.length > 0) {
            const scannerRecords = profiles.map(p => ({ event_id: eventData.id, user_id: p.id }));
            const { error: scannerError } = await supabase.from('event_scanners').insert(scannerRecords);
            if (scannerError) {
                console.error("Error assigning scanners:", scannerError);
            }
        }
    }

    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard');
    revalidatePath('/');

    // Instead of returning, we redirect on success from the server action
    // This is a more robust pattern than handling it on the client
    redirect('/dashboard/events');
}

export async function updateEventAction(eventId: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'You must be logged in.' };

  const { data: currentEvent, error: fetchError } = await supabase
    .from('events')
    .select('organizer_id, cover_image')
    .eq('id', eventId)
    .single();

  if (fetchError || !currentEvent) {
    return { success: false, error: 'Event not found.' };
  }

  if (currentEvent.organizer_id !== user.id) {
    return { success: false, error: 'You are not authorized to edit this event.' };
  }

  // Parse form data
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

  let finalCoverImage = currentEvent.cover_image;

  if (cover_image_file && cover_image_file.size > 0) {
    try {
      finalCoverImage = await uploadFile(cover_image_file, 'event-images');
    } catch {
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
      capacity,
      cover_image: finalCoverImage,
      is_paid,
      price,
      is_public,
    })
    .eq('id', eventId);

  if (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'Could not update event.' };
  }

  revalidatePath(`/dashboard/events`);
  revalidatePath(`/dashboard/events/${eventId}/edit`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/');

  return { success: true };
}


export async function getEventDetails(eventId: number) {
    if (isNaN(eventId)) {
        return { data: null, error: 'Invalid event ID.' };
    }
    const supabase = createClient();
    const { data: event, error } = await supabase
        .from('events')
        .select('*, tickets(count), organizer:profiles(first_name, last_name)')
        .eq('id', eventId)
        .single();
    
    if (error) {
        console.error(`Error fetching event ${eventId}:`, error);
        return { data: null, error: 'Event not found.' };
    }

    const eventWithAttendees = {
        ...event,
        attendees: event.tickets[0]?.count || 0,
        organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer,
    }

    return { data: eventWithAttendees, error: null };
}

export async function getEventAttendees(eventId: number) {
    if (isNaN(eventId)) {
        return { data: null, error: 'Invalid event ID.' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('tickets')
        .select(`
            ticket_id: id,
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
        console.error(`Error fetching attendees for event ${eventId}:`, error);
        return { data: null, error: 'Could not fetch attendees.' };
    }

    const attendees = data.map(item => ({
        ticket_id: item.ticket_id,
        checked_in: item.checked_in,
        checked_out: item.checked_out,
        first_name: item.profiles?.first_name || null,
        last_name: item.profiles?.last_name || null,
        email: item.profiles?.email || null,
    }));

    return { data: attendees, error: null };
}


export async function deleteEventAction(formData: FormData) {
  const supabase = createClient();
  const eventId = formData.get('eventId') as string;

  if (!eventId) {
    console.error('No eventId provided for deletion');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event || event.organizer_id !== user.id) {
    // You might want to handle this error more gracefully
    throw new Error("Unauthorized or event not found.");
  }

  // Delete all tickets associated with the event
  const { error: ticketError } = await supabase
    .from('tickets')
    .delete()
    .eq('event_id', eventId);
  
  if (ticketError) {
      console.error("Error deleting tickets for event:", ticketError);
      // Decide if you want to stop or continue if tickets can't be deleted
  }

  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (deleteError) {
    console.error('Error deleting event:', deleteError);
    return;
  }

  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
  revalidatePath('/');
  redirect('/dashboard/events');
}
