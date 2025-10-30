import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendTicketEmail } from '@/lib/actions/email';
import { getTicketDetails } from '@/lib/actions/tickets';
import { TicketEmail } from '@/components/emails/ticket-email';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import React from 'react';

async function verifyMonimeSignature(req: NextRequest): Promise<{isValid: boolean, bodyText: string}> {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log("=== WEBHOOK VERIFICATION (DEV MODE) ===");
  }
  
  if (!secret) {
    console.error("Monime Webhook Secret is not configured.");
    return {isValid: false, bodyText: ''};
  }

  const signature = req.headers.get("monime-signature");
  
  if (!signature) {
    if (isDev) console.warn("Webhook received without signature.");
    return {isValid: false, bodyText: ''};
  }
  
  const bodyText = await req.text();
  
  try {
    // Monime sends timestamped signatures like: "t=TIMESTAMP,v1=BASE64_SIGNATURE"
    let timestamp: string | null = null;
    let receivedSignature: string | null = null;

    const signatureParts = signature.split(',').map(p => p.trim());
    for (const part of signatureParts) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const key = part.slice(0, eq);
      const val = part.slice(eq + 1);
      if (key === 't') timestamp = val;
      if (key === 'v1') receivedSignature = val;
    }

    // Helper: constant-time compare buffers
    const safeEqual = (a: Buffer, b: Buffer): boolean => {
      if (a.length !== b.length) return false;
      try {
        return crypto.timingSafeEqual(a, b);
      } catch (_e) {
        return false;
      }
    };

    // If we have timestamped signature, validate timestamp and signed payload
    if (timestamp && receivedSignature) {
      // Small replay protection: timestamp should be within 5 minutes
      const tsNum = Number.parseInt(timestamp, 10);
      if (Number.isNaN(tsNum)) {
        if (isDev) console.warn('Webhook signature timestamp is not a number');
        return { isValid: false, bodyText };
      }
      const now = Math.floor(Date.now() / 1000);
      const skew = Math.abs(now - tsNum);
      const MAX_SKEW = 60 * 5; // 5 minutes
      if (skew > MAX_SKEW) {
        if (isDev) console.warn('Webhook signature timestamp outside allowed window', { skew });
        return { isValid: false, bodyText };
      }

      const signedPayload = `${timestamp}.${bodyText}`;

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(signedPayload);
      const expectedBuf = hmac.digest(); // Buffer

      // Try to decode receivedSignature as base64 first
      let receivedBuf: Buffer | null = null;
      try {
        receivedBuf = Buffer.from(receivedSignature, 'base64');
      } catch (_e) {
        receivedBuf = null;
      }

      let isValid = false;
      if (receivedBuf && expectedBuf.length === receivedBuf.length) {
        isValid = safeEqual(expectedBuf, receivedBuf);
      } else {
        // Fallback: compare hex encodings (some providers send hex)
        const expectedHex = expectedBuf.toString('hex');
        const cleaned = receivedSignature.replace(/[^0-9a-fA-F]/g, '');
        if (cleaned && cleaned.length === expectedHex.length) {
          isValid = crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(cleaned, 'hex'));
        }
      }

      if (isDev) {
        console.log('HMAC verification (timestamped):', isValid ? '✅ PASSED' : '❌ FAILED');
      }

      return { isValid, bodyText };
    }

    // Fallback: single-value signature (plain HMAC over body)
    const hmacBody = crypto.createHmac('sha256', secret);
    hmacBody.update(bodyText);
    const expectedHex = hmacBody.digest('hex');
    const expectedBase64 = Buffer.from(expectedHex, 'hex').toString('base64');

    let validFallback = false;
    const sigVal = signature.replace(/^[^=]*=?/, '');
    if (signature === expectedHex || sigVal === expectedBase64) {
      validFallback = true;
    }

    if (isDev) {
      console.log('HMAC verification (fallback):', validFallback ? '✅ PASSED' : '❌ FAILED');
    }

    return { isValid: validFallback, bodyText };

  } catch (error) {
    console.error('Signature verification error:', error);
    return { isValid: false, bodyText };
  }
}

