
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createMonimeCheckout } from '@@/lib/monime';


export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);

    const { eventId, userId, formResponses, firstName, lastName, email } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // 1. Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, description, price, requires_approval, fee_bearer')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Checkout Error: Event not found.', eventError);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Create or find the user profile. This is crucial for guest checkouts.
    let finalUserId = userId;
    if (!finalUserId) {
        if (!email || !firstName || !lastName) {
            return NextResponse.json({ error: 'Name and email are required for guest checkout' }, { status: 400 });
        }
        
        const { data: existingProfile, error: profileFindError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        
        if (profileFindError && profileFindError.code !== 'PGRST116') { // Ignore "not found" error
             console.error("Checkout Error: Database error finding profile.", profileFindError);
             return NextResponse.json({ error: 'Database error finding profile.' }, { status: 500 });
        }

        if (existingProfile) {
            finalUserId = existingProfile.id;
        } else {
             const { data: newProfile, error: createProfileError } = await supabase.auth.admin.createUser({
                email: email,
                password: crypto.randomUUID(), // Secure random password for guest
                email_confirm: true, // Auto-confirm guest accounts
                user_metadata: { first_name: firstName, last_name: lastName }
            });

            if (createProfileError || !newProfile.user) {
                console.error("Checkout Error: Could not create guest auth user.", createProfileError);
                return NextResponse.json({ error: 'Could not create guest user.' }, { status: 500 });
            }
            finalUserId = newProfile.user.id;

            // Also create the public profile with is_guest = true
            const { error: publicProfileError } = await supabase
                .from('profiles')
                .insert({ id: finalUserId, email, first_name: firstName, last_name: lastName, is_guest: true });
            
            if (publicProfileError) {
                console.error("Checkout Error: Could not create guest public profile.", publicProfileError);
                // Don't fail the whole transaction, but log it. We can proceed.
            }
        }
    }

    // 3. Find an existing ticket or create a new unpaid one
    let ticketId: number;

    const { data: existingTicket, error: findTicketError } = await supabase
      .from('tickets')
      .select('id, status, monime_checkout_session_id')
      .eq('event_id', eventId)
      .eq('user_id', finalUserId)
      .maybeSingle();

    if (findTicketError) {
      console.error('Checkout Error: Error finding existing ticket.', findTicketError);
      return NextResponse.json({ error: 'Database error while checking for ticket.' }, { status: 500 });
    }

    if (existingTicket) {
      ticketId = existingTicket.id;
      
      // If ticket exists but is unpaid, clear the old checkout session
      // This allows creating a new checkout (avoids 409 Idempotency error)
      if (existingTicket.status === 'unpaid' && existingTicket.monime_checkout_session_id) {
        const { error: clearError } = await supabase
          .from('tickets')
          .update({ monime_checkout_session_id: null })
          .eq('id', ticketId);
        
        if (clearError) {
          console.error('Failed to clear old checkout session:', clearError);
        }
      }
    } else {
      const { data: newTicket, error: createTicketError } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          user_id: finalUserId,
          status: 'unpaid', // Use 'unpaid' for tickets awaiting payment
          ticket_price: event.price,
          fee_bearer: event.fee_bearer,
        })
        .select('id')
        .single();

      if (createTicketError || !newTicket) {
        console.error('Checkout Error: Failed to create an unpaid ticket.', createTicketError);
        return NextResponse.json({ error: `Failed to create an unpaid ticket: ${createTicketError.message}` }, { status: 500 });
      }
      ticketId = newTicket.id;
      
      // Save form responses only when creating a new ticket
      if (formResponses && formResponses.length > 0) {
        const responsesToInsert = formResponses.map((response: { form_field_id: string; field_value: string }) => ({
          ticket_id: ticketId,
          form_field_id: response.form_field_id,
          field_value: response.field_value,
        }));
        const { error: responsesError } = await supabase
          .from('attendee_form_responses')
          .insert(responsesToInsert);
        
        if (responsesError) {
          console.error('Checkout Warning: Could not save form responses.', responsesError);
        }
      }
    }
    
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // Monime POSTs to these URLs, so they must be API routes
    const successUrl = `${appUrl}/api/payment/success?ticketId=${ticketId}&eventId=${eventId}`;
    const cancelUrl = `${appUrl}/api/payment/cancel?ticketId=${ticketId}&eventId=${eventId}`;

    if (event.price === null || event.price === undefined || isNaN(event.price) || event.price <= 0) {
      console.error('Checkout Error: Paid event has invalid price.', event.price);
      return NextResponse.json({ error: 'Paid event has an invalid price configuration.' }, { status: 400 });
    }

    // 4. Create Monime checkout session
    const checkoutSession = await createMonimeCheckout({
      name: `Ticket for ${event.title}`,
      lineItems: [
        {
          name: event.title,
          price: {
            currency: 'SLE',
            value: Math.round(event.price! * 100),
          },
          quantity: 1,
        },
      ],
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      metadata: {
        ticketId: ticketId.toString(),
        userId: finalUserId,
        eventId: eventId.toString(),
      }
    });
    
    // 5. Update ticket with checkout session ID for webhook reconciliation
    const { error: updateTicketError } = await supabase
      .from('tickets')
      .update({ monime_checkout_session_id: checkoutSession.id })
      .eq('id', ticketId);

    if (updateTicketError) {
        console.error('Checkout Error: Failed to update ticket with session ID.', updateTicketError);
        // This is a critical error, as we can't reconcile the payment later.
        return NextResponse.json({ error: 'Failed to link payment session to ticket.' }, { status: 500 });
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      ticketId: ticketId,
    });
  } catch (error: unknown) {
    console.error('Checkout Error: Unhandled exception in POST handler.', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

