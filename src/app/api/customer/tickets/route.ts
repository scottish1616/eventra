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

    // Prefer lookup by session user id when available (more reliable), fall back to email
    let userQuery = supabase.from("users").select("id, loyaltyPoints");
    if (sessionUser.id) {
      userQuery = userQuery.eq("id", sessionUser.id);
    } else {
      userQuery = userQuery.eq("email", sessionUser.email);
    }

    const { data: user, error: userError } = await userQuery.maybeSingle();

    if (userError) {
      console.error("[Customer Tickets] user lookup error:", userError);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        id,
        ticketNumber,
        isUsed,
        createdAt,
        eventId,
        ticketTypeId
      `)
      .eq("userId", user.id)
      .order("createdAt", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const enriched = await Promise.all(
      (tickets || []).map(async (ticket: {
        id: string;
        ticketNumber: string;
        isUsed: boolean;
        createdAt: string;
        eventId: string;
        ticketTypeId: string;
      }) => {
        const [eventRes, ttRes] = await Promise.all([
          supabase
            .from("events")
            .select("id, title, date, location")
            .eq("id", ticket.eventId)
            .single(),
          supabase
            .from("ticket_types")
            .select("name, price, category")
            .eq("id", ticket.ticketTypeId)
            .single(),
        ]);

        return {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          isUsed: ticket.isUsed,
          createdAt: ticket.createdAt,
          event: eventRes.data || null,
          ticketType: ttRes.data || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched,
      loyaltyPoints: user.loyaltyPoints || 0,
    });
  } catch (error) {
    console.error("[Customer Tickets]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}