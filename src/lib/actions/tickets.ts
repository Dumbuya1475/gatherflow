
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function registerForEventAction(
  prevState: { error?: string; success?: boolean; ticketId?: number; } | undefined,
  formData: FormData
) {
  const supabase = createClient();
  const eventId = parseInt(formData.get('eventId') as string, 10);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
     redirect(`/events/${eventId}/register`);
  }

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('capacity, tickets(count)')
    .eq('id', eventId)
    .single();

  if(eventError || !eventData) {
    return { error: 'This event could not be found.' };
  }

  const capacity = eventData.capacity;
  const currentRegistrations = eventData.tickets[0]?.count || 0;

  if (capacity !== null && currentRegistrations >= capacity) {
    return { error: 'This event has reached its maximum capacity.' };
  }

  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingTicket) {
    return redirect(`/dashboard/tickets/${existingTicket.id}`);
  }
  
  const { data: ticket, error } = await supabase.from('tickets').insert({
    event_id: eventId,
    user_id: user.id,
  }).select('id').single();

  if (error || !ticket) {
    console.error('Error registering for event:', error);
    return { error: 'Could not register for the event.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/events');
  revalidatePath(`/dashboard/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events`);
  
  return { success: true, ticketId: ticket.id };
}

export async function unregisterForEventAction(
  prevState: { error?: string; success?: boolean; } | undefined,
  formData: FormData
) {
  const supabase = createClient();
  const ticketId = parseInt(formData.get('ticketId') as string, 10);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in.' };
  }
  
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, user_id, event_id')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    return { error: 'Ticket not found.' };
  }

  if (ticket.user_id !== user.id) {
    return { error: 'You are not authorized to perform this action.' };
  }

  const { error: deleteError } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId);

  if (deleteError) {
    console.error('Error unregistering from event:', deleteError);
    return { error: 'Could not cancel your registration.' };
  }

  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
  revalidatePath(`/events`);
  if (ticket.event_id) {
      revalidatePath(`/events/${ticket.event_id}`);
      revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
  }
  
  return { success: true };
}

export async function unregisterAttendeeAction(formData: FormData) {
  const supabase = createClient();
  const ticketId = formData.get('ticketId') as string;
  const eventId = formData.get('eventId') as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in.');
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', parseInt(eventId, 10))
    .single();
  
  if (eventError || !event || event.organizer_id !== user.id) {
    throw new Error('You are not authorized to perform this action.');
  }

  const { error: deleteError } = await supabase
    .from('tickets')
    .delete()
    .eq('id', parseInt(ticketId, 10));
  
  if (deleteError) {
    console.error('Error unregistering attendee:', deleteError);
    throw new Error('Could not unregister the attendee.');
  }

  revalidatePath(`/dashboard/events/${eventId}/manage`);
  revalidatePath(`/dashboard/analytics`);
  revalidatePath('/events');
  
  redirect(`/dashboard/events/${eventId}/manage`);
}


export async function registerAndCreateTicket(
    prevState: { error: string | undefined } | undefined,
    formData: FormData
) {
    const supabase = createClient();
    const eventId = parseInt(formData.get('eventId') as string, 10);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    if (password !== confirmPassword) {
        return { error: "Passwords do not match." };
    }

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('capacity, tickets(count)')
      .eq('id', eventId)
      .single();

    if(eventError || !eventData) {
      return { error: 'This event could not be found.' };
    }

    const capacity = eventData.capacity;
    const currentRegistrations = eventData.tickets[0]?.count || 0;

    if (capacity !== null && currentRegistrations >= capacity) {
      return { error: 'This event has reached its maximum capacity.' };
    }

    const { data: { user: existingUser }, error: userFetchError } = await supabase.auth.getUser();
    if (userFetchError) {
        // This is fine, just means no one is logged in.
    }
    if (existingUser) {
        return { error: 'You are already logged in. Please register from the dashboard.'}
    }
    
    // Check if email already exists in auth.users
    const { data: existingAuthUser, error: existingAuthUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAuthUser) {
        return { error: 'An account with this email already exists. Please log in to register.' };
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
            },
        },
    });

    if (signUpError || !signUpData.user) {
        return { error: signUpError?.message || "Could not sign up user." };
    }
    
    // After signUp, the user is automatically logged in and a session is created.
    // We can proceed to create the ticket.

    const { data: ticketData, error: ticketError } = await supabase.from('tickets').insert({
        event_id: eventId,
        user_id: signUpData.user.id,
    }).select('id').single();

    if (ticketError || !ticketData) {
        return { error: ticketError?.message || "You are registered as a user, but we failed to create your ticket. Please contact support." };
    }
    
    revalidatePath(`/dashboard/events`);
    revalidatePath(`/events`);
    redirect(`/events/${eventId}/register/success?ticketId=${ticketData.id}`);
}


