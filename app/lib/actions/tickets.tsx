
'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEventFormFields } from '@/lib/server/queries/events';
import { sendTicketEmail } from './email';

type TicketData = {
  event_id: number;
  user_id: string;
  status: string;
  qr_token?: string;
};

// This action is now only for FREE events. Paid events are handled by the API route.
export async function registerAndCreateTicket(
    prevState: { error: string | undefined } | undefined,
    formData: FormData
) {
    const supabase = await createClient();
    const eventId = parseInt(formData.get('eventId') as string, 10);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
       return { error: "You must be logged in to register." };
    }

    // Check for a profile and create one if it doesn't exist
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({ id: user.id, email: user.email });
        if (createProfileError) {
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

    if (eventData.capacity !== null) {
      const { count, error: countError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .in('status', ['approved', 'pending']);

      if (countError) {
          return { error: 'Could not verify event capacity.' };
      }

      if ((count || 0) >= eventData.capacity) {
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
      redirect(`/dashboard/tickets/${existingTicket.id}`);
    }
    
    const initialStatus = eventData.requires_approval ? 'pending' : 'approved';
    
    const ticketData: any = {
      event_id: eventId,
      user_id: user.id,
      status: initialStatus,
    };

    if (initialStatus === 'approved') {
      ticketData.qr_token = crypto.randomUUID();
    }

    const { data: ticket, error } = await supabase.from('tickets').insert(ticketData).select('id').single();

    if (error || !ticket) {
      return { error: error?.message || 'Could not register for the event.' };
    }

    // Save custom form responses
    const { data: formFields } = await getEventFormFields(eventId);
    if (formFields && formFields.length > 0) {
      const responsesToInsert = formFields.map(field => ({
        ticket_id: ticket.id,
        form_field_id: field.id,
        field_value: formData.get(`custom_field_${field.id}`) as string,
      })).filter(response => response.field_value); // Filter out empty responses

      if(responsesToInsert.length > 0) {
          const { error: responsesError } = await supabase
            .from('attendee_form_responses')
            .insert(responsesToInsert);

          if (responsesError) {
            console.error('Error inserting form responses:', responsesError);
          }
      }
    }

    if (initialStatus === 'approved') {
      const { data: ticketDetails } = await getTicketDetails(ticket.id);
      if (ticketDetails) {
        const { TicketEmail } = await import('@/components/emails/ticket-email');
        await sendTicketEmail(
          user.email!,
          `Your ticket for ${eventData.title}`,
          <TicketEmail ticket={ticketDetails} />
        );
      }
    }
    
    revalidatePath('/dashboard');
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/manage`);

    if (initialStatus === 'pending') {
      redirect(`/events/${eventId}/register/pending`);
    } else {
      redirect(`/events/${eventId}/register/success?ticketId=${ticket.id}`);
    }
}


export async function registerGuestForEvent(
  prevState: { error?: string; success?: boolean; ticketId?: number } | undefined,
  formData: FormData
) {
  const supabase = createServiceRoleClient();
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
    return { error: 'An error occurred. Please try again.' };
  }

  if (existingProfile) {
    profile = existingProfile;
  } else {
    // Create an auth user first for the guest
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: email,
        password: crypto.randomUUID(), // Assign a secure, random password
        email_confirm: true, // Auto-confirm guests
        user_metadata: { first_name: firstName, last_name: lastName }
    });
    
    if (createAuthError || !newAuthUser.user) {
        console.error("Error creating guest auth user:", createAuthError);
        return { error: 'Could not create guest user.' };
    }

    // Then create the public profile
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: newAuthUser.user.id,
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
  
  if (eventData.capacity !== null) {
    const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['approved', 'pending']);
    if ((count || 0) >= eventData.capacity) {
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
     return redirect(`/tickets/view/${existingTicket.id}`);
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
    return { error: error?.message || 'Could not register for the event.' };
  }
  
  // Save custom form responses
  const { data: formFields } = await getEventFormFields(eventId);
  if (formFields && formFields.length > 0) {
      const responsesToInsert = formFields.map(field => ({
        ticket_id: ticket.id,
        form_field_id: field.id,
        field_value: formData.get(`custom_field_${field.id}`) as string,
      })).filter(response => response.field_value);
      if (responsesToInsert.length > 0) {
        await supabase.from('attendee_form_responses').insert(responsesToInsert);
      }
  }

  if (initialStatus === 'approved') {
    const { data: ticketDetails } = await getTicketDetails(ticket.id);
    if (ticketDetails) {
      const { TicketEmail } = await import('@/components/emails/ticket-email');
      await sendTicketEmail(
        email,
        `Your ticket for ${eventData.title}`,
        <TicketEmail ticket={ticketDetails} />
      );
    }
  }

  revalidatePath(`/events/${eventId}`);
  if (initialStatus === 'pending') {
    redirect(`/events/${eventId}/register/pending`);
  } else {
    // For guests, we can't redirect to a dashboard.
    // A special view page is better.
    redirect(`/tickets/view/${ticket.id}`);
  }
}

// Other functions remain unchanged...

export async function getTicketDetails(ticketId: number) {
    const supabase = createClient();

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, checked_in_at, checked_out_at, status, events(*, tickets(count)), profiles(id, email, first_name, last_name, is_guest)')
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

    const { data: formResponses, error: formResponsesError } = await supabase
        .from('attendee_form_responses')
        .select('field_value, event_form_fields(field_name)')
        .eq('ticket_id', ticket.id);

    if (formResponsesError) {
        console.error("Error fetching form responses for ticket", formResponsesError);
    }

    const ticketWithOrganizer = {
        ...ticket,
        events: {
            ...ticket.events!,
            attendees: ticket.events!.tickets[0]?.count || 0,
            organizer: organizerProfile,
        },
        form_responses: formResponses || [],
    }

    return { data: ticketWithOrganizer, error: null };
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
    throw new Error('Could not approve the attendee.');
  }

  revalidatePath(`/dashboard/events/${eventId}/manage`);
  revalidatePath(`/dashboard/analytics`);
  redirect(`/dashboard/events/${eventId}/manage`);
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


export async function scanTicketAction(qrToken: string, eventId: number) {
  try {
    const supabase = createClient();
    
    // 1. Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated. Please log in.' };
    }

    // 2. Fetch ticket - fixed Supabase query syntax
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id, event_id, user_id, checked_in, checked_out, checked_in_at, 
        checked_out_at, qr_token, status,
        events!inner(id, organizer_id, title)
      `)
      .eq('qr_token', qrToken)
      .single();

    if (ticketError || !ticket) {
      return { success: false, error: 'Invalid QR Code. Ticket not found.' };
    }

    // 3. Verify event match
    if (ticket.event_id !== eventId) {
      return { success: false, error: 'This ticket is not for this event.' };
    }

    if (ticket.status !== 'approved') {
      return { success: false, error: `Ticket status is '${ticket.status}', not 'approved'.` };
    }

    // 4. Check permissions
    const isOrganizer = ticket.events?.organizer_id === user.id;
    let isScanner = false;
    if (!isOrganizer) {
      const { data: scannerData } = await supabase
        .from('event_scanners')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
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
      updateData = { checked_in: true, checked_in_at: now };
      message = 'Ticket successfully checked in.';
    } else if (!ticket.checked_out) {
      updateData = { checked_out: true, checked_out_at: now };
      message = 'Ticket successfully checked out.';
    } else {
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
      return { success: false, error: `Failed to update ticket: ${updateError.message}` };
    }

    // 7. Fetch attendee profile for display
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', ticket.user_id)
      .single();

    revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);
    revalidatePath(`/dashboard/analytics`);

    const attendeeName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown attendee';
    
    return { success: true, message: `${message} (${attendeeName})` };

  } catch (error) {
    if (error instanceof Error) {
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
        return { data: [], error: 'Could not fetch assigned events.', isLoggedIn: true };
    }
    const assignedEventIds = (scannerAssignments || []).map(a => a.event_id);

    const { data: organizedEventsData, error: organizedEventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id);

    if (organizedEventsError) {
      // Don't fail if this errors, just log it
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
        return { data: [], error: 'Could not fetch event details.', isLoggedIn: true };
    }

    const uniqueEvents = (events || []).map(event => ({
        ...event,
        attendees: event.tickets[0]?.count || 0,
    }));

    return { data: uniqueEvents, isLoggedIn: true, error: null };
}

export async function resendTicketLinkAction(
    prevState: { error?: string; success?: boolean; } | undefined,
    formData: FormData
) {
    const supabase = createClient();
    const eventId = parseInt(formData.get('eventId') as string, 10);
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'Please provide an email address.' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
    if (profileError || !profile) {
        return { success: true }; // Don't reveal if an email is registered or not
    }

    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, events(title)')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .single();

    if (ticketError || !ticket) {
        return { success: true };
    }
    
    const { data: ticketDetails } = await getTicketDetails(ticket.id);

    if (ticketDetails) {
        const { TicketEmail } = await import('@/components/emails/ticket-email');
        await sendTicketEmail(
            email,
            `Your ticket for ${ticket.events?.title}`,
            <TicketEmail ticket={ticketDetails} />
        );
    }
    
    return { success: true };
}
