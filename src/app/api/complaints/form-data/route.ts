import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const [{ data: organizers, error: organizersError }, { data: events, error: eventsError }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, name, organizationName, email")
          .eq("role", "ORGANIZER"),
        supabase
          .from("events")
          .select("id, title, organizerId, date, location")
          .order("date", { ascending: true }),
      ]);

    if (organizersError) {
      console.error("[Complaint form-data] organizers error", organizersError);
      return NextResponse.json(
        { success: false, error: organizersError.message },
        { status: 500 }
      );
    }

    if (eventsError) {
      console.error("[Complaint form-data] events error", eventsError);
      return NextResponse.json(
        { success: false, error: eventsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizers: organizers || [],
        events: events || [],
      },
    });
  } catch (error) {
    console.error("[Complaint form-data] error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load complaint form data" },
      { status: 500 }
    );
  }
}
