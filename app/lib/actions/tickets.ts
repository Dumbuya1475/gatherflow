'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEventFormFields } from './events';
import { sendTicketEmail } from './email';

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

// Updated ticket registration functions with proper QR workflow

export async function registerForEventAction(
  prevState: { error?: string; success?: boolean; ticketId?: number; } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const eventId = parseInt(formData.get('eventId') as string, 10);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
     redirect(`/events/${eventId}/register`);
  }

  // Check for a profile and create one if it doesn't exist
  const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

  if (!profile) {
      const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({ id: user.id, email: user.email });
      if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          return { error: 'Could not create user profile.' };
      }
  }

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('capacity, requires_approval, title')
    .eq('id', eventId)
    .single();

  if(eventError || !eventData) {
    return { error: 'This event could not be found.' };
  }

  const capacity = eventData.capacity;

  if (capacity !== null) {
    const supabaseAdmin = await createServiceRoleClient();
    const { count, error: countError } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['approved', 'pending']);

    if (countError) {
        console.error('Error counting tickets:', countError);
        return { error: 'Could not verify event capacity.' };
    }

    const currentAttendees = count || 0;
    if (currentAttendees >= capacity) {
        return { error: 'This event has reached its maximum capacity.' };
    }
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
  
  const initialStatus = eventData.requires_approval ? 'pending' : 'approved';
  
  // Create ticket data - QR token will be handled by trigger if approved
  const ticketData: any = {
    event_id: eventId,
    user_id: user.id,
    status: initialStatus,
  };

  // Only generate QR token for automatically approved tickets
  if (initialStatus === 'approved') {
    ticketData.qr_token = crypto.randomUUID();
  }
  // For pending tickets, qr_token will be NULL

  const { data: ticket, error } = await supabase.from('tickets').insert(ticketData).select('id').single();

  if (error || !ticket) {
    console.error('Error registering for event:', error);
    return { error: 'Could not register for the event.' };
  }

  if (initialStatus === 'approved') {
    await sendTicketEmail(
      user.email!,
      `Your ticket for ${eventData.title}`,
      `<h1>Here is your ticket</h1><p>QR Code: ${ticketData.qr_token}</p>`
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/events');
  revalidatePath(`/dashboard/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events`);
  
  return { success: true, ticketId: ticket.id };
}

export async function registerAndCreateTicket(
    prevState: { error: string | undefined } | undefined,
    formData: FormData
) {
    const supabase = await createClient();
    const eventId = parseInt(formData.get('eventId') as string, 10);
    const userId = formData.get('userId') as string | null;

    // Fetch custom form fields and validate them
    const { data: formFields } = await getEventFormFields(eventId);
    for (const field of formFields) {
      if (field.is_required && !formData.get(`custom_field_${field.id}`)) {
        return { error: `${field.field_name} is required.` };
      }
    }

    let finalUserId = userId;
    let userEmail = '';

    if (!userId) {
        const email = formData.get('email') as string;
        userEmail = email;
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
        finalUserId = signUpData.user.id;
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        userEmail = user?.email || '';
    }

    if (!finalUserId) {
        return { error: "Could not determine user." };
    }
    
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('requires_approval, capacity, title')
        .eq('id', eventId)
        .single();

    if (eventError || !eventData) {
        return { error: "Could not find the specified event." };
    }

    const capacity = eventData.capacity;

    if (capacity !== null) {
        const supabaseAdmin = await createServiceRoleClient();
        const { count, error: countError } = await supabaseAdmin
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .in('status', ['approved', 'pending']);

        if (countError) {
            console.error('Error counting tickets:', countError);
            return { error: 'Could not verify event capacity.' };
        }

        const currentAttendees = count || 0;
        if (currentAttendees >= capacity) {
            return { error: 'This event has reached its maximum capacity.' };
        }
    }

    const initialStatus = eventData.requires_approval ? 'pending' : 'approved';
    
    // Create ticket data - QR token will be handled by trigger if approved
    const ticketData: any = {
        event_id: eventId,
        user_id: finalUserId,
        status: initialStatus,
    };

    // Only generate QR token for automatically approved tickets
    if (initialStatus === 'approved') {
        ticketData.qr_token = crypto.randomUUID();
    }
    // For pending tickets, qr_token will be NULL

    const { data: ticketResult, error: ticketError } = await supabase.from('tickets').insert(ticketData).select('id').single();

    if (ticketError || !ticketResult) {
        return { error: ticketError?.message || "You are registered as a user, but we failed to create your ticket. Please contact support." };
    }

    if (initialStatus === 'approved') {
        await sendTicketEmail(
            userEmail,
            `Your ticket for ${eventData.title}`,
            `<h1>Here is your ticket</h1><p>QR Code: ${ticketData.qr_token}</p>`
        );
    }

    // Save custom form responses
    if (formFields.length > 0) {
      const responsesToInsert = formFields.map(field => ({
        ticket_id: ticketResult.id,
        form_field_id: field.id,
        field_value: formData.get(`custom_field_${field.id}`) as string,
      }));

      const { error: responsesError } = await supabase
        .from('attendee_form_responses')
        .insert(responsesToInsert);

      if (responsesError) {
        console.error('Error inserting form responses:', responsesError);
        // Don't fail the whole action, just log the error
      }
    }
    
    revalidatePath(`/dashboard/events`);
    revalidatePath(`/events`);

    if (initialStatus === 'pending') {
        redirect(`/events/${eventId}/register/pending`);
    } else {
        redirect(`/events/${eventId}/register/success?ticketId=${ticketResult.id}`);
    }
}

export async function rejectAttendeeAction(formData: FormData) {
  const supabase = await createClient();
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

  // Update status to rejected - the trigger will automatically remove QR token
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ status: 'rejected' })
    .eq('id', parseInt(ticketId, 10));
  
  if (updateError) {
    console.error('Error rejecting attendee:', updateError);
    throw new Error('Could not reject the attendee.');
  }

  revalidatePath(`/dashboard/events/${eventId}/manage`);
  revalidatePath(`/dashboard/analytics`);
  redirect(`/dashboard/events/${eventId}/manage`);
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

