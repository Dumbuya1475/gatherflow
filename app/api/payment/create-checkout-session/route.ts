import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    console.log("Attempting to get user session...");
    const { data: { user } } = await supabase.auth.getUser();
    console.log("User session:", user);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, quantity } = await req.json();

    if (!eventId || !quantity) {
      return NextResponse.json({ error: "Missing eventId or quantity" }, { status: 400 });
    }

    console.log("MONIME_SECRET_KEY:", process.env.MONIME_SECRET_KEY ? "Configured" : "Not Configured");
    console.log("MONIME_SPACE_ID:", process.env.MONIME_SPACE_ID ? "Configured" : "Not Configured");
    console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("price, title")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!event.price || event.price <= 0) {
      return NextResponse.json({ error: "This is not a paid event." }, { status: 400 });
    }

    const token = process.env.MONIME_SECRET_KEY;
    const spaceId = process.env.MONIME_SPACE_ID;

    if (!token) {
      return NextResponse.json({ error: "Monime API key is not configured." }, { status: 500 });
    }

    if (!spaceId) {
      return NextResponse.json({ error: "Monime Space ID is not configured." }, { status: 500 });
    }

    const monimeResponse = await fetch("https://api.monime.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
        "Monime-Space-Id": spaceId,
      },
      body: JSON.stringify({
        name: `Payment for ${event.title}`,
        lineItems: [
          {
            type: "custom",
            name: event.title,
            price: {
              currency: "SLE",
              value: event.price * quantity * 100, // Convert to minor unit
            },
            quantity: quantity,
          },
        ],
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/view`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventId}/register`,
        reference: `event-${eventId}-quantity-${quantity}`,
      }),
    });

    if (!monimeResponse.ok) {
      const errorBody = await monimeResponse.text();
      return NextResponse.json({ error: `Failed to create Monime checkout session: ${errorBody}` }, { status: monimeResponse.status });
    }

    const checkoutSession = await monimeResponse.json();
    const redirectUrl = checkoutSession.result.redirectUrl;

    return NextResponse.json({ hostedUrl: redirectUrl });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
