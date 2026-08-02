import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function countRows(rows: any[] | null) {
  return rows?.length ?? 0;
}

function sumNumbers(rows: any[] | null, field: string) {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.[field] ?? 0) || 0), 0);
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = getSupabase();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyData: Array<{ month: string; events: number; tickets: number; revenue: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const [eventsQuery, ticketsQuery, paymentsQuery] = await Promise.all([
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("createdAt", startOfMonth.toISOString())
          .lte("createdAt", endOfMonth.toISOString()),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .gte("createdAt", startOfMonth.toISOString())
          .lte("createdAt", endOfMonth.toISOString()),
        supabase
          .from("payments")
          .select("amount, status, paidAt")
          .eq("status", "COMPLETED")
          .gte("paidAt", startOfMonth.toISOString())
          .lte("paidAt", endOfMonth.toISOString()),
      ]);

      if (eventsQuery.error) throw eventsQuery.error;
      if (ticketsQuery.error) throw ticketsQuery.error;
      if (paymentsQuery.error) throw paymentsQuery.error;

      monthlyData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        events: eventsQuery.count ?? 0,
        tickets: ticketsQuery.count ?? 0,
        revenue: sumNumbers(paymentsQuery.data, "amount"),
      });
    }

    const [eventsAll, eventsPublished, ticketsAll, paymentsAll, organizersAll, organizersApproved, organizersPending, usersAll, ordersAll] = await Promise.all([
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
      supabase.from("tickets").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount, status").eq("status", "COMPLETED"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "ORGANIZER"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "ORGANIZER").eq("approvalStatus", "APPROVED"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "ORGANIZER").eq("approvalStatus", "PENDING"),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("platformFee"),
    ]);

    if (eventsAll.error) throw eventsAll.error;
    if (eventsPublished.error) throw eventsPublished.error;
    if (ticketsAll.error) throw ticketsAll.error;
    if (paymentsAll.error) throw paymentsAll.error;
    if (organizersAll.error) throw organizersAll.error;
    if (organizersApproved.error) throw organizersApproved.error;
    if (organizersPending.error) throw organizersPending.error;
    if (usersAll.error) throw usersAll.error;
    if (ordersAll.error) throw ordersAll.error;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentEvents, recentTickets, recentOrganizers] = await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("createdAt", thirtyDaysAgo.toISOString()),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .gte("createdAt", thirtyDaysAgo.toISOString()),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "ORGANIZER")
        .gte("createdAt", thirtyDaysAgo.toISOString()),
    ]);

    if (recentEvents.error) throw recentEvents.error;
    if (recentTickets.error) throw recentTickets.error;
    if (recentOrganizers.error) throw recentOrganizers.error;

    return NextResponse.json({
      success: true,
      data: {
        monthlyData,
        currentStats: {
          totalEvents: eventsAll.count ?? 0,
          publishedEvents: eventsPublished.count ?? 0,
          totalTickets: ticketsAll.count ?? 0,
          totalRevenue: sumNumbers(paymentsAll.data, "amount"),
          platformFees: sumNumbers(ordersAll.data, "platformFee"),
          totalOrganizers: organizersAll.count ?? 0,
          activeOrganizers: organizersApproved.count ?? 0,
          pendingOrganizers: organizersPending.count ?? 0,
          totalUsers: usersAll.count ?? 0,
        },
        recentActivity: {
          eventsLast30Days: recentEvents.count ?? 0,
          ticketsLast30Days: recentTickets.count ?? 0,
          organizersLast30Days: recentOrganizers.count ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Analytics API]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
