import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

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
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const { data: event } = await supabase
      .from("events")
      .select("title, date, location, venue, organizerId")
      .eq("id", ticket.eventId)
      .single();

    const { data: ticketType } = await supabase
      .from("ticket_types")
      .select("name, price, category")
      .eq("id", ticket.ticketTypeId)
      .single();

    return NextResponse.json({
      success: true,
      data: { ...ticket, event, ticketType },
    });
  } catch (error) {
    console.error("[GET /api/tickets/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch ticket" }, { status: 500 });
  }
}