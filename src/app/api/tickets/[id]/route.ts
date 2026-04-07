import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabase();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        events!tickets_eventId_fkey(title, date, location, venue),
        ticket_types!tickets_ticketTypeId_fkey(name, price, category)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        event: ticket.events,
        ticketType: ticket.ticket_types,
      },
    });
  } catch (error) {
    console.error("[Public Ticket]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket" },
      { status: 500 },
    );
  }
}
