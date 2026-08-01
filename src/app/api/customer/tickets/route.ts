import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Look up user by id first, then fall back to email
    let user = null;

    if (sessionUser.id) {
      user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true }
      });
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: sessionUser.email },
        select: { id: true }
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        event: {
          select: { id: true, title: true, date: true, location: true }
        },
        ticketType: {
          select: { name: true, price: true, category: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const normalized = tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      isUsed: ticket.isUsed,
      createdAt: ticket.createdAt,
      event: ticket.event,
      ticketType: ticket.ticketType,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      loyaltyPoints: 0,
    });
  } catch (error) {
    console.error("[Customer Tickets]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}