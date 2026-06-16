import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const supabase = getSupabase();

    let query = supabase
      .from("complaints")
      .select(`
        *,
        events(id, title, slug),
        users!complaints_organizerId_fkey(id, name, organizationName)
      `)
      .order("createdAt", { ascending: false });

    if (sessionUser.role === "ORGANIZER") {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", sessionUser.email!)
        .single();

      if (user) {
        query = query
          .eq("organizerId", user.id)
          .eq("assignedTo", "ORGANIZER");
      }
    } else if (sessionUser.role === "ADMIN") {
      query = query.eq("assignedTo", "ADMIN");
    }

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const enriched = await Promise.all(
      (data || []).map(async (complaint) => {
        const { data: replies } = await supabase
          .from("complaint_replies")
          .select("*")
          .eq("complaintId", complaint.id)
          .order("createdAt", { ascending: true });

        return {
          ...complaint,
          event: complaint.events || null,
          organizer: complaint.users || null,
          replies: replies || [],
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("[Complaints GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      priority,
      complainantName,
      complainantPhone,
      complainantEmail,
      eventId,
      organizerId,
    } = body;

    if (!title || !description || !complainantName || !organizerId || !eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, description, name, event and organizer are required",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("complaints")
      .insert({
        title,
        description,
        category: category || "OTHER",
        priority: priority || "MEDIUM",
        status: "PENDING",
        complainantName,
        complainantPhone: complainantPhone || null,
        complainantEmail: complainantEmail || null,
        eventId,
        organizerId,
        assignedTo: "ORGANIZER",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[Complaints POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit complaint" },
      { status: 500 }
    );
  }
}