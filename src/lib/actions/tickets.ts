'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const QrTokenSchema = z.object({
    ticketId: z.number(),
    eventId: z.number(),
    userId: z.string(),
});


async function assignQrCodeToTicket(ticketId: number, eventId: number, userId: string) {
    const supabase = createClient();
    const qrCodeToken = JSON.stringify({ ticketId, eventId, userId });

    const { error } = await supabase
        .from('tickets')
        .update({ qr_code_token: qrCodeToken })
        .eq('id', ticketId);

    if (error) {
        console.error('Error assigning QR code to ticket:', error);
        throw new Error('Could not assign QR code to the ticket.');
    }
}


export async function registerForEventAction(
  prevState: { error: string | undefined } | undefined,
  formData: FormData
) {
  const supabase = createClient();
  const eventIdStr = formData.get('eventId') as string;
  const eventId = parseInt(eventIdStr, 10);


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
    event_id: eventId,
    user_id: user.id,
  }).select('id').single();

  if (error || !ticket) {
    console.error('Error registering for event:', error);
    return { error: 'Could not register for the event.' };
  }

  try {
    await assignQrCodeToTicket(ticket.id, eventId, user.id);
  } catch (e) {
    return { error: (e as Error).message };
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
    const eventIdStr = formData.get('eventId') as string;
    const eventId = parseInt(eventIdStr, 10);
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
    }).select('id').single();

    if (ticketError || !ticketData) {
        return { error: ticketError?.message || "You are registered as a user, but we failed to create your ticket. Please contact support." };
    }

    try {
        await assignQrCodeToTicket(ticketData.id, eventId, signUpData.user.id);
    } catch (e) {
        return { error: `User created, but failed to finalize ticket: ${(e as Error).message}` };
    }
    
    redirect(`/events/${eventId}/register/success?ticketId=${ticketData.id}`);
}


export async function getTicketDetails(ticketId: string) {
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

export async function verifyTicket(qrToken: string, scannerEventId: number) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return { success: false, error: 'Not authenticated' };

    let payload;
    try {
        const parsedJson = JSON.parse(qrToken);
        const validationResult = QrTokenSchema.safeParse(parsedJson);
        if (!validationResult.success) {
            console.error("QR Code validation error:", validationResult.error.flatten());
            return { success: false, error: 'Invalid QR code data structure.' };
        }
        payload = validationResult.data;
    } catch (error) {
        console.error("QR Code parsing error:", error);
        return { success: false, error: 'Invalid or malformed QR Code.' };
    }
    
    const { ticketId, eventId } = payload;

    if (eventId !== scannerEventId) {
      return { success: false, error: 'This ticket is for a different event.' };
    }

    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, event_id, checked_in, user_id, events(organizer_id), profiles(first_name, last_name)')
        .eq('id', ticketId)
        .single();

    if(ticketError || !ticket) {
        return { success: false, error: 'Invalid Ticket ID found in QR Code.' };
    }
    
    const { data: scannerAssignment } = await supabase
        .from('event_scanners')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', ticket.event_id)
        .eq('user_id', user.id);

    const isOrganizer = ticket.events?.organizer_id === user.id;
    const isScanner = scannerAssignment && scannerAssignment.count > 0;

    if (!isOrganizer && !isScanner) {
        return { success: false, error: 'You are not authorized to check in tickets for this event.' };
    }

    if(ticket.checked_in) {
        const attendeeName = ticket.profiles ? `${ticket.profiles.first_name} ${ticket.profiles.last_name}` : 'attendee';
        return { success: false, error: `This ticket has already been checked in for ${attendeeName}.` };
    }

    const { data: updateData, error: updateError } = await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id)
      .select('profiles(first_name, last_name)')
      .single();
    
    if(updateError || !updateData) {
        console.error("Failed to check in ticket:", updateError);
        return { success: false, error: 'Failed to check in ticket.' };
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
        .filter((event): event is NonNullable<typeof event> => event !== null && new Date(event.date) >= new Date(new Date().setDate(new Date().getDate() -1))) // show events from yesterday onwards
        .map(event => ({
            ...event,
            attendees: event.tickets[0]?.count || 0,
        }));


    const { data: organizedEventsData, error: organizedEventsError } = await supabase
        .from('events')
        .select('*, tickets(count)')
        .eq('organizer_id', user.id)
        .gt('date', new Date(new Date().setDate(new Date().getDate() -1)).toISOString()); // show events from yesterday onwards


    if (organizedEventsError) {
        console.error('Error fetching organized events:', organizedEventsError);
    }

    const organizedEvents = (organizedEventsData || []).map(event => ({
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }));

    const allScannableEvents = [...assignedEvents, ...organizedEvents];
    const uniqueEvents = Array.from(new Map(allScannableEvents.map(event => [event.id, event])).values());


    return { data: uniqueEvents, isLoggedIn: true, error: null };
}
