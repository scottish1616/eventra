import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Look up user by id first, then fall back to email
    let userId: string | null = null;

    if (sessionUser.id) {
      const { data: userById } = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionUser.id)
        .maybeSingle();
      if (userById?.id) userId = userById.id;
    }

    if (!userId) {
      const { data: userByEmail, error: emailErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", sessionUser.email)
        .maybeSingle();
      if (emailErr) console.error("[Customer Tickets] email lookup error:", emailErr);
      if (userByEmail?.id) userId = userByEmail.id;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all tickets for this user, joined with event and ticket type
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        id,
        ticketNumber,
        isUsed,
        createdAt,
        events ( id, title, date, location ),
        ticket_types ( name, price, category )
      `)
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("[Customer Tickets] fetch error:", error);
      // Fall back to separate queries if join fails
      const { data: plainTickets, error: plainError } = await supabase
        .from("tickets")
        .select("id, ticketNumber, isUsed, createdAt, eventId, ticketTypeId")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      if (plainError) {
        return NextResponse.json(
          { success: false, error: plainError.message },
          { status: 500 }
        );
      }

      const enriched = await Promise.all(
        (plainTickets || []).map(async (ticket: any) => {
          const [eventRes, ttRes] = await Promise.all([
            supabase.from("events").select("id, title, date, location").eq("id", ticket.eventId).single(),
            supabase.from("ticket_types").select("name, price, category").eq("id", ticket.ticketTypeId).single(),
          ]);

          return {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            isUsed: ticket.isUsed ?? false,
            createdAt: ticket.createdAt,
            event: eventRes.data || null,
            ticketType: ttRes.data || null,
          };
        })
      );

      return NextResponse.json({ success: true, data: enriched, loyaltyPoints: 0 });
    }

    // Normalize the joined response
    const normalized = (tickets || []).map((ticket: any) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      isUsed: ticket.isUsed ?? false,
      createdAt: ticket.createdAt,
      event: ticket.events
        ? { id: ticket.events.id, title: ticket.events.title, date: ticket.events.date, location: ticket.events.location }
        : null,
      ticketType: ticket.ticket_types
        ? { name: ticket.ticket_types.name, price: ticket.ticket_types.price, category: ticket.ticket_types.category }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      loyaltyPoints: 0,
    });
  } catch (error) {
    console.error("[Customer Tickets]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}