import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Handle GET requests (direct browser access or Monime redirect)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');
  
  console.log('=== PAYMENT SUCCESS GET ===');
  console.log('Ticket ID:', ticketId);
  console.log('Full URL:', req.url);
  
  if (!ticketId) {
    console.error('No ticketId in URL params');
    return NextResponse.redirect(new URL('/events', req.url));
  }

  const cookieStore = await cookies();
  const supabase = createServiceRoleClient(cookieStore);
  
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, event_id, status')
    .eq('id', ticketId)
    .single();

  console.log('Ticket found:', ticket);
  console.log('Ticket error:', ticketError);

  if (!ticket) {
    console.error('Ticket not found for ID:', ticketId);
    return NextResponse.redirect(new URL('/events', req.url));
  }

  // Mark ticket as approved if not already
  if (ticket.status !== 'approved') {
    console.log('Approving ticket from GET handler:', ticketId);
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

  // Redirect to the success page
  const successPageUrl = new URL(`/events/${ticket.event_id}/register/success?ticketId=${ticketId}`, req.url);
  console.log('Redirecting to:', successPageUrl.toString());
  return NextResponse.redirect(successPageUrl);
}

// Handle POST requests (from Monime)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);
    
    // Parse the request body from Monime
    const body = await req.json();
    console.log('Payment success callback received:', body);
    
    // Extract ticket ID from URL params
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    
    if (!ticketId) {
      console.error('Payment success: No ticketId provided');
      return NextResponse.redirect(new URL('/events', req.url));
    }

    // Get the ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, event_id, status')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Payment success: Ticket not found:', ticketId);
      return NextResponse.redirect(new URL('/events', req.url));
    }

    // If ticket is not already approved, mark it as approved
    if (ticket.status !== 'approved') {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status: 'approved',
          qr_token: crypto.randomUUID()
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Payment success: Failed to update ticket:', updateError);
      } else {
        console.log('Payment success: Ticket approved:', ticketId);
      }
    }

    // Redirect to the success page (GET request that shows UI)
    const successPageUrl = new URL(`/events/${ticket.event_id}/register/success?ticketId=${ticketId}`, req.url);
    return NextResponse.redirect(successPageUrl, { status: 303 }); // 303 See Other - changes POST to GET
    
  } catch (error) {
    console.error('Payment success handler error:', error);
    return NextResponse.redirect(new URL('/events', req.url));
  }
}
