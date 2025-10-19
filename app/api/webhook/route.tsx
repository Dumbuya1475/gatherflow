import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTicketDetails } from "@/lib/actions/tickets";
import { sendTicketEmail } from "@/lib/actions/email";
import { TicketEmail } from "@/components/emails/ticket-email";
import crypto from "crypto";

// Function to verify Monime signature
async function verifySignature(req: NextRequest, secret: string) {
  const signature = req.headers.get("Monime-Signature");
  if (!signature) {
    return false;
  }

  const body = await req.text();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");

  return digest === signature;
}

export async function POST(req: NextRequest) {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Monime Webhook Secret is not configured.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  // Clone the request to read the body multiple times
  const clonedReq = req.clone();
  const body = await clonedReq.text();

  // Verify signature
  const signature = req.headers.get("Monime-Signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature provided." }, { status: 400 });
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");

  if (digest !== signature) {
    console.error("Webhook signature verification failed.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (event.type === "checkout_session.completed") {
    const { reference, id: monimePaymentId } = event.data.object;

    if (!reference) {
      console.error("Webhook payload missing reference:", event);
      return NextResponse.json({ error: "Missing reference in payload." }, { status: 400 });
    }

    const referenceParts = reference.split("-");
    const eventId = referenceParts[1];
    const userIdFromRef = referenceParts[3]; // This might be 'null' or a valid UUID
    const emailFromRef = referenceParts[5];

    let finalUserId = userIdFromRef;
    let finalUserEmail = emailFromRef;

    if (!finalUserId || finalUserId === 'null') { // If userId is missing or 'null' from reference
      // Try to find an existing profile by email
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('id, is_guest')
        .eq('email', finalUserEmail)
        .maybeSingle(); // Use maybeSingle as profile might not exist

      if (existingProfileError && existingProfileError.code !== 'PGRST116') {
        console.error('Error checking for existing profile in webhook:', existingProfileError);
        return NextResponse.json({ error: 'An error occurred during profile lookup.' }, { status: 500 });
      }

      if (existingProfile) {
        finalUserId = existingProfile.id;
      } else {
        // Create a new guest profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            email: finalUserEmail,
            is_guest: true,
          })
          .select('id')
          .single();

        if (createProfileError) {
          console.error('Error creating guest profile in webhook:', createProfileError);
          return NextResponse.json({ error: 'Could not create guest profile.' }, { status: 500 });
        }
        finalUserId = newProfile.id;
      }
    }

    if (!finalUserId) {
      console.error("Could not determine user ID for ticket creation.");
      return NextResponse.json({ error: "Could not determine user ID." }, { status: 500 });
    }

    const supabase = createServiceRoleClient();

    // Find the ticket purchase in our database
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, user_id, event_id")
      .eq("event_id", eventId)
      .eq("user_id", finalUserId)
      .single();

    if (ticketError || !ticket) {
      console.error("Error finding ticket:", ticketError);
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    // Mark it as paid and generate QR token
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status: "approved", qr_token: crypto.randomUUID() })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Error updating ticket status:", updateError);
      return NextResponse.json({ error: "Failed to update ticket status." }, { status: 500 });
    }

    // Send confirmation email with QR code
    const { data: ticketDetails } = await getTicketDetails(ticket.id);
    if (ticketDetails) {
      await sendTicketEmail(
        ticketDetails.profiles.email!,
        `Your ticket for ${ticketDetails.events.title}`,
        <TicketEmail ticket={ticketDetails} />
      );
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, message: "Event type not handled." });
}
