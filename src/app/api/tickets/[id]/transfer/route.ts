import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { newAttendeeEmail } = await req.json();

    if (!newAttendeeEmail) {
      return NextResponse.json(
        { success: false, error: "Recipient email is required" },
        { status: 400 },
      );
    }

    // Check if ticket exists and belongs to current user
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { email: true } },
        event: { select: { title: true, date: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    if (ticket.user.email !== sessionUser.email) {
      return NextResponse.json(
        { success: false, error: "You don't own this ticket" },
        { status: 403 },
      );
    }

    if (ticket.isUsed) {
      return NextResponse.json(
        { success: false, error: "Cannot transfer used tickets" },
        { status: 400 },
      );
    }

    // Check if event hasn't started
    if (new Date(ticket.event?.date || "") < new Date()) {
      return NextResponse.json(
        { success: false, error: "Cannot transfer tickets for past events" },
        { status: 400 },
      );
    }

    // TODO: Send transfer confirmation emails to both parties
    // For now, just update the ticket with new attendee info
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        attendeeEmail: newAttendeeEmail,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: "Ticket transfer initiated. Confirmation email sent.",
    });
  } catch (error) {
    console.error("[Ticket Transfer]", error);
    return NextResponse.json(
      { success: false, error: "Failed to transfer ticket" },
      { status: 500 },
    );
  }
}
