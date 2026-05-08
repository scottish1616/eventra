import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get current date info for monthly aggregations
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

      const [eventsCount, ticketsSold, revenue] = await Promise.all([
        // Events created in this month
        prisma.event.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        // Tickets sold in this month
        prisma.ticket.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        // Revenue from completed payments in this month
        prisma.payment.aggregate({
          where: {
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
        events: eventsCount,
        tickets: ticketsSold,
        revenue: revenue._sum.amount || 0,
      });
    }

    // Get current stats
    const [
      totalEvents,
      publishedEvents,
      totalTickets,
      totalRevenue,
      totalOrganizers,
      activeOrganizers,
      pendingOrganizers,
      totalUsers,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.ticket.count(),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.user.count({
        where: {
          role: "ORGANIZER",
          approvalStatus: "APPROVED",
        },
      }),
      prisma.user.count({
        where: {
          role: "ORGANIZER",
          approvalStatus: "PENDING",
        },
      }),
      prisma.user.count(),
    ]);

    // Calculate platform fees earned
    const platformFees = await prisma.order.aggregate({
      _sum: { platformFee: true },
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Promise.all([
      prisma.event.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.ticket.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: {
          role: "ORGANIZER",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

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
          totalOrganizers,
          activeOrganizers,
          pendingOrganizers,
          totalUsers,
        },
        recentActivity: {
          eventsLast30Days: recentActivity[0],
          ticketsLast30Days: recentActivity[1],
          organizersLast30Days: recentActivity[2],
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
