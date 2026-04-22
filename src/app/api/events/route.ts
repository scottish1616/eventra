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
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";
    const search = searchParams.get("search") ?? "";
    const supabase = getSupabase();

    if (mine) {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.email) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

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

      const { data: events, error } = await supabase
        .from("events")
        .select("*, ticket_types(*)")
        .eq("organizerId", user.id)
        .order("date", { ascending: true });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: (events || []).map((e) => ({
          ...e,
          ticketTypes: e.ticket_types || [],
          organizer: null,
          _count: { tickets: 0, orders: 0 },
          orders: [],
        })),
      });
    }

    let query = supabase
      .from("events")
      .select("*, ticket_types(*)")
      .eq("status", "PUBLISHED")
      .order("date", { ascending: true });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (events || []).map((e) => ({
        ...e,
        ticketTypes: e.ticket_types || [],
        organizer: null,
        _count: { tickets: 0, orders: 0 },
        orders: [],
      })),
    });
  } catch (error) {
    console.error("[Events GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Not logged in — please sign in first" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found: " + (userError?.message || "unknown"),
        },
        { status: 404 }
      );
    }

    if (!["ORGANIZER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only organizers can create events. Your role: " + user.role,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      date,
      endDate,
      location,
      venue,
      ticketTypes,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Event title is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Event date is required" },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Event location is required" },
        { status: 400 }
      );
    }

    if (!ticketTypes || ticketTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one ticket type is required" },
        { status: 400 }
      );
    }

    const slug =
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 8);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title,
        description: description || null,
        date: new Date(date).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        location,
        venue: venue || null,
        status: "PUBLISHED",
        slug,
        organizerId: user.id,
        platformFeePercent: 5,
        platformFeeFixed: 0,
      })
      .select()
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Event creation failed: " + (eventError?.message || "unknown"),
        },
        { status: 500 }
      );
    }

    for (const tt of ticketTypes) {
      const { error: ttError } = await supabase
        .from("ticket_types")
        .insert({
          eventId: event.id,
          category: tt.category || "REGULAR",
          name: tt.name,
          description: tt.description || null,
          price: Number(tt.price),
          totalSlots: Number(tt.totalSlots),
          soldCount: 0,
          isActive: true,
          maxPerOrder: Number(tt.maxPerOrder) || 10,
        });

      if (ttError) {
        console.error("[Events POST] Ticket type error:", ttError.message);
      }
    }

    return NextResponse.json(
      { success: true, data: event, message: "Event created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Events POST] Error:", msg);
    return NextResponse.json(
      { success: false, error: "Server error: " + msg },
      { status: 500 }
    );
  }
}