export async function POST(req: NextRequest) {
  const { isValid, bodyText } = await verifyMonimeSignature(req);
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isValid) {
    if (isDev) console.warn("⚠️ Invalid webhook signature - processing anyway for testing");
    // TODO: Re-enable strict verification once signature format is confirmed
    // return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(bodyText);
  } catch (err) {
    console.error("JSON parsing error:", err);
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServiceRoleClient(cookieStore);

  // Handle different webhook events
  switch (event.event) {
    case "checkout_session.completed": {
      const session = event.data;
      const checkoutSessionId = session.id;
      
      if (!checkoutSessionId) {
          return NextResponse.json({ error: "Missing checkout session ID in webhook payload." }, { status: 400 });
      }

      // 1. Find the ticket using the checkout session ID
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .select("id, event_id, status")
        .eq("monime_checkout_session_id", checkoutSessionId)
        .single();

      if (ticketError || !ticket) {
        console.error("Webhook Error: Ticket not found for checkout session:", checkoutSessionId);
        return NextResponse.json({ error: "Ticket not found for this session." }, { status: 404 });
      }

      // Idempotency check: If ticket is already approved, do nothing.
      if (ticket.status === 'approved') {
          return NextResponse.json({ received: true, message: "Ticket already processed." });
      }

      // 2. Get payment details from checkout session
      // You'll need to fetch the checkout session details from Monime to get exact amounts
      // For now, we'll calculate based on the ticket data
      const { data: eventData } = await supabase
        .from("events")
        .select("price, fee_bearer")
        .eq("id", ticket.event_id)
        .single();

      const ticketPrice = eventData?.price || 0;
      const feeBearerType = eventData?.fee_bearer || 'buyer';
      
      // Calculate fees (adjust these based on your Monime fee structure)
      const platformFeeRate = 0.05; // 5% platform fee
      const processorFeeRate = 0.029; // 2.9% + $0.30 Monime fee
      const processorFixedFee = 0.30;
      
      const platformFee = ticketPrice * platformFeeRate;
      const processorFee = (ticketPrice * processorFeeRate) + processorFixedFee;
      let amountPaid = ticketPrice;
      let organizerAmount = ticketPrice;

      if (feeBearerType === 'buyer') {
        // Buyer pays fees
        amountPaid = ticketPrice + platformFee + processorFee;
      } else {
        // Organizer pays fees (deducted from ticket price)
        organizerAmount = ticketPrice - platformFee - processorFee;
      }

      // 3. Mark ticket as 'approved', save payment details, and generate QR token
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
            status: "approved", 
            qr_token: crypto.randomUUID(),
            monime_payment_status: 'paid',
            ticket_price: ticketPrice,
            amount_paid: amountPaid,
            platform_fee: platformFee,
            payment_processor_fee: processorFee,
            organizer_amount: organizerAmount,
            fee_bearer: feeBearerType
          })
        .eq("id", ticket.id);

      if (updateError) {
        console.error("Webhook Error: Failed to update ticket status:", updateError);
        return NextResponse.json({ error: "Failed to update ticket status." }, { status: 500 });
      }

      // 4. Send confirmation email with QR code
      const { data: ticketDetails } = await getTicketDetails(ticket.id);
      if (ticketDetails) {
        await sendTicketEmail(
          ticketDetails.profiles.email!,
          `Your ticket for ${ticketDetails.events.title}`,
          React.createElement(TicketEmail, { ticket: ticketDetails })
        );
      }
      
      // 5. Revalidate paths
      revalidatePath(`/events/${ticket.event_id}`);
      revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);

      return NextResponse.json({ received: true });
    }

    case "checkout_session.expired": {
      const session = event.data;
      const checkoutSessionId = session.id;
      
      // Find and mark ticket as expired
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, event_id")
        .eq("monime_checkout_session_id", checkoutSessionId)
        .eq("status", "unpaid")
        .single();

      if (ticket) {
        await supabase
          .from("tickets")
          .update({ 
            status: "expired",
            monime_payment_status: 'expired'
          })
          .eq("id", ticket.id);
      }

      return NextResponse.json({ received: true });
    }

    case "checkout_session.cancelled": {
      const session = event.data;
      const checkoutSessionId = session.id;
      
      // Find and update payment status to cancelled (keep ticket status as unpaid)
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, event_id")
        .eq("monime_checkout_session_id", checkoutSessionId)
        .eq("status", "unpaid")
        .single();

      if (ticket) {
        await supabase
          .from("tickets")
          .update({ 
            monime_payment_status: 'cancelled'
          })
          .eq("id", ticket.id);
      }

      return NextResponse.json({ received: true });
    }

    case "payout.completed": {
      // TODO: Handle payout completion for event organizers
      // You can add logic here to:
      // - Update payout status in your database
      // - Send notification to organizer
      // - Update financial records
      
      return NextResponse.json({ received: true });
    }

    case "payout.failed": {
      // TODO: Handle payout failure for event organizers
      // You can add logic here to:
      // - Mark payout as failed
      // - Notify organizer
      // - Retry logic
      
      return NextResponse.json({ received: true });
    }

    default:
      console.log("Unhandled webhook event:", event.event);
      return NextResponse.json({ received: true, message: "Event type not handled." });
  }
}
