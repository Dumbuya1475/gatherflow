import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Temporary endpoint to manually approve a ticket for testing
export async function POST(req: NextRequest) {
  try {
    const { ticketId } = await req.json();
    
    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);

    // Update ticket to approved with QR code
    const { data, error } = await supabase
      .from("tickets")
      .update({ 
        status: "approved", 
        qr_token: crypto.randomUUID()
      })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      ticket: data,
      message: "Ticket approved successfully!" 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
