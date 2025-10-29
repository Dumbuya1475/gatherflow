
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// This is the endpoint that will be called by a cron job scheduler
export async function POST(request: Request) {
  // 1. Secure the endpoint
  const authToken = (request.headers.get('authorization') || '').replace('Bearer ', '');
  if (authToken !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const cookieStore = await cookies();
  const supabaseAdmin = createServiceRoleClient(cookieStore);

  try {
    // 2. Calculate the cutoff date (2 days ago for events, 30 minutes for unpaid tickets)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    
    const unpaidCutoffDate = new Date();
    unpaidCutoffDate.setMinutes(unpaidCutoffDate.getMinutes() - 30); // 30 minutes ago

    // 3a. Expire old unpaid/cancelled tickets (30 minutes old)
    const { data: unpaidTickets, error: unpaidFetchError } = await supabaseAdmin
      .from('tickets')
      .select('id, created_at')
      .in('status', ['unpaid', 'cancelled'])
      .lt('created_at', unpaidCutoffDate.toISOString());

    if (!unpaidFetchError && unpaidTickets && unpaidTickets.length > 0) {
      const unpaidTicketIds = unpaidTickets.map(t => t.id);
      
      // Mark as expired instead of deleting (for record keeping)
      await supabaseAdmin
        .from('tickets')
        .update({ status: 'expired' })
        .in('id', unpaidTicketIds);
      
      console.log(`Cron job: Expired ${unpaidTickets.length} unpaid/cancelled tickets`);
    }

    // 3b. Find tickets to expire where event has ended
    // Find tickets where the event has ended more than 2 days ago
    // and the status is not already expired or another final state.
    const { data: ticketsToExpire, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        events ( id, end_date, date )
      `)
      .in('status', ['approved', 'pending']) // Only target tickets that are still considered active
      .lt('events.end_date', cutoffDate.toISOString());

    if (fetchError) {
      console.error('Cron job: Error fetching tickets to expire:', fetchError);
      return new NextResponse(`Error fetching tickets: ${fetchError.message}`, { status: 500 });
    }

    if (!ticketsToExpire || ticketsToExpire.length === 0) {
      return NextResponse.json({ success: true, message: 'No tickets to expire.', expiredCount: 0 });
    }

    const ticketIds = ticketsToExpire.map(t => t.id);

    // 4. Update the tickets' status to 'expired'
    const { count, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'expired' })
      .in('id', ticketIds)
      .select(); // Use select() to get the count of updated rows

    if (updateError) {
      console.error('Cron job: Error expiring tickets:', updateError);
      return new NextResponse(`Error updating tickets: ${updateError.message}`, { status: 500 });
    }

    const totalExpired = (unpaidTickets?.length || 0) + (count || 0);
    return NextResponse.json({ 
      success: true, 
      message: `Successfully expired ${totalExpired} tickets (${unpaidTickets?.length || 0} unpaid/cancelled, ${count || 0} past events).`, 
      expiredCount: totalExpired 
    });

  } catch (e: unknown) {
    console.error('Cron job: An unexpected error occurred:', e);
    const errorMessage = e instanceof Error ? e.message : 'Internal server error';
    return new NextResponse(`An unexpected error occurred: ${errorMessage}`, { status: 500 });
  }
}
