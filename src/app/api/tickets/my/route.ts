import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: user.id,
      },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            location: true,
            venue: true,
          },
        },
        ticketType: {
          select: {
            name: true,
            price: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error("[GET /api/tickets/my]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}
