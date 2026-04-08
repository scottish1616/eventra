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

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", sessionUser.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        events!tickets_eventId_fkey(title, date, location, venue),
        ticket_types!tickets_ticketTypeId_fkey(name, price, category)
      `,
      )
      .eq("userId", user.id)
      .order("createdAt", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const formatted = (tickets || []).map((t) => ({
      ...t,
      event: t.events,
      ticketType: t.ticket_types,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[GET /api/tickets/my]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}
