import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
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

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("title, date, location, venue")
      .eq("id", ticket.eventId)
      .single();

    const { data: ticketType } = await supabase
      .from("ticket_types")
      .select("name, price, category")
      .eq("id", ticket.ticketTypeId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        event: event || null,
        ticketType: ticketType || null,
      },
    });
  } catch (error) {
    console.error("[Public Ticket GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}