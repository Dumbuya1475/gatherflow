
import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendTicketEmail } from "@/lib/actions/email";
import { getTicketDetails } from "@/lib/actions/tickets";
import { TicketEmail } from "@/components/emails/ticket-email";


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentId = searchParams.get("payment_id");
  const eventId = searchParams.get("event_id");
  const userId = searchParams.get("user_id");
  const status = searchParams.get("status");

  if (!paymentId || !eventId || !userId || !status) {
    return new NextResponse("Missing required parameters", { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, ticket_id")
    .eq("transaction_id", paymentId)
    .single();

  if (paymentError || !payment) {
    return new NextResponse("Payment not found", { status: 404 });
  }

  if (status === "success") {
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({ status: "approved", qr_token: crypto.randomUUID() })
      .eq("id", payment.ticket_id);

    if (ticketError) {
      return new NextResponse("Could not approve the ticket", { status: 500 });
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({ status: "success" })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      // Log the error but don't fail the request
      console.error("Could not update payment status", paymentUpdateError);
    }

    const { data: ticketDetails } = await getTicketDetails(payment.ticket_id);
    if (ticketDetails) {
      await sendTicketEmail(
        ticketDetails.profiles.email!,
        `Your ticket for ${ticketDetails.events.title}`,
        <TicketEmail ticket={ticketDetails} />
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/view/${payment.ticket_id}`
    );
  } else {
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({ status: "rejected" })
      .eq("id", payment.ticket_id);

    if (ticketError) {
      return new NextResponse("Could not reject the ticket", { status: 500 });
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      // Log the error but don't fail the request
      console.error("Could not update payment status", paymentUpdateError);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventId}/register?error=payment_failed`
    );
  }
}
