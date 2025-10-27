import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Monime sends POST to successUrl (not GET redirect)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);
    
    // Extract ticket ID from URL params (embedded in successUrl)
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    
    console.log('=== PAYMENT SUCCESS POST (from Monime) ===');
    console.log('Ticket ID:', ticketId);
    console.log('Request URL:', req.url);
    
    if (!ticketId) {
      console.error('Payment success: No ticketId provided');
      // Redirect to generic events page
      return NextResponse.redirect(new URL('/events', req.url), { status: 303 });
    }

    // Get the ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, event_id, status')
      .eq('id', ticketId)
      .single();

    console.log('Ticket found:', ticket);
    console.log('Ticket error:', ticketError);

    if (ticketError || !ticket) {
      console.error('Payment success: Ticket not found:', ticketId);
      return NextResponse.redirect(new URL('/events', req.url), { status: 303 });
    }

    // Mark ticket as approved if not already (redundant with webhook, but safe)
    if (ticket.status !== 'approved') {
      console.log('Approving ticket from success callback:', ticketId);
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status: 'approved',
          qr_token: crypto.randomUUID()
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Failed to approve ticket:', updateError);
      } else {
        console.log('Ticket approved successfully');
      }
    }

    // Redirect to the success UI page (303 = See Other, converts POST to GET)
    const successPageUrl = new URL(`/events/${ticket.event_id}/register/success?ticketId=${ticketId}`, req.url);
    console.log('Redirecting to success page:', successPageUrl.toString());
    return NextResponse.redirect(successPageUrl, { status: 303 });
    
  } catch (error) {
    console.error('Payment success handler error:', error);
    return NextResponse.redirect(new URL('/events', req.url), { status: 303 });
  }
}
