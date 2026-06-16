import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySignedPayload } from "@/lib/qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string | undefined = body?.code || body?.signed;
    if (!code) return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 });

    const raw = code.startsWith("eventra:") ? code.replace(/^eventra:/, "") : code;
    const payload = verifySignedPayload(raw);
    if (!payload) return NextResponse.json({ success: false, error: "Invalid or tampered code" }, { status: 400 });

    const ticket = await prisma.ticket.findUnique({ where: { id: payload.t } });
    if (!ticket) return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });

    if (ticket.isUsed) {
      return NextResponse.json({ success: false, used: true, ticketNumber: ticket.ticketNumber });
    }

    const updated = await prisma.ticket.update({ where: { id: ticket.id }, data: { isUsed: true, usedAt: new Date() } });

    return NextResponse.json({ success: true, ticketNumber: updated.ticketNumber });
  } catch (err) {
    console.error("/api/tickets/validate error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
