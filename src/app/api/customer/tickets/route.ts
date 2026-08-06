import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = getSupabase();

    let userResult = null;
    if (sessionUser.id) {
      userResult = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionUser.id)
        .maybeSingle();
    }

    if (!userResult?.data) {
      userResult = await supabase
        .from("users")
        .select("id")
        .eq("email", sessionUser.email.toLowerCase().trim())
        .maybeSingle();
    }

    if (userResult?.error) {
      throw userResult.error;
    }

    if (!userResult?.data) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const { data: ticketRows, error: ticketError } = await supabase
      .from("tickets")
      .select("id, ticketNumber, isUsed, createdAt, eventId, ticketTypeId")
      .eq("userId", userResult.data.id)
      .order("createdAt", { ascending: false });

    if (ticketError) {
      throw ticketError;
    }

    const normalized = await Promise.all(
      (ticketRows ?? []).map(async (ticket) => {
        const [eventResult, ticketTypeResult] = await Promise.all([
          supabase
            .from("events")
            .select("id, title, date, location")
            .eq("id", ticket.eventId)
            .maybeSingle(),
          supabase
            .from("ticket_types")
            .select("name, price, category")
            .eq("id", ticket.ticketTypeId)
            .maybeSingle(),
        ]);

        return {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          isUsed: ticket.isUsed,
          createdAt: ticket.createdAt,
          event: eventResult.data ?? null,
          ticketType: ticketTypeResult.data ?? null,
        };
      }),
    );

    // Compute loyalty points from loyalty_points table (sum of points for the user)
    let loyaltyPoints = 0;
    try {
      const { data: lpRows, error: lpError } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("userId", userResult.data.id);

      if (!lpError && Array.isArray(lpRows)) {
        loyaltyPoints = lpRows.reduce((s, r: any) => s + Number(r.points || 0), 0);
      }
    } catch (e) {
      // ignore and default to 0
    }

    return NextResponse.json({
      success: true,
      data: normalized,
      loyaltyPoints,
    });
  } catch (error) {
    console.error("[Customer Tickets]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}