import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSignedPayload } from "@/lib/qrcode";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const signed = generateSignedPayload(ticket.id, ticket.eventId, ticket.orderId || undefined);
    const qrText = `eventra:${signed}`;

    const png = await QRCode.toBuffer(qrText, { type: "png", width: 400, margin: 2 });
    return new Response(png, { headers: { "Content-Type": "image/png" } });
  } catch (err) {
    console.error("/api/tickets/[id]/qrcode error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
