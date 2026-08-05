import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function sumNumbers(rows: any[] | null, field: string) {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.[field] ?? 0) || 0), 0);
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = getSupabase();
    let organizerId = sessionUser.id;

    if (!organizerId && sessionUser.email) {
      const organizerResult = await supabase
        .from("users")
        .select("id")
        .eq("email", sessionUser.email.toLowerCase())
        .single();

      if (organizerResult.error || !organizerResult.data) {
        return NextResponse.json(
          { success: false, error: "Organizer not found" },
          { status: 404 },
        );
      }

      organizerId = organizerResult.data.id;
    }

    if (!organizerId) {
      return NextResponse.json(
        { success: false, error: "Organizer not found" },
        { status: 404 },
      );
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyData: Array<{ month: string; tickets: number; revenue: number }> = [];

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

      const [eventsForMonth, paymentsForMonth] = await Promise.all([
        supabase
          .from("events")
          .select("id")
          .eq("organizerId", organizerId)
          .gte("createdAt", startOfMonth.toISOString())
          .lte("createdAt", endOfMonth.toISOString()),
        supabase
          .from("payments")
          .select("amount, status, paidAt, orderId")
          .eq("status", "COMPLETED")
          .gte("paidAt", startOfMonth.toISOString())
          .lte("paidAt", endOfMonth.toISOString()),
      ]);

      if (eventsForMonth.error) throw eventsForMonth.error;
      if (paymentsForMonth.error) throw paymentsForMonth.error;

      const organizerEventIds = (eventsForMonth.data ?? []).map((event) => event.id);
      let ticketsSold = 0;
      if (organizerEventIds.length > 0) {
        const ticketCount = await supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .in("eventId", organizerEventIds)
          .gte("createdAt", startOfMonth.toISOString())
          .lte("createdAt", endOfMonth.toISOString());

        if (ticketCount.error) throw ticketCount.error;
        ticketsSold = ticketCount.count ?? 0;
      }

      const eligiblePaidOrders = await supabase
        .from("orders")
        .select("id, eventId")
        .in("eventId", organizerEventIds);

      if (eligiblePaidOrders.error) throw eligiblePaidOrders.error;

      const paidOrderIds = new Set((eligiblePaidOrders.data ?? []).map((order) => order.id));
      const revenueThisMonth = (paymentsForMonth.data ?? []).reduce((sum, payment) => {
        if (payment?.status === "COMPLETED" && paidOrderIds.has(payment.orderId)) {
          return sum + (Number(payment.amount) || 0);
        }
        return sum;
      }, 0);

      monthlyData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        tickets: ticketsSold,
        revenue: revenueThisMonth,
      });
    }

    const [eventsResult, publishedResult, ticketResult, ordersResult, paymentsResult, allEventsForOrganizer] = await Promise.all([
      supabase.from("events").select("id", { count: "exact", head: true }).eq("organizerId", organizerId),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("organizerId", organizerId).eq("status", "PUBLISHED"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).in("eventId", []),
      supabase.from("orders").select("platformFee, eventId").in("eventId", []),
      supabase.from("payments").select("amount, status, orderId").eq("status", "COMPLETED"),
      supabase.from("events").select("id, title, date, status, organizerId").eq("organizerId", organizerId),
    ]);

    if (eventsResult.error) throw eventsResult.error;
    if (publishedResult.error) throw publishedResult.error;
    if (ticketResult.error) throw ticketResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (allEventsForOrganizer.error) throw allEventsForOrganizer.error;

    const organizerEvents = allEventsForOrganizer.data ?? [];
    const organizerEventIds = organizerEvents.map((event) => event.id);

    let totalTickets = 0;
    let totalAttendees = 0;
    let platformFees = 0;
    let totalRevenue = 0;
    let upcomingEvents = 0;

    if (organizerEventIds.length > 0) {
      const [ticketCount, attendeeCount, orderRows, eventRevenueRows] = await Promise.all([
        supabase.from("tickets").select("id", { count: "exact", head: true }).in("eventId", organizerEventIds),
        supabase.from("tickets").select("userId").in("eventId", organizerEventIds),
        supabase.from("orders").select("id, eventId, platformFee").in("eventId", organizerEventIds),
        supabase.from("payments").select("amount, status, orderId").eq("status", "COMPLETED"),
      ]);

      if (ticketCount.error) throw ticketCount.error;
      if (attendeeCount.error) throw attendeeCount.error;
      if (orderRows.error) throw orderRows.error;
      if (eventRevenueRows.error) throw eventRevenueRows.error;

      totalTickets = ticketCount.count ?? 0;
      totalAttendees = new Set((attendeeCount.data ?? []).map((row) => row.userId)).size;
      platformFees = sumNumbers(orderRows.data, "platformFee");

      const paidOrderIds = new Set((orderRows.data ?? []).map((row) => row.id));
      totalRevenue = (eventRevenueRows.data ?? []).reduce((sum, payment) => {
        if (payment?.status === "COMPLETED" && paidOrderIds.has(payment.orderId)) {
          return sum + (Number(payment.amount) || 0);
        }
        return sum;
      }, 0);
    }

    upcomingEvents = organizerEvents.filter((event) => event.status === "PUBLISHED" && new Date(event.date) >= now).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentEvents, recentTickets] = await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("organizerId", organizerId)
        .gte("createdAt", thirtyDaysAgo.toISOString()),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("eventId", organizerEventIds)
        .gte("createdAt", thirtyDaysAgo.toISOString()),
    ]);

    if (recentEvents.error) throw recentEvents.error;
    if (recentTickets.error) throw recentTickets.error;

    const topEvents = organizerEvents
      .map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        status: event.status,
        ticketsSold: 0,
        revenue: 0,
      }))
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        monthlyData,
        currentStats: {
          totalEvents: eventsResult.count ?? 0,
          publishedEvents: publishedResult.count ?? 0,
          totalTickets,
          totalRevenue,
          platformFees,
          totalAttendees,
          upcomingEvents,
        },
        recentActivity: {
          eventsLast30Days: recentEvents.count ?? 0,
          ticketsLast30Days: recentTickets.count ?? 0,
        },
        topEvents,
      },
    });
  } catch (error) {
    console.error("[Organizer Analytics API]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
