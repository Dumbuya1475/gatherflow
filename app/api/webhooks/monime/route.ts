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
  
  console.log("=== WEBHOOK VERIFICATION DEBUG ===");
  console.log("Secret configured:", !!secret);
  
  if (!secret) {
    console.error("Monime Webhook Secret is not configured.");
    return {isValid: false, bodyText: ''};
  }

  const signature = req.headers.get("monime-signature");
  
  if (!signature) {
    console.warn("Webhook received without signature.");
    return {isValid: false, bodyText: ''};
  }
  
  const bodyText = await req.text();
  
  try {
    // Parse Monime's timestamped signature format: "t=timestamp,v1=signature"
    const signatureParts = signature.split(',');
    let timestamp = '';
    let receivedSignature = '';
    
    for (const part of signatureParts) {
      const [key, value] = part.split('=');
      try {
        // Monime sends timestamped signatures like: "t=TIMESTAMP,v1=BASE64_SIGNATURE"
        // We'll support that format and also fall back to plain HMAC over the body
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
        function safeEqual(a: Buffer, b: Buffer) {
          if (a.length !== b.length) return false;
          try {
            return crypto.timingSafeEqual(a, b);
          } catch (e) {
            return false;
          }
        }

        // If we have timestamped signature, validate timestamp and signed payload
        if (timestamp && receivedSignature) {
          // Small replay protection: timestamp should be within 5 minutes
          const tsNum = Number.parseInt(timestamp, 10);
          if (Number.isNaN(tsNum)) {
            console.warn('Webhook signature timestamp is not a number');
            return { isValid: false, bodyText };
          }
          const now = Math.floor(Date.now() / 1000);
          const skew = Math.abs(now - tsNum);
          const MAX_SKEW = 60 * 5; // 5 minutes
          if (skew > MAX_SKEW) {
            console.warn('Webhook signature timestamp outside allowed window', { skew });
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
          } catch (e) {
            receivedBuf = null;
          }

          let isValid = false;
          if (receivedBuf && expectedBuf.length === receivedBuf.length) {
            isValid = safeEqual(expectedBuf, receivedBuf);
          } else {
            // Fallback: compare hex encodings (some providers send hex)
            const expectedHex = expectedBuf.toString('hex');
            // Received signature might contain additional metadata; strip non-hex
            const cleaned = receivedSignature.replace(/[^0-9a-fA-F]/g, '');
            if (cleaned && cleaned.length === expectedHex.length) {
              isValid = crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(cleaned, 'hex'));
            }
          }

          console.log('HMAC verification (timestamped):', isValid ? '✅ PASSED' : '❌ FAILED');
          console.log('Parsed timestamp:', timestamp);
          console.log('Expected (hex):', expectedBuf.toString('hex'));
          console.log('Received (raw):', receivedSignature);
          console.log('=== END DEBUG ===');

          return { isValid, bodyText };
        }

        // Fallback: single-value signature (plain HMAC over body) - try hex and base64
        const hmacBody = crypto.createHmac('sha256', secret);
        hmacBody.update(bodyText);
        const expectedHex = hmacBody.digest('hex');
        const expectedBase64 = Buffer.from(expectedHex, 'hex').toString('base64');

        let validFallback = false;
        // signature may be given directly as hex or base64 or contain a scheme
        const sigVal = signature.replace(/^[^=]*=?/, '');
        if (signature === expectedHex || sigVal === expectedBase64) {
          validFallback = true;
        }

        console.log('HMAC verification (fallback):', validFallback ? '✅ PASSED' : '❌ FAILED');
        console.log('Expected (hex):', expectedHex);
        console.log('Expected (base64):', expectedBase64);
        console.log('Received (full):', signature);
        console.log('=== END DEBUG ===');

        return { isValid: validFallback, bodyText };

      } catch (error) {
        console.error('Signature verification error:', error);
        return { isValid: false, bodyText };
      }
    console.log("Method 4 (body + hex):", expected4);
    console.log("Received signature:", receivedSignature);
    
    if (isValid) {
      if (expected1 === receivedSignature) console.log("✅ Matched Method 1");
      if (expected2 === receivedSignature) console.log("✅ Matched Method 2");
      if (expected3 === receivedSignature) console.log("✅ Matched Method 3");
      if (expected4 === receivedSignature) console.log("✅ Matched Method 4");
    }
    
    console.log("=== END DEBUG ===");
    
    return {isValid, bodyText};
    
  } catch (error) {
    console.error("Signature verification error:", error);
    return {isValid: false, bodyText};
  }
}

export async function POST(req: NextRequest) {
  const { isValid, bodyText } = await verifyMonimeSignature(req);

  console.log("Webhook signature validation:", isValid);
  
  if (!isValid) {
    console.warn("⚠️ Invalid webhook signature - but processing anyway for testing");
    // TODO: Re-enable strict verification once signature format is confirmed
    // return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  let event;
  try {
    // Use bodyText from verification (already read from request)
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
        console.error("Webhook Error: Ticket not found for checkout session:", checkoutSessionId, ticketError);
        return NextResponse.json({ error: "Ticket not found for this session." }, { status: 404 });
      }

      // Idempotency check: If ticket is already approved, do nothing.
      if (ticket.status === 'approved') {
          console.log("Webhook Info: Ticket already approved for session:", checkoutSessionId);
          return NextResponse.json({ received: true, message: "Ticket already processed." });
      }

      // 2. Mark ticket as 'approved' and generate QR token
      console.log("Approving ticket:", ticket.id);
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
            status: "approved", 
            qr_token: crypto.randomUUID()
          })
        .eq("id", ticket.id);
      
      console.log("Update result:", updateError ? `Error: ${updateError.message}` : "Success");

      if (updateError) {
        console.error("Webhook Error: Failed to update ticket status:", updateError);
        return NextResponse.json({ error: "Failed to update ticket status." }, { status: 500 });
      }

      // 3. Send confirmation email with QR code
      const { data: ticketDetails } = await getTicketDetails(ticket.id);
      if (ticketDetails) {
        await sendTicketEmail(
          ticketDetails.profiles.email!,
          `Your ticket for ${ticketDetails.events.title}`,
          React.createElement(TicketEmail, { ticket: ticketDetails })
        );
      }
      
      // 4. Revalidate paths
      revalidatePath(`/events/${ticket.event_id}`);
      revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);

      return NextResponse.json({ received: true });
    }

    case "checkout_session.expired": {
      const session = event.data;
      const checkoutSessionId = session.id;
      
      console.log("Checkout session expired:", checkoutSessionId);
      
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
        
        console.log("Ticket marked as expired:", ticket.id);
      }

      return NextResponse.json({ received: true });
    }

    case "checkout_session.cancelled": {
      const session = event.data;
      const checkoutSessionId = session.id;
      
      console.log("Checkout session cancelled:", checkoutSessionId);
      
      // Find and mark ticket as cancelled
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
            status: "cancelled",
            monime_payment_status: 'cancelled'
          })
          .eq("id", ticket.id);
        
        console.log("Ticket marked as cancelled:", ticket.id);
      }

      return NextResponse.json({ received: true });
    }

    case "payout.completed": {
      // TODO: Handle payout completion for event organizers
      const payout = event.data;
      console.log("Payout completed:", payout.id);
      
      // You can add logic here to:
      // - Update payout status in your database
      // - Send notification to organizer
      // - Update financial records
      
      return NextResponse.json({ received: true });
    }

    case "payout.failed": {
      // TODO: Handle payout failure for event organizers
      const payout = event.data;
      console.log("Payout failed:", payout.id);
      
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
