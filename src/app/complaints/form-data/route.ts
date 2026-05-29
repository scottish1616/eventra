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

    const { data: events } = await supabase
      .from("events")
      .select("id, title, organizerId, date, location")
      .eq("status", "PUBLISHED")
      .order("date", { ascending: false });

    const { data: organizers } = await supabase
      .from("users")
      .select("id, name, organizationName, email")
      .eq("role", "ORGANIZER")
      .eq("subscriptionStatus", "active");

    return NextResponse.json({
      success: true,
      data: {
        events: events || [],
        organizers: organizers || [],
      },
    });
  } catch (error) {
    console.error("[Complaint Form Data]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch form data" },
      { status: 500 }
    );
  }
}