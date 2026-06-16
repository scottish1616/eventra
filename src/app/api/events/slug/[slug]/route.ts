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
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = getSupabase();

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const { data: ticketTypes } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("eventId", event.id)
      .eq("isActive", true)
      .order("price", { ascending: true });

    const { data: organizer } = await supabase
      .from("users")
      .select("name, organizationName")
      .eq("id", event.organizerId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        ticketTypes: ticketTypes || [],
        organizer: organizer || null,
      },
    });
  } catch (error) {
    console.error("[Event by slug]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}