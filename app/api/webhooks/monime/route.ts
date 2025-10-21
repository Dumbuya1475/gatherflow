
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendTicketEmail } from '@/lib/actions/email';
import { getTicketDetails } from '@/lib/actions/tickets';
import { TicketEmail } from '@/components/emails/ticket-email';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

async function verifyMonimeSignature(req: NextRequest): Promise<boolean> {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Monime Webhook Secret is not configured.");
    return false;
  }

  const signature = req.headers.get("monime-signature");
  if (!signature) {
    console.warn("Webhook received without signature.");
    return false;
  }
  
  const bodyText = await req.text();
  
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(bodyText);
  const digest = hmac.digest("hex");

  const isValid = digest === signature;
  if (!isValid) {
      console.warn("Invalid webhook signature.");
  }

  return isValid;
}

export async function POST(req: NextRequest) {
  // We need to clone the request to read the body for signature verification,
  // because the body can only be read once.
  const reqClone = req.clone();
  if (!(await verifyMonimeSignature(reqClone))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  let event;
  try {
    event = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (event.event === "checkout_session.completed") {
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
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ 
          status: "approved", 
          qr_token: crypto.randomUUID(),
          monime_payment_status: 'paid' 
        })
      .eq("id", ticket.id);

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
        <TicketEmail ticket={ticketDetails} />
      );
    }
    
    // 4. Revalidate paths
    revalidatePath(`/events/${ticket.event_id}`);
    revalidatePath(`/dashboard/events/${ticket.event_id}/manage`);

    return NextResponse.json({ received: true });
  }

  // You can add handlers for other event types here if needed
  // e.g., 'payout.completed', 'payout.failed'

  return NextResponse.json({ received: true, message: "Event type not handled." });
}
    