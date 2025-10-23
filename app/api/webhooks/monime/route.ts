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
    // Try HMAC-SHA256 verification (Shared Secret method)
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(bodyText);
    const digest = hmac.digest("hex");

    const isValid = digest === signature;
    
    console.log("HMAC verification:", isValid ? "✅ PASSED" : "❌ FAILED");
    console.log("Expected (full):", digest);
    console.log("Received (full):", signature);
    console.log("Body length:", bodyText.length);
    console.log("Secret length:", secret.length);
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
    console.error("❌ Invalid webhook signature - rejecting request");
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
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
