import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { eventId, rating, comment } = body;

    if (!eventId || !rating) {
      return NextResponse.json(
        { success: false, error: "Event and rating are required" },
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

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("userId", user.id)
      .eq("eventId", eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this event" },
        { status: 409 }
      );
    }

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        userId: user.id,
        eventId,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (reviewError) {
      return NextResponse.json(
        { success: false, error: reviewError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("loyalty_points")
      .insert({
        userId: user.id,
        points: 10,
        reason: "Left a review",
        eventId,
      });

    await supabase
      .from("users")
      .update({
        loyaltyPoints: supabase.rpc("increment", { value: 10 }),
      })
      .eq("id", user.id);

    return NextResponse.json(
      { success: true, data: review },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Reviews POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    const supabase = getSupabase();

    let query = supabase
      .from("reviews")
      .select(`
        *,
        users!reviews_userId_fkey(name)
      `)
      .order("createdAt", { ascending: false });

    if (eventId) {
      query = query.eq("eventId", eventId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("[Reviews GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}