'use server';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createMonimePayout } from '@@/lib/monime';
import { cookies } from 'next/headers';

async function processEventPayout(event: any, supabaseAdmin: any) {
  // Get all paid tickets
  const { data: tickets } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('event_id', event.id)
    .eq('monime_payment_status', 'paid');

  if (!tickets || tickets.length === 0) {
    console.log(`No paid tickets for event ${event.id}`);
    return;
  }

  // Calculate total payout
  const totalGrossAmount = tickets.reduce((sum: any, ticket: any) => sum + ticket.amount_paid, 0);
  const totalPlatformFees = tickets.reduce((sum: any, ticket: any) => sum + ticket.platform_fee, 0);
  const totalMonimeFees = tickets.reduce((sum: any, ticket: any) => sum + ticket.payment_processor_fee, 0);
  const netPayout = tickets.reduce((sum: any, ticket: any) => sum + ticket.organizer_amount, 0);

  // Get organizer's profile to get phone number
  const { data: organizerProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('phone')
    .eq('id', event.organizer_id)
    .single();

  if (profileError || !organizerProfile?.phone) {
    console.error(`Organizer phone not found for event ${event.id}:`, profileError);
    throw new Error('Organizer phone not found');
  }

  // Create Monime payout
  const payout = await createMonimePayout({
    amount: netPayout,
    currency: 'SLL',
    recipientPhone: organizerProfile.phone,
    metadata: {
      event_id: event.id,
      organizer_id: event.organizer_id,
      total_tickets: tickets.length,
      gross_amount: totalGrossAmount,
      platform_fees: totalPlatformFees,
      monime_fees: totalMonimeFees,
    },
  });

  // Record payout in DB
  const { error: insertError } = await supabaseAdmin
    .from('payouts')
    .insert({
      event_id: event.id,
      organizer_id: event.organizer_id,
      total_tickets_sold: tickets.length,
      gross_amount: totalGrossAmount,
      platform_fees: totalPlatformFees,
      monime_fees: totalMonimeFees,
      net_payout: netPayout,
      monime_payout_id: payout.id,
      recipient_phone: organizerProfile.phone,
      monime_payout_status: 'processing',
    });

  if (insertError) {
    console.error('Failed to insert payout record:', insertError);
    throw insertError;
  }

  // Mark event as payout completed
  const { error: updateError } = await supabaseAdmin
    .from('events')
    .update({ payout_completed: true })
    .eq('id', event.id);

  if (updateError) {
    console.error('Failed to update event payout status:', updateError);
    throw updateError;
  }

  console.log(`Payout initiated for event ${event.id}, amount: ${netPayout}`);
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAdmin = createServiceRoleClient(cookieStore);
  
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find events that ended 3 days ago and haven't been paid out
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('status', 'ended')
      .lte('event_date', threeDaysAgo.toISOString())
      .eq('payout_completed', false);

    if (error) throw error;

    let processedCount = 0;

    for (const event of events || []) {
      try {
        await processEventPayout(event, supabaseAdmin);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process payout for event ${event.id}:`, error);
        // Continue with other events
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: events?.length || 0
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
