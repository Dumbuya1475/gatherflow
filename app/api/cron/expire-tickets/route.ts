import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// WARNING: Use environment variables for Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// This is the endpoint that will be called by a cron job scheduler
export async function POST(request: Request) {
  // 1. Secure the endpoint
  const authToken = (request.headers.get('authorization') || '').replace('Bearer ', '');
  if (authToken !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new NextResponse('Supabase environment variables are not set', { status: 500 });
  }

  // Use the service role key to bypass RLS for this system-level task
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 2. Calculate the cutoff date (2 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);

    // 3. Find tickets to expire
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

    return NextResponse.json({ success: true, message: `Successfully expired ${count} tickets.`, expiredCount: count });

  } catch (e: any) {
    console.error('Cron job: An unexpected error occurred:', e);
    return new NextResponse(`An unexpected error occurred: ${e.message}`, { status: 500 });
  }
}
