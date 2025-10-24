import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Monime sends POST to cancelUrl (not GET redirect)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);
    
    // Extract parameters from URL
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const eventId = searchParams.get('eventId');
    
    console.log('=== PAYMENT CANCEL POST (from Monime) ===');
    console.log('Ticket ID:', ticketId);
    console.log('Event ID:', eventId);
    
    if (ticketId) {
      // Update payment status to cancelled (keep ticket status as unpaid)
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          monime_payment_status: 'cancelled'
        })
        .eq('id', ticketId)
        .eq('status', 'unpaid'); // Only update if still unpaid

      if (updateError) {
        console.error('Payment cancel: Failed to update ticket:', updateError);
      } else {
        console.log('Payment cancel: Payment status updated to cancelled:', ticketId);
      }
    }

    // Redirect back to registration page (303 = See Other, converts POST to GET)
    const redirectUrl = eventId 
      ? new URL(`/events/${eventId}/register?payment_cancelled=true`, req.url)
      : new URL('/events', req.url);
    
    console.log('Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl, { status: 303 });
    
  } catch (error) {
    console.error('Payment cancel handler error:', error);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const fallbackUrl = eventId 
      ? new URL(`/events/${eventId}/register`, req.url)
      : new URL('/events', req.url);
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }
}
