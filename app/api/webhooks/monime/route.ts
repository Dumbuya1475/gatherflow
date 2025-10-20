import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import crypto from 'crypto';

function verifyMonimeSignature(payload: any, signature: string): boolean {
  const webhookSecret = process.env.MONIME_WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const signature = req.headers.get('monime-signature') || '';

    // Verify signature
    if (!verifyMonimeSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle different event types
    switch (payload.event) {
      case 'checkout_session.completed':
        await handlePaymentSuccess(payload.data);
        break;
      case 'checkout_session.expired':
        await handlePaymentExpired(payload.data);
        break;
      case 'payout.completed':
        await handlePayoutCompleted(payload.data);
        break;
      case 'payout.failed':
        await handlePayoutFailed(payload.data);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: any) {
  const checkoutSessionId = data.id;
  const amountPaid = data.amount / 100; // Convert from cents
  const monimeFee = amountPaid * 0.03; // 3% Monime fee

  // Update ticket
  const { error } = await supabaseAdmin
    .from('tickets')
    .update({
      monime_payment_status: 'paid',
      payment_processor_fee: monimeFee
    })
    .eq('monime_checkout_session_id', checkoutSessionId);

  if (error) {
    console.error('Failed to update ticket:', error);
    throw error;
  }

  // TODO: Send confirmation email with QR code
  // TODO: Send SMS notification
}

async function handlePaymentExpired(data: any) {
  const checkoutSessionId = data.id;

  await supabaseAdmin
    .from('tickets')
    .update({ monime_payment_status: 'expired' })
    .eq('monime_checkout_session_id', checkoutSessionId);
}

async function handlePayoutCompleted(data: any) {
  const payoutId = data.id;

  await supabaseAdmin
    .from('payouts')
    .update({
      monime_payout_status: 'completed',
      payout_date: new Date().toISOString()
    })
    .eq('monime_payout_id', payoutId);

  // TODO: Send organizer notification
}

async function handlePayoutFailed(data: any) {
  const payoutId = data.id;

  await supabaseAdmin
    .from('payouts')
    .update({ monime_payout_status: 'failed' })
    .eq('monime_payout_id', payoutId);

  // TODO: Alert admin
}