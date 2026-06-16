import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user owns this ticket or is admin
    if (ticket.attendeeEmail !== user.email && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        qrCodeData: ticket.qrCodeData,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        isUsed: ticket.isUsed,
        createdAt: ticket.createdAt.toISOString(),
        event: ticket.event,
        ticketType: ticket.ticketType,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
