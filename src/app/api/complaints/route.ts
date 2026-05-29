import { NextRequest, NextResponse } from "next/server";
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
    console.log("[Complaints GET] sessionUser:", sessionUser);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
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
    } else if (sessionUser.role === "USER") {
      if (sessionUser.email) {
        query = query.eq("complainantEmail", sessionUser.email);
      } else if (sessionUser.name) {
        query = query.eq("complainantName", sessionUser.name);
      }
    }

    let data: any[] | null = null;
    let error: any = null;

    try {
      const res = await query;
      data = res.data;
      error = res.error;
    } catch (err) {
      error = err;
    }

    // If the schema is missing optional columns (e.g. 'category'), retry with a safe select
    if (error) {
      console.error("[Complaints GET] supabase error:", error?.message || error);
      const msg = (error?.message || "").toString();
      if (msg.includes("Could not find") || msg.includes("column \"category\"")) {
        // retry selecting a minimal set of known fields
        const safeQuery = supabase
          .from("complaints")
          .select(
            "id, subject, message, complainantName, complainantPhone, eventId, type, status, response, createdAt, updatedAt, organizerId, eventName, organizerName",
          )
          .order("createdAt", { ascending: false });

        const safeRes = await safeQuery;
        if (safeRes.error) {
          console.error("[Complaints GET] safeQuery error:", safeRes.error);
          return NextResponse.json(
            { success: false, error: safeRes.error.message || "Failed to fetch complaints" },
            { status: 500 },
          );
        }

        data = safeRes.data || [];
      } else {
        return NextResponse.json(
          { success: false, error: error.message || "Failed to fetch complaints" },
          { status: 500 },
        );
      }
    }

    // Normalize DB shape to the UI shape expected by the ComplaintsCenter component
    const normalized = (data || []).map((c: any) => ({
      id: c.id,
      title: c.subject || c.title || "",
      description: c.message || c.description || "",
      category: c.category || c.category_type || "OTHER",
      priority: c.priority || "LOW",
      status: c.status || "PENDING",
      type: c.type || "ATTENDEE",
      complainantName: c.complainantName || c.complainant_name || "",
      complainantPhone: c.complainantPhone || c.complainant_phone || null,
      complainantEmail: c.complainantEmail || c.complainant_email || null,
      eventId: c.eventId || c.event_id || null,
      organizerId: c.organizerId || c.organizer_id || null,
      eventName: c.eventName || c.event_name || c.event?.title || null,
      organizerName: c.organizerName || c.organizer_name || null,
    }));

    return NextResponse.json({ success: true, data: normalized }, { status: 200 });
  } catch (error) {
    console.error("[Complaints GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
      { status: 500 },
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subject,
      message,
      complainantName,
      complainantPhone,
      complainantEmail,
      category,
      priority,
      eventId,
      organizerId,
      eventName,
      organizerName,
      type,
    } = body;

    if (!subject || !message || !complainantName) {
      return NextResponse.json(
        { success: false, error: "Subject, message and name are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    let targetOrganizerId = organizerId || null;
    if (!targetOrganizerId && eventId) {
      const eventRes = await supabase
        .from("events")
        .select("organizerId")
        .eq("id", eventId)
        .single();
      if (eventRes.data?.organizerId) {
        targetOrganizerId = eventRes.data.organizerId;
      }
    }

    const { data, error } = await supabase
      .from("complaints")
      .insert({
        subject,
        message,
        category: category || "OTHER",
        priority: priority || "MEDIUM",
        complainantName,
        complainantPhone: complainantPhone || null,
        complainantEmail: complainantEmail || null,
        eventId: eventId || null,
        organizerId: targetOrganizerId,
        eventName: eventName || null,
        organizerName: organizerName || null,
        type: type || "ATTENDEE",
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[Complaints POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit complaint" },
      { status: 500 },
    );
  }
}
