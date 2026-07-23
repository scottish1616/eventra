import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSignedPayload } from "@/lib/qrcode";
import QRCode from "qrcode";

type TicketQrCodeContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  req: NextRequest,
  context: TicketQrCodeContext,
) {
  try {
    if (!context.params) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const { id } = await context.params;
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const signed = generateSignedPayload(ticket.id, ticket.eventId, ticket.orderId || undefined);
    const qrText = `eventra:${signed}`;

    const png = await QRCode.toBuffer(qrText, { type: "png", width: 400, margin: 2 });
    return new Response(png as unknown as BodyInit, { headers: { "Content-Type": "image/png" } });
  } catch (err) {
    console.error("/api/tickets/[id]/qrcode error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
