import { NextRequest, NextResponse } from "next/server";
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
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from("complaints")
      .select("*")
      .order("createdAt", { ascending: false });

    if (sessionUser.role === "ORGANIZER") {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", sessionUser.email!)
        .single();
      if (user) query = query.eq("organizerId", user.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("[Complaints GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, message, complainantName, complainantPhone, eventId, organizerId, type } = body;

    if (!subject || !message || !complainantName) {
      return NextResponse.json(
        { success: false, error: "Subject, message and name are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("complaints")
      .insert({
        subject,
        message,
        complainantName,
        complainantPhone: complainantPhone || null,
        eventId: eventId || null,
        organizerId: organizerId || null,
        type: type || "ATTENDEE",
        status: "OPEN",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[Complaints POST]", error);
    return NextResponse.json({ success: false, error: "Failed to submit complaint" }, { status: 500 });
  }
}