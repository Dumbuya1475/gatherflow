
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createMonimeCheckout } from '@/lib/monime';

export async function POST(req: NextRequest) {
  try {
    const { eventId, userId, formResponses, firstName, lastName, email } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, price, requires_approval')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
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
                console.error("Error creating guest auth user:", createProfileError);
                return NextResponse.json({ error: 'Could not create guest user.' }, { status: 500 });
            }
            finalUserId = newProfile.user.id;

            // Also create the public profile with is_guest = true
            const { error: publicProfileError } = await supabase
                .from('profiles')
                .insert({ id: finalUserId, email, first_name: firstName, last_name: lastName, is_guest: true });
            
            if (publicProfileError) {
                console.error("Error creating guest public profile:", publicProfileError);
                return NextResponse.json({ error: 'Could not create guest profile.' }, { status: 500 });
            }
        }
    }


    // 3. Create a pending ticket record
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: finalUserId,
        status: 'pending', // Always pending until payment is confirmed
        ticket_price: event.price,
      })
      .select('id')
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket creation error:', ticketError);
      return NextResponse.json({ error: 'Failed to create a pending ticket.' }, { status: 500 });
    }

    // 4. Save form responses if any
    if (formResponses && formResponses.length > 0) {
      const responsesToInsert = formResponses.map((response: any) => ({
        ticket_id: ticket.id,
        form_field_id: response.form_field_id,
        field_value: response.field_value,
      }));
      const { error: responsesError } = await supabase
        .from('attendee_form_responses')
        .insert(responsesToInsert);
      
      if (responsesError) {
        console.error('Could not save form responses:', responsesError);
        // Don't fail the whole transaction, but log it.
      }
    }

    // 5. Create Monime checkout session
    const checkoutSession = await createMonimeCheckout({
      name: `Ticket for ${event.title}`,
      metadata: {
        ticket_id: ticket.id,
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
    
    // 6. Update ticket with checkout session ID for webhook reconciliation
    const { error: updateTicketError } = await supabase
      .from('tickets')
      .update({ monime_checkout_session_id: checkoutSession.id })
      .eq('id', ticket.id);

    if (updateTicketError) {
        console.error('Failed to update ticket with session ID:', updateTicketError);
        return NextResponse.json({ error: 'Failed to link payment session to ticket.' }, { status: 500 });
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      ticketId: ticket.id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