export async function getTicketDetails(ticketId: number) {
    const supabase = createClient();

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, checked_in_at, checked_out_at, status, events(*, tickets(count)), profiles(email, first_name, last_name, is_guest)')
        .eq('id', ticketId)
        .single();
    
    if (error || !ticket) {
        console.error('Error fetching ticket', error);
        return { data: null, error: 'Ticket not found.' };
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
  try {
    const supabase = createClient();
    
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return { success: false, error: 'Authentication failed. Please log in again.' };
    }
    if (!user) {
      return { success: false, error: 'Not authenticated. Please log in.' };
    }

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
        status,
        events!inner(
          id,
          organizer_id,
          title
        )
      `)
      .eq('qr_token', qrToken)
      .single();

    if (ticketError) {
      // Handle specific error codes
      if (ticketError.code === 'PGRST116') {
        return { success: false, error: 'Invalid QR Code. Ticket not found.' };
      }
      return { success: false, error: `Database error: ${ticketError.message}` };
    }

    if (!ticket) {
      return { success: false, error: 'Invalid QR Code. Ticket not found.' };
    }

    // 3. Verify event match
    if (ticket.event_id !== eventId) {
      return { success: false, error: 'This ticket is not for this event.' };
    }

    if (ticket.status === 'pending') {
      return { success: false, error: 'This ticket has not been approved yet.' };
    }

    if (ticket.status === 'rejected') {
      return { success: false, error: 'This ticket has been rejected.' };
    }

    // 4. Check permissions - simplified and more robust
    const isOrganizer = ticket.events?.organizer_id === user.id;
    
    let isScanner = false;
    if (!isOrganizer) {
      const { data: scannerData, error: scannerError } = await supabase
        .from('event_scanners')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (scannerError) {
        return { success: false, error: 'Permission verification failed.' };
      }
      
      isScanner = !!scannerData;
    }

    if (!isOrganizer && !isScanner) {
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
    } else if (!ticket.checked_out) {
      // Second scan → check-out
      updateData = { 
        checked_out: true, 
        checked_out_at: now 
      };
      message = 'Ticket successfully checked out.';
    } else {
      // Already processed
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
      return { 
        success: false, 
        error: `Failed to update ticket: ${updateError.message}` 
      };
    }

    // 7. Fetch attendee profile for display
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', ticket.user_id)
      .single();

    // 8. Revalidate cache paths
    try {
      revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
      revalidatePath(`/dashboard/analytics`);
    } catch (revalidateError) {
      // Don't fail the operation for this
    }

    // 9. Return success response
    const attendeeName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
      : 'Unknown attendee';
    
    const finalMessage = attendeeName !== 'Unknown attendee' 
      ? `${message} (${attendeeName})` 
      : message;
    
    return { 
      success: true, 
      message: finalMessage,
      ticketId: ticket.id,
      attendeeName,
      action: ticket.checked_in ? 'check-out' : 'check-in'
    };

  } catch (error) {
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

export async function approveAttendeeAction(formData: FormData) {
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

  const { error: updateError } = await supabase
    .from('tickets')
    .update({ status: 'approved', qr_token: crypto.randomUUID() })
    .eq('id', parseInt(ticketId, 10));
  
  if (updateError) {
    console.error('Error approving attendee:', updateError);
    throw new Error('Could not approve the attendee.');
  }

  revalidatePath(`/dashboard/events/${eventId}/manage`);
  revalidatePath(`/dashboard/analytics`);
  redirect(`/dashboard/events/${eventId}/manage`);
}

export async function registerGuestForEvent(
  prevState: { error?: string; success?: boolean; ticketId?: number } | undefined,
  formData: FormData
) {
  const supabase = await createServiceRoleClient();
  const eventId = parseInt(formData.get('eventId') as string, 10);
  const email = formData.get('email') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  if (!email || !firstName || !lastName) {
    return { error: 'Please provide your full name and email address.' };
  }

  let profile;
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id, is_guest')
    .eq('email', email)
    .single();

  if (existingProfileError && existingProfileError.code !== 'PGRST116') {
    console.error('Error checking for existing profile:', existingProfileError);
    return { error: 'An error occurred. Please try again.' };
  }

  if (existingProfile) {
    profile = existingProfile;
  } else {
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        is_guest: true,
      })
      .select('id, is_guest')
      .single();

    if (createProfileError) {
      console.error('Error creating guest profile:', createProfileError);
      return { error: 'Could not create a guest profile.' };
    }
    profile = newProfile;
  }

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('capacity, requires_approval, title')
    .eq('id', eventId)
    .single();

  if (eventError || !eventData) {
    return { error: 'This event could not be found.' };
  }

  const capacity = eventData.capacity;

  if (capacity !== null) {
    const { count, error: countError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['approved', 'pending']);

    if (countError) {
      console.error('Error counting tickets:', countError);
      return { error: 'Could not verify event capacity.' };
    }

    const currentAttendees = count || 0;
    if (currentAttendees >= capacity) {
      return { error: 'This event has reached its maximum capacity.' };
    }
  }

  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (existingTicket) {
    return { error: 'You are already registered for this event.' };
  }

  const initialStatus = eventData.requires_approval ? 'pending' : 'approved';
  
  const ticketData: any = {
    event_id: eventId,
    user_id: profile.id,
    status: initialStatus,
  };

  if (initialStatus === 'approved') {
    ticketData.qr_token = crypto.randomUUID();
  }

  const { data: ticket, error } = await supabase.from('tickets').insert(ticketData).select('id').single();

  if (error || !ticket) {
    console.error('Error registering for event:', error);
    return { error: 'Could not register for the event.' };
  }

  if (initialStatus === 'approved') {
    const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/view?ticketId=${ticket.id}&email=${email}`;
    await sendTicketEmail(
      email,
      `Your ticket for ${eventData.title}`,
      `<h1>Here is your ticket</h1><p>You can view your ticket and QR code here: <a href="${ticketUrl}">${ticketUrl}</a></p>`
    );
  }

  revalidatePath(`/events/${eventId}`);

  if (initialStatus === 'pending') {
    redirect(`/events/${eventId}/register/pending`);
  } else {
    redirect(`/tickets/view?ticketId=${ticket.id}&email=${email}`);
  }
}