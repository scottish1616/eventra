import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { PrismaClient } from "@prisma/client";
import { issueTicketsForOrder } from "@/lib/tickets";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, code } = body;

    if (!orderId || !code) {
      return NextResponse.json({ success: false, error: "Missing orderId or code" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status === "CONFIRMED") {
      return NextResponse.json({ success: false, error: "Order is already confirmed" }, { status: 400 });
    }

    if (order.sessionExpiresAt && new Date() > new Date(order.sessionExpiresAt)) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }
      });
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 400 });
    }

    const transaction = await prisma.mpesaTransaction.findUnique({
      where: { confirmationCode: code }
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Invalid confirmation code" }, { status: 400 });
    }

    if (transaction.isUsed) {
      return NextResponse.json({ success: false, error: "Confirmation code already used" }, { status: 400 });
    }

    if (transaction.amount < order.total) {
      return NextResponse.json({ success: false, error: "Insufficient payment amount" }, { status: 400 });
    }

    // Process transaction and update order
    await prisma.$transaction(async (tx) => {
      // Mark transaction as used
      await tx.mpesaTransaction.update({
        where: { id: transaction.id },
        data: { isUsed: true, usedAt: new Date() }
      });

      // Update Order
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" }
      });

      // Create Payment
      await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          amount: order.total,
          status: "COMPLETED",
          method: "MPESA",
          mpesaReceiptNumber: code,
          paidAt: new Date(),
        },
        create: {
          orderId: order.id,
          amount: order.total,
          currency: "KES",
          status: "COMPLETED",
          method: "MPESA",
          mpesaReceiptNumber: code,
          paidAt: new Date(),
        }
      });

      // Notifications
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: "Payment Successful",
          message: `Your payment of KES ${order.total} for ${order.event.title} was successful.`
        }
      });
      await tx.notification.create({
        data: {
          userId: order.event.organizerId,
          title: "New Ticket Sale",
          message: `You sold a ticket for ${order.event.title} (KES ${order.total}).`
        }
      });
    });

    // Generate Tickets outside the transaction since issueTicketsForOrder uses its own db connections sequentially
    const generatedTickets = await issueTicketsForOrder(order.id);
    const ticketIds = generatedTickets.map(t => t.id);

    return NextResponse.json({ success: true, tickets: ticketIds });
  } catch (error) {
    console.error("[Verify Payment]", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
