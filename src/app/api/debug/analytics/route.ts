import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Protected debug endpoint. Set DEBUG_TOKEN in environment and call with header
// `x-debug-token: <token>` to access.
export async function GET(req: Request) {
  try {
    const token = req.headers.get("x-debug-token") || "";
    if (!process.env.DEBUG_TOKEN || token !== process.env.DEBUG_TOKEN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [eventsCount, publishedCount, ticketsCount, organizersCount] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.ticket.count(),
      prisma.user.count({ where: { role: { in: ["ORGANIZER", "organizer"] } } }),
    ]);

    const supabase = getSupabase();
    // Supabase counts (service role key used in server)
    const [sEvents, sTickets, sOrgs] = await Promise.all([
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).in("role", ["ORGANIZER", "organizer"]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        prisma: { events: eventsCount, published: publishedCount, tickets: ticketsCount, organizers: organizersCount },
        supabase: {
          events: sEvents.error ? null : sEvents.count ?? null,
          tickets: sTickets.error ? null : sTickets.count ?? null,
          organizers: sOrgs.error ? null : sOrgs.count ?? null,
        },
      },
    });
  } catch (error) {
    console.error("[Debug analytics]", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
