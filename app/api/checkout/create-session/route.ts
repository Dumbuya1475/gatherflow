import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateEarlyBirdPricing } from '@/lib/pricing';
import { generateQRCode } from '@/lib/qrcode';
import { createMonimeCheckout } from '@/lib/monime';

export async function POST(req: NextRequest) {
  try {
    const { eventId, userId } = await req.json();

    // 1. Get event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is published
    if (event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event is not available for purchase' },
        { status: 400 }
      );
    }

    // 2. Count actual tickets sold (paid only)
    const { count: ticketsSold } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('monime_payment_status', 'paid');

    const currentTicketsSold = ticketsSold || 0;

    // Check if sold out
    if (currentTicketsSold >= event.max_attendees) {
      return NextResponse.json(
        { error: 'Event is sold out' },
        { status: 400 }
      );
    }

    const ticketNumber = currentTicketsSold + 1;

    // 3. Calculate pricing
    const pricing = calculateEarlyBirdPricing(
      event.ticket_price,
      currentTicketsSold,
      event.fee_model
    );

    // 4. Create ticket record
    const qrCode = generateQRCode();

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_number: ticketNumber,
        ticket_price: event.ticket_price,
        pricing_tier: pricing.tier,
        tier_discount: pricing.discount,
        platform_fee: pricing.platformFee,
        platform_fee_percentage: pricing.percentage,
        amount_paid: pricing.buyerPays,
        organizer_amount: pricing.organizerGets,
        buyer_saved: pricing.saved,
        qr_code: qrCode,
        monime_payment_status: 'pending'
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // 5. Create Monime checkout session
    const checkoutSession = await createMonimeCheckout({
      amount: pricing.buyerPays,
      currency: 'SLE',
      metadata: {
        ticket_id: ticket.id,
        event_id: eventId,
        user_id: userId,
        tier: pricing.tier,
        ticket_number: ticketNumber
      }
    });

    // 6. Update ticket with checkout session ID
    await supabaseAdmin
      .from('tickets')
      .update({ monime_checkout_session_id: checkoutSession.id })
      .eq('id', ticket.id);

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      ticketId: ticket.id,
      pricing
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}