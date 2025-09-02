'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

type Ticket = {
  id: number;
  event_id: number;
  user_id: string;
  checked_in: boolean;
  checked_out: boolean;
  checked_in_at?: string;
  checked_out_at?: string;
  qr_token?: string;
  events?: {
    id: number;
    organizer_id: string;
    title?: string;
  };
};

type Profile = {
  first_name: string;
  last_name: string;
};

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
  
  // Generate QR token when creating ticket
  const qrToken = crypto.randomUUID();
  
  const { data: ticket, error } = await supabase.from('tickets').insert({
    event_id: eventId,
    user_id: user.id,
    qr_token: qrToken,
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
    
    // Generate QR token when creating ticket
    const qrToken = crypto.randomUUID();

    const { data: ticketData, error: ticketError } = await supabase.from('tickets').insert({
        event_id: eventId,
        user_id: signUpData.user.id,
        qr_token: qrToken,
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

export async function scanTicketAction(qrToken: string, eventId: number) {
  console.log('🔍 Starting scan for token:', qrToken, 'eventId:', eventId);
  
  try {
    const supabase = createClient();
    
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { success: false, error: 'Authentication failed. Please log in again.' };
    }
    if (!user) {
      console.log('❌ No user found');
      return { success: false, error: 'Not authenticated. Please log in.' };
    }
    console.log('✅ User authenticated:', user.id);

    // 2. Fetch ticket - fixed Supabase query syntax
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id, 
        event_id, 
        user_id,
        checked_in, 
        checked_out, 
        checked_in_at, 
        checked_out_at,
        qr_token,
        events!inner(
          id,
          organizer_id,
          title
        )
      `)
      .eq('qr_token', qrToken)
      .single();

    if (ticketError) {
      console.error('❌ Ticket lookup error:', ticketError.message, ticketError.code);
      
      // Handle specific error codes
      if (ticketError.code === 'PGRST116') {
        return { success: false, error: 'Invalid QR Code. Ticket not found.' };
      }
      return { success: false, error: `Database error: ${ticketError.message}` };
    }

    if (!ticket) {
      console.log('❌ No ticket found for token:', qrToken);
      return { success: false, error: 'Invalid QR Code. Ticket not found.' };
    }

    console.log('✅ Ticket found:', {
      id: ticket.id,
      eventId: ticket.event_id,
      userId: ticket.user_id,
      checkedIn: ticket.checked_in,
      checkedOut: ticket.checked_out
    });

    // 3. Verify event match
    if (ticket.event_id !== eventId) {
      console.log('❌ Event mismatch. Ticket event:', ticket.event_id, 'Expected:', eventId);
      return { success: false, error: 'This ticket is not for this event.' };
    }

    // 4. Check permissions - simplified and more robust
    const isOrganizer = ticket.events?.organizer_id === user.id;
    console.log('🔒 Permission check - Is organizer:', isOrganizer);
    
    let isScanner = false;
    if (!isOrganizer) {
      const { data: scannerData, error: scannerError } = await supabase
        .from('event_scanners')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (scannerError) {
        console.error('❌ Scanner check error:', scannerError);
        return { success: false, error: 'Permission verification failed.' };
      }
      
      isScanner = !!scannerData;
      console.log('🔒 Permission check - Is scanner:', isScanner);
    }

    if (!isOrganizer && !isScanner) {
      console.log('❌ Permission denied for user:', user.id);
      return { success: false, error: 'You are not authorized to scan tickets for this event.' };
    }

    // 5. Determine scan action
    let updateData: any = {};
    let message = '';
    const now = new Date().toISOString();

    if (!ticket.checked_in) {
      // First scan → check-in
      updateData = { 
        checked_in: true, 
        checked_in_at: now 
      };
      message = 'Ticket successfully checked in.';
      console.log('📥 Checking in ticket');
    } else if (!ticket.checked_out) {
      // Second scan → check-out
      updateData = { 
        checked_out: true, 
        checked_out_at: now 
      };
      message = 'Ticket successfully checked out.';
      console.log('📤 Checking out ticket');
    } else {
      // Already processed
      console.log('⚠️ Ticket already processed');
      return { 
        success: false, 
        error: 'This ticket has already been checked in and out.',
        details: {
          checkedInAt: ticket.checked_in_at,
          checkedOutAt: ticket.checked_out_at
        }
      };
    }

    // 6. Update ticket in database
    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticket.id);

    if (updateError) {
      console.error('❌ Failed to update ticket:', updateError);
      return { 
        success: false, 
        error: `Failed to update ticket: ${updateError.message}` 
      };
    }

    console.log('✅ Ticket updated successfully');

    // 7. Fetch attendee profile for display
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', ticket.user_id)
      .single();

    if (profileError) {
      console.warn('⚠️ Could not fetch attendee profile:', profileError.message);
    }

    // 8. Revalidate cache paths
    try {
      revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
      revalidatePath(`/dashboard/analytics`);
      console.log('✅ Cache revalidated');
    } catch (revalidateError) {
      console.warn('⚠️ Cache revalidation failed:', revalidateError);
      // Don't fail the operation for this
    }

    // 9. Return success response
    const attendeeName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
      : 'Unknown attendee';
    
    const finalMessage = attendeeName !== 'Unknown attendee' 
      ? `${message} (${attendeeName})` 
      : message;

    console.log('✅ Scan completed successfully:', finalMessage);
    
    return { 
      success: true, 
      message: finalMessage,
      ticketId: ticket.id,
      attendeeName,
      action: ticket.checked_in ? 'check-out' : 'check-in'
    };

  } catch (error) {
    console.error('💥 Unexpected error during scan:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('invalid input syntax for type uuid')) {
        return { success: false, error: 'Invalid QR Code format.' };
      }
      if (error.message.includes('JWT')) {
        return { success: false, error: 'Session expired. Please log in again.' };
      }
      return { success: false, error: `Scan failed: ${error.message}` };
    }
    
    return { success: false, error: 'An unexpected error occurred during scanning.' };
  }
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