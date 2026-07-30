import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get("number");

    if (!number) {
      return NextResponse.json(
        { success: false, error: "Ticket number required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const normalized = number.trim().toUpperCase();

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("id, ticketNumber")
      .or(`ticketNumber.ilike.%${normalized}%,ticketNumber.eq.${normalized}`)
      .limit(10);

    if (error) {
      console.error("[Ticket Lookup]", error);
      return NextResponse.json(
        { success: false, error: "Failed to lookup ticket" },
        { status: 500 }
      );
    }

    const ticket = tickets?.[0];

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found. Check your ticket number and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("[Ticket Lookup]", error);
    return NextResponse.json(
      { success: false, error: "Failed to lookup ticket" },
      { status: 500 }
    );
  }
}