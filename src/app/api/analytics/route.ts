import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get organizer's user record
    const organizer = await prisma.user.findUnique({
      where: { email: sessionUser.email! },
      select: { id: true },
    });

    if (!organizer) {
      return NextResponse.json(
        { success: false, error: "Organizer not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get monthly data for the last 12 months
    const monthlyData = [];
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

      const [ticketsSold, revenue] = await Promise.all([
        // Tickets sold for organizer's events in this month
        prisma.ticket.count({
          where: {
            event: {
              organizerId: organizer.id,
            },
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        // Revenue from organizer's events in this month
        prisma.payment.aggregate({
          where: {
            order: {
              event: {
                organizerId: organizer.id,
              },
            },
            status: "COMPLETED",
            paidAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      monthlyData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        tickets: ticketsSold,
        revenue: revenue._sum.amount || 0,
      });
    }

    // Get current stats for organizer
    const [
      totalEvents,
      publishedEvents,
      totalTickets,
      totalRevenue,
      totalAttendees,
      upcomingEvents,
    ] = await Promise.all([
      prisma.event.count({
        where: { organizerId: organizer.id },
      }),
      prisma.event.count({
        where: {
          organizerId: organizer.id,
          status: "PUBLISHED",
        },
      }),
      prisma.ticket.count({
        where: {
          event: { organizerId: organizer.id },
        },
      }),
      prisma.payment.aggregate({
        where: {
          order: {
            event: { organizerId: organizer.id },
          },
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
      // Unique attendees across all events
      prisma.ticket
        .groupBy({
          by: ["userId"],
          where: {
            event: { organizerId: organizer.id },
          },
          _count: true,
        })
        .then((groups) => groups.length),
      prisma.event.count({
        where: {
          organizerId: organizer.id,
          status: "PUBLISHED",
          date: { gte: now },
        },
      }),
    ]);

    // Get platform fees deducted
    const platformFees = await prisma.order.aggregate({
      where: {
        event: { organizerId: organizer.id },
      },
      _sum: { platformFee: true },
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Promise.all([
      prisma.event.count({
        where: {
          organizerId: organizer.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.ticket.count({
        where: {
          event: { organizerId: organizer.id },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Get top performing events
    const topEvents = await prisma.event.findMany({
      where: { organizerId: organizer.id },
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        _count: {
          select: { tickets: true },
        },
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: {
        tickets: {
          _count: "desc",
        },
      },
      take: 5,
    });

    const topEventsWithRevenue = topEvents.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      status: event.status,
      ticketsSold: event._count.tickets,
      revenue: event.orders.reduce((sum, order) => sum + order.total, 0),
    }));

    return NextResponse.json({
      success: true,
      data: {
        monthlyData,
        currentStats: {
          totalEvents,
          publishedEvents,
          totalTickets,
          totalRevenue: totalRevenue._sum.amount || 0,
          platformFees: platformFees._sum.platformFee || 0,
          totalAttendees,
          upcomingEvents,
        },
        recentActivity: {
          eventsLast30Days: recentActivity[0],
          ticketsLast30Days: recentActivity[1],
        },
        topEvents: topEventsWithRevenue,
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
