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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    let query = supabase
      .from("promotions")
      .select(`
        *,
        users!promotions_organizerId_fkey(id, name, email, organizationName),
        events!promotions_eventId_fkey(id, title, slug)
      `)
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
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((p) => ({
        ...p,
        organizer: p.users || null,
        event: p.events || null,
      })),
    });
  } catch (error) {
    console.error("[Promotions GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email || sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Only organizers can request promotions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, type, eventId, startDate, endDate, amount } = body;

    if (!title || !type) {
      return NextResponse.json(
        { success: false, error: "Title and type are required" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("promotions")
      .insert({
        organizerId: user.id,
        title,
        description: description || null,
        type,
        status: "PENDING",
        eventId: eventId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        amount: amount || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Promotions POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create promotion request" },
      { status: 500 }
    );
  }
}