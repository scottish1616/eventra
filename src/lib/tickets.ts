import { prisma } from "@/lib/prisma";
import { generateQRCode } from "@/lib/qrcode";

export async function issueTicketsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          ticketType: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const tickets = [];

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketNumber = `${order.eventId.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const qrCodeData = `${orderId}:${ticketNumber}`;
      const qrCode = await generateQRCode(qrCodeData);

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          userId: order.userId,
          eventId: order.eventId,
          orderId,
          ticketTypeId: item.ticketTypeId,
          qrCode,
          qrCodeData,
          attendeeName: order.buyerName,
          attendeeEmail: order.buyerEmail,
        },
      });
      tickets.push(ticket);
    }

    // Update soldCount for this ticket type
    await prisma.ticketType.update({
      where: { id: item.ticketTypeId },
      data: {
        soldCount: {
          increment: item.quantity,
        },
      },
    });
  }

  return tickets;
}
