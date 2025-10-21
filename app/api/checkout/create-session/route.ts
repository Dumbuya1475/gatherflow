
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createMonimeCheckout } from '@/lib/monime';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const { eventId, userId, formResponses, firstName, lastName, email } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // 1. Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, price, requires_approval, fee_bearer')
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
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', finalUserId)
      .maybeSingle();

    if (findTicketError) {
      console.error('Checkout Error: Error finding existing ticket.', findTicketError);
      return NextResponse.json({ error: 'Database error while checking for ticket.' }, { status: 500 });
    }

    if (existingTicket) {
      ticketId = existingTicket.id;
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
        return NextResponse.json({ error: 'Failed to create an unpaid ticket.' }, { status: 500 });
      }
      ticketId = newTicket.id;
      
      // Save form responses only when creating a new ticket
      if (formResponses && formResponses.length > 0) {
        const responsesToInsert = formResponses.map((response: any) => ({
          ticket_id: ticketId,
          form_field_id: response.form_field_id,
          field_value: response.field_value,
        }));
        const { error: responsesError } = await supabase
          .from('attendee_form_responses')
          .insert(responsesToInsert);
        
        if (responsesError) {
          console.error('Checkout Warning: Could not save form responses.', responsesError);
          // Don't fail the whole transaction, but log it.
        }
      }
    }

    // 4. Create Monime checkout session
    const checkoutSession = await createMonimeCheckout({
      name: `Ticket for ${event.title}`,
      metadata: {
        ticket_id: ticketId,
        event_id: eventId,
        user_id: finalUserId,
      },
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
  } catch (error: any) {
    console.error('Checkout Error: Unhandled exception in POST handler.', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
    