export async function getTicketDetails(ticketId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: null, error: 'Not authenticated' };
    }

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, events(*, tickets(count))')
        .eq('id', ticketId)
        .single();
    
    if (error || !ticket) {
        console.error('Error fetching ticket', error);
        return { data: null, error: 'Ticket not found.' };
    }

    const isOwner = ticket.user_id === user.id;
    
    const { data: eventData } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', ticket.event_id!)
        .single();

    const isOrganizer = eventData?.organizer_id === user.id;

    if (!isOwner && !isOrganizer) {
        return { data: null, error: 'You are not authorized to view this ticket.' };
    }

    const { data: organizerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', ticket.events!.organizer_id!)
        .single();
    
    if (profileError) {
        console.error("Error fetching organizer profile for ticket", profileError);
    }

    const ticketWithOrganizer = {
        ...ticket,
        events: {
            ...ticket.events!,
            attendees: ticket.events!.tickets[0]?.count || 0,
            organizer: organizerProfile,
        }
    }

    return { data: ticketWithOrganizer, error: null };
}

export async function verifyTicket(qrToken: string, eventId: number) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return { success: false, error: 'Not authenticated. Please log in.' };

        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select('id, event_id, checked_in, user_id, events(organizer_id)')
            .eq('qr_token', qrToken)
            .single();

        if(ticketError || !ticket) {
            console.error("Ticket lookup error:", ticketError?.message);
            return { success: false, error: 'Invalid QR Code. Ticket not found.' };
        }

        if (ticket.event_id !== eventId) {
            return { success: false, error: 'This ticket is not for this event.' };
        }
        
        const isOrganizer = ticket.events?.organizer_id === user.id;
        
        const { data: scannerAssignment, error: scannerError } = await supabase
            .from('event_scanners')
            .select('user_id', { count: 'exact' })
            .eq('event_id', ticket.event_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (scannerError) {
            console.error("Error checking scanner assignment:", scannerError);
            return { success: false, error: "Could not verify scanner permissions."};
        }
        
        const isScanner = !!scannerAssignment;

        if (!isOrganizer && !isScanner) {
            return { success: false, error: 'You are not authorized to check in tickets for this event.' };
        }

        if(ticket.checked_in) {
            return { success: false, error: `This ticket has already been checked in.` };
        }

        const { error: updateError } = await supabase
        .from('tickets')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq('id', ticket.id);
        
        if(updateError) {
            console.error("Failed to check in ticket:", updateError);
            return { success: false, error: 'Database error: Failed to check in ticket.' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', ticket.user_id)
            .single();
        
        revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
        revalidatePath(`/dashboard/analytics`);

        const attendeeName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'attendee';
        return { success: true, message: `Successfully checked in ${attendeeName}.` };
    } catch (e) {
        console.error("Verification failed:", e);
        if (e instanceof Error && e.message.includes('invalid input syntax for type uuid')) {
             return { success: false, error: 'Invalid QR Code format.' };
        }
        return { success: false, error: 'An unexpected error occurred during verification.' };
    }
}

export async function checkoutAttendeeAction(formData: FormData) {
    const supabase = createClient();
    const ticketId = formData.get('ticketId') as string;
    const eventId = formData.get('eventId') as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Authentication required.');
    }

    const { error } = await supabase
        .from('tickets')
        .update({ checked_out: true, checked_out_at: new Date().toISOString() })
        .eq('id', parseInt(ticketId, 10));

    if (error) {
        console.error('Error checking out attendee:', error);
        throw new Error('Failed to check out attendee.');
    }

    revalidatePath(`/dashboard/events/${eventId}/manage`);
    return { success: true };
}


export async function getScannableEvents() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: 'You must be logged in to view scannable events.', isLoggedIn: false };
    }
    
    const { data: scannerAssignments, error: scannerError } = await supabase
        .from('event_scanners')
        .select('event_id')
        .eq('user_id', user.id);

    if (scannerError) {
        console.error('Error fetching scannable event IDs:', scannerError);
        return { data: [], error: 'Could not fetch assigned events.', isLoggedIn: true };
    }
    const assignedEventIds = (scannerAssignments || []).map(a => a.event_id);

    const { data: organizedEventsData, error: organizedEventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id);

    if (organizedEventsError) {
        console.error('Error fetching organized event IDs:', organizedEventsError);
    }
    const organizedEventIds = (organizedEventsData || []).map(e => e.id);

    const allScannableEventIds = [...new Set([...assignedEventIds, ...organizedEventIds])];

    if (allScannableEventIds.length === 0) {
        return { data: [], isLoggedIn: true, error: null };
    }
    
    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*, tickets(count)')
        .in('id', allScannableEventIds)
        .gt('date', new Date(new Date().setDate(new Date().getDate() -1)).toISOString()); // show events from yesterday onwards

    if (eventsError) {
        console.error('Error fetching full event details:', eventsError);
        return { data: [], error: 'Could not fetch event details.', isLoggedIn: true };
    }

    const uniqueEvents = (events || []).map(event => ({
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }));

    return { data: uniqueEvents, isLoggedIn: true, error: null };
}
