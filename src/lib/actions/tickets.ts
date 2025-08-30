
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

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
     const eventRedirectPath = eventId ? `/events/${eventId}/register` : '/signup';
     redirect(eventRedirectPath);
  }

  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingTicket) {
    return redirect(`/events/${eventId}/register/success?ticketId=${existingTicket.id}`);
  }
  
  const { data: eventData } = await supabase.from('events').select('capacity, tickets(count)').eq('id', eventId).single();
  const capacity = eventData?.capacity;
  const currentRegistrations = eventData?.tickets[0]?.count || 0;

  if (capacity && currentRegistrations >= capacity) {
    return { error: 'This event has reached its maximum capacity.' };
  }
  
  const { data: ticket, error } = await supabase.from('tickets').insert({
    event_id: eventId,
    user_id: user.id,
    qr_token: crypto.randomUUID(), // Generate secure token on creation
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
  
  return redirect(`/events/${eventId}/register/success?ticketId=${ticket.id}`);
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
        event_id: eventId,
        user_id: signUpData.user.id,
        qr_token: crypto.randomUUID(), // Generate secure token on creation
    }).select('id').single();

    if (ticketError || !ticketData) {
        return { error: ticketError?.message || "You are registered as a user, but we failed to create your ticket. Please contact support." };
    }
    
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
        .select('*, events(*)')
        .eq('id', ticketId)
        .eq('user_id', user.id)
        .single();
    
    if (error || !ticket) {
        console.error('Error fetching ticket', error);
        return { data: null, error: 'Ticket not found or you do not have access.' };
    }

    return { data: ticket, error: null };
}

export async function verifyTicket(qrToken: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return { success: false, error: 'Not authenticated. Please log in.' };

    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, event_id, checked_in, user_id, events(organizer_id), profiles(first_name, last_name)')
        .eq('qr_token', qrToken)
        .single();

    if(ticketError || !ticket) {
        return { success: false, error: 'Invalid QR Code. Ticket not found.' };
    }
    
    const { data: scannerAssignment, error: scannerError } = await supabase
        .from('event_scanners')
        .select('event_id', { count: 'exact', head: true })
        .eq('event_id', ticket.event_id)
        .eq('user_id', user.id);
    
    if (scannerError) {
        console.error("Error checking scanner assignment:", scannerError);
        return { success: false, error: "Could not verify scanner permissions."};
    }

    const isOrganizer = ticket.events?.organizer_id === user.id;
    const isScanner = scannerAssignment && scannerAssignment.count > 0;

    if (!isOrganizer && !isScanner) {
        return { success: false, error: 'You are not authorized to check in tickets for this event.' };
    }

    if(ticket.checked_in) {
        const attendeeName = ticket.profiles ? `${ticket.profiles.first_name} ${ticket.profiles.last_name}` : 'attendee';
        return { success: false, error: `This ticket has already been checked in for ${attendeeName}.`, status: 'already_in' };
    }

    const { data: updateData, error: updateError } = await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id)
      .select('profiles(first_name, last_name)')
      .single();
    
    if(updateError || !updateData) {
        console.error("Failed to check in ticket:", updateError);
        return { success: false, error: 'Database error: Failed to check in ticket.' };
    }
    
    revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
    revalidatePath(`/dashboard/analytics`);

    const attendeeName = updateData.profiles ? `${updateData.profiles.first_name} ${updateData.profiles.last_name}`.trim() : 'attendee';
    return { success: true, message: `Successfully checked in ${attendeeName}.` };
}

export async function getScannableEvents() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: 'You must be logged in to view scannable events.', isLoggedIn: false };
    }
    
    // Fetch event IDs where the user is an assigned scanner
    const { data: scannerAssignments, error: scannerError } = await supabase
        .from('event_scanners')
        .select('event_id')
        .eq('user_id', user.id);

    if (scannerError) {
        console.error('Error fetching scannable event IDs:', scannerError);
        return { data: [], error: 'Could not fetch assigned events.', isLoggedIn: true };
    }
    const assignedEventIds = (scannerAssignments || []).map(a => a.event_id);

    // Fetch events where the user is the organizer
    const { data: organizedEventsData, error: organizedEventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id);

    if (organizedEventsError) {
        console.error('Error fetching organized event IDs:', organizedEventsError);
    }
    const organizedEventIds = (organizedEventsData || []).map(e => e.id);

    // Combine and deduplicate the event IDs
    const allScannableEventIds = [...new Set([...assignedEventIds, ...organizedEventIds])];

    if (allScannableEventIds.length === 0) {
        return { data: [], isLoggedIn: true, error: null };
    }
    
    // Fetch full event details for the combined list of IDs
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
