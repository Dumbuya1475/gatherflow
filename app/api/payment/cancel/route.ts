import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);
    
    // Parse the request body from Monime
    const body = await req.json();
    console.log('Payment cancel callback received:', body);
    
    // Extract ticket ID from URL params
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const eventId = searchParams.get('eventId');
    
    if (ticketId) {
      // Mark ticket as cancelled
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status: 'cancelled',
          monime_payment_status: 'cancelled'
        })
        .eq('id', ticketId)
        .eq('status', 'unpaid'); // Only update if still unpaid

      if (updateError) {
        console.error('Payment cancel: Failed to update ticket:', updateError);
      } else {
        console.log('Payment cancel: Ticket cancelled:', ticketId);
      }
    }

    // Redirect back to the registration page with cancelled flag
    const redirectUrl = eventId 
      ? new URL(`/events/${eventId}/register?payment_cancelled=true`, req.url)
      : new URL('/events', req.url);
    
    return NextResponse.redirect(redirectUrl, { status: 303 }); // 303 See Other - changes POST to GET
    
  } catch (error) {
    console.error('Payment cancel handler error:', error);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const fallbackUrl = eventId 
      ? new URL(`/events/${eventId}/register`, req.url)
      : new URL('/events', req.url);
    return NextResponse.redirect(fallbackUrl);
  }
}
