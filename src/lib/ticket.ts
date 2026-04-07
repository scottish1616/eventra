import { prisma } from "./prisma";
import { generateQRCode, generateQrPayload } from "./qrcode";

function generateTicketNumber(prefix: string = "EVT"): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${random}`;
}

export async function issueTicketsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { ticketType: true } },
      event: true,
      user: true,
    },
  });

  if (!order) throw new Error("Order not found: " + orderId);

  const existing = await prisma.ticket.findMany({ where: { orderId } });
  if (existing.length > 0) return existing;

  const tickets = [];

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketNumber = generateTicketNumber(
        order.event.title.substring(0, 3).toUpperCase(),
      );

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          userId: order.userId,
          eventId: order.eventId,
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          attendeeName: order.buyerName,
          attendeeEmail: order.buyerEmail,
          qrCode: "",
          qrCodeData: "",
        },
      });

      const qrPayload = generateQrPayload(ticket.id, order.eventId);
      const qrCode = await generateQRCode(qrPayload);

      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrCode, qrCodeData: qrPayload },
      });

      tickets.push(updated);
    }

    await prisma.ticketType.update({
      where: { id: item.ticketTypeId },
      data: { soldCount: { increment: item.quantity } },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED" },
  });

  return tickets;
}
