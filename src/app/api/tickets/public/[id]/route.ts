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

    const [eventRes, ticketTypeRes, orderRes] = await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, date, endDate, location, venue, description, bannerUrl, organizerId"
        )
        .eq("id", ticket.eventId)
        .single(),
      supabase
        .from("ticket_types")
        .select("name, price, category, description")
        .eq("id", ticket.ticketTypeId)
        .single(),
      ticket.orderId
        ? supabase
            .from("orders")
            .select("buyerPhone")
            .eq("id", ticket.orderId)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    console.log("[Ticket API] Event data:", JSON.stringify(eventRes.data));
    console.log("[Ticket API] Banner URL:", eventRes.data?.bannerUrl);

    let organizer = null;
    if (eventRes.data?.organizerId) {
      const { data: org } = await supabase
        .from("users")
        .select("name, organizationName")
        .eq("id", eventRes.data.organizerId)
        .single();
      organizer = org;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        event: eventRes.data
          ? {
              ...eventRes.data,
              bannerUrl: eventRes.data.bannerUrl || null,
              organizer,
            }
          : null,
        ticketType: ticketTypeRes.data || null,
        order: orderRes.data || null,
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
