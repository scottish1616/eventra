import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ticket ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, isUsed, ticketNumber")
      .eq("id", id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.isUsed) {
      return NextResponse.json(
        { success: false, error: "This ticket has already been used" },
        { status: 409 }
      );
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({ isUsed: true, usedAt: new Date().toISOString() })
      .eq("id", id)
      .select("id, isUsed, ticketNumber")
      .single();

    if (updateError || !updatedTicket) {
      return NextResponse.json(
        { success: false, error: "Could not update ticket check-in state" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedTicket });
  } catch (error) {
    console.error("[Ticket Check-in]", error);
    return NextResponse.json(
      { success: false, error: "Failed to check in ticket" },
      { status: 500 }
    );
  }
}
