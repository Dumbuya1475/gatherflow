
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * This is a mock function to simulate the creation of a payment intent.
 * Replace this with the actual Monime API call.
 *
 * @param eventId The ID of the event.
 * @param userId The ID of the user.
 * @returns A mock payment URL.
 */
async function createMonimePaymentIntent(
  eventId: number,
  userId: string,
  amount: number,
  currency: string
) {
  // In a real implementation, you would make an API call to Monime here.
  // For now, we'll just simulate a successful payment intent creation.
  const paymentId = `pi_${crypto.randomUUID()}`;
  const paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback?payment_id=${paymentId}&event_id=${eventId}&user_id=${userId}&amount=${amount}&currency=${currency}&status=success`;

  return {
    paymentId,
    paymentUrl,
  };
}

export async function createPaymentIntent(
  eventId: number,
  userId: string
) {
  const supabase = createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("price")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { error: "Event not found." };
  }

  if (!event.price || event.price <= 0) {
    return { error: "This is not a paid event." };
  }

  const { paymentId, paymentUrl } = await createMonimePaymentIntent(
    eventId,
    userId,
    event.price,
    "SLE"
  );

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      event_id: eventId,
      user_id: userId,
      status: "pending",
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return { error: "Could not create a ticket." };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    ticket_id: ticket.id,
    amount: event.price,
    currency: "SLE",
    status: "pending",
    payment_provider: "monime",
    transaction_id: paymentId,
  });

  if (paymentError) {
    return { error: "Could not create a payment record." };
  }

  redirect(paymentUrl);
}
