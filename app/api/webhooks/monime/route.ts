<<<<<<< HEAD

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
=======
import { NextRequest, NextResponse } from 'next/server';
>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendTicketEmail } from '@/lib/actions/email';
import { getTicketDetails } from '@/lib/actions/tickets';
import { TicketEmail } from '@/components/emails/ticket-email';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
<<<<<<< HEAD

async function verifyMonimeSignature(req: NextRequest): Promise<boolean> {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Monime Webhook Secret is not configured.");
    return false;
=======
import { cookies } from 'next/headers';

async function verifyMonimeSignature(req: NextRequest): Promise<{isValid: boolean, bodyText: string}> {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Monime Webhook Secret is not configured.");
    return {isValid: false, bodyText: ''};
>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
  }

  const signature = req.headers.get("monime-signature");
  if (!signature) {
    console.warn("Webhook received without signature.");
<<<<<<< HEAD
    return false;
=======
    return {isValid: false, bodyText: ''};
>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
  }
  
  const bodyText = await req.text();
  
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(bodyText);
  const digest = hmac.digest("hex");

  const isValid = digest === signature;
  if (!isValid) {
      console.warn("Invalid webhook signature.");
  }

<<<<<<< HEAD
  return isValid;
}

export async function POST(req: NextRequest) {
  // We need to clone the request to read the body for signature verification,
  // because the body can only be read once.
  const reqClone = req.clone();
  if (!(await verifyMonimeSignature(reqClone))) {
=======
  return {isValid, bodyText};
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const { isValid, bodyText } = await verifyMonimeSignature(req);

  if (!isValid) {
>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  let event;
  try {
<<<<<<< HEAD
    event = await req.json();
=======
    event = JSON.parse(bodyText);
>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

<<<<<<< HEAD
  const cookieStore = cookies();
=======
>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
  const supabase = createServiceRoleClient(cookieStore);

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
<<<<<<< HEAD
    
=======

>>>>>>> 5b980ee66e2892a4a47e32296589f8dfeb9e3b9f
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
