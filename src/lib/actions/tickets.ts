
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function registerForEventAction(
  prevState: { error: string | undefined } | undefined,
  formData: FormData
) {
  const supabase = createClient();

  const eventId = formData.get('eventId') as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This will be handled by the client-side redirect for non-logged-in users
     const eventRedirectPath = eventId ? `/events/${eventId}/register` : '/signup';
     redirect(eventRedirectPath);
  }

  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (existingTicket) {
    return { error: 'You are already registered for this event.' };
  }
  
  const { data: eventData } = await supabase.from('events').select('capacity, tickets(count)').eq('id', eventId).single();
  const capacity = eventData?.capacity;
  const currentRegistrations = eventData?.tickets[0]?.count || 0;

  if (capacity && currentRegistrations >= capacity) {
    return { error: 'This event has reached its maximum capacity.' };
  }


  const { data: ticket, error } = await supabase.from('tickets').insert({
    event_id: parseInt(eventId),
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
  return { success: true, ticketId: ticket.id };
}


export async function registerAndCreateTicket(
    prevState: { error: string | undefined } | undefined,
    formData: FormData
) {
    const supabase = createClient();
    const eventId = formData.get('eventId') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    if (password !== confirmPassword) {
        return { error: "Passwords do not match." };
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
    
    const { data: ticketData, error: ticketError } = await supabase.from('tickets').insert({
        event_id: parseInt(eventId),
        user_id: signUpData.user.id,
    }).select('id').single();

    if (ticketError || !ticketData) {
        return { error: ticketError?.message || "You are registered as a user, but we failed to create your ticket. Please contact support." };
    }
    
    redirect(`/events/${eventId}/register/success?ticketId=${ticketData.id}`);
}


export async function getTicketDetails(ticketId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, events(*)')
        .eq('id', ticketId)
        .eq('user_id', user.id)
        .single();
    
    if (error || !ticket) {
        console.error('Error fetching ticket', error);
        return { error: 'Ticket not found or you do not have access.' };
    }

    return { data: ticket };
}

export async function verifyTicket(qrToken: string, eventId: number) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return { error: 'Not authenticated' };

    const { data: ticket, error: ticketError } = await supabase.from('tickets').select('id, event_id, checked_in, events(organizer_id)').eq('qr_code_token', qrToken).single();

    if(ticketError || !ticket) {
        return { error: 'Invalid Ticket QR Code.' };
    }
    
    if(ticket.event_id !== eventId) {
        return { error: 'This ticket is for a different event.' };
    }

    const { data: scannerAssignment } = await supabase.from('event_scanners').select('id').eq('event_id', ticket.event_id).eq('user_id', user.id).single();

    if(ticket.events?.organizer_id !== user.id && !scannerAssignment) {
        return { error: 'You are not authorized to check in tickets for this event.' };
    }

    if(ticket.checked_in) {
        return { error: 'This ticket has already been checked in.' };
    }

    const { data, error } = await supabase.from('tickets').update({ checked_in: true, checked_in_at: new Date().toISOString() }).eq('id', ticket.id).select('profiles(first_name, last_name)').single();
    
    if(error || !data) {
        return { error: 'Failed to check in ticket.' };
    }
    
    revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
    revalidatePath(`/dashboard/analytics`);


    return { success: true, message: `Successfully checked in ${data.profiles?.first_name || 'attendee'}.` };
}

export async function getScannableEvents() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: 'You must be logged in to view scannable events.', isLoggedIn: false };
    }
    
    // Fetch events where user is an assigned scanner
    const { data: scannerAssignments, error: scannerError } = await supabase
        .from('event_scanners')
        .select('events(*, tickets(count))')
        .eq('user_id', user.id);

    if (scannerError) {
        console.error('Error fetching scannable events:', scannerError);
        return { data: [], error: 'Could not fetch assigned events.', isLoggedIn: true };
    }
    
    const assignedEvents = (scannerAssignments || [])
        .map(assignment => assignment.events)
        .filter((event): event is NonNullable<typeof event> => event !== null)
        .map(event => ({
            ...event,
            attendees: event.tickets[0]?.count || 0,
        }));


    // Fetch events where the user is the organizer
    const { data: organizedEventsData, error: organizedEventsError } = await supabase
        .from('events')
        .select('*, tickets(count)')
        .eq('organizer_id', user.id);

    if (organizedEventsError) {
        console.error('Error fetching organized events:', organizedEventsError);
        // We don't want to fail if this one errors, maybe they only have scanner perms
    }

    const organizedEvents = (organizedEventsData || []).map(event => ({
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }));

    // Combine and remove duplicates
    const allScannableEvents = [...assignedEvents, ...organizedEvents];
    const uniqueEvents = Array.from(new Map(allScannableEvents.map(event => [event.id, event])).values());


    return { data: uniqueEvents, isLoggedIn: true, error: null };
}
