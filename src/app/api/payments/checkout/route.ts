import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent } from "@/lib/stripe";
import { initiateStkPush } from "@/lib/mpesa";
import { issueTicketsForOrder } from "@/lib/tickets";

const schema = z.object({
  eventId: z.string(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  buyerName: z.string().min(2),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().optional(),
  paymentMethod: z.enum(["STRIPE", "MPESA", "SIMULATED"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Please log in to purchase tickets" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { eventId, items, buyerName, buyerEmail, buyerPhone, paymentMethod } =
      parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId, status: "PUBLISHED" },
      include: { ticketTypes: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
      if (!tt) {
        return NextResponse.json(
          { success: false, error: "Ticket type not found" },
          { status: 400 },
        );
      }
      const available = tt.totalSlots - tt.soldCount;
      if (item.quantity > available) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${available} ${tt.name} tickets left`,
          },
          { status: 400 },
        );
      }
      const itemSubtotal = tt.price * item.quantity;
      subtotal += itemSubtotal;
      validatedItems.push({ tt, item, itemSubtotal });
    }

    const platformFee =
      subtotal * (event.platformFeePercent / 100) + event.platformFeeFixed;
    const total = subtotal + platformFee;

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        eventId,
        status: "PENDING",
        subtotal,
        platformFee,
        total,
        buyerName,
        buyerEmail,
        buyerPhone,
        items: {
          create: validatedItems.map(({ tt, item, itemSubtotal }) => ({
            ticketTypeId: tt.id,
            quantity: item.quantity,
            unitPrice: tt.price,
            subtotal: itemSubtotal,
          })),
        },
      },
    });

    if (paymentMethod === "SIMULATED") {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: "SIMULATED",
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });
      const tickets = await issueTicketsForOrder(order.id);
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          paymentMethod: "SIMULATED",
          tickets: tickets.map((t) => t.id),
        },
      });
    }

    if (paymentMethod === "STRIPE") {
      const intent = await createPaymentIntent(total, {
        orderId: order.id,
        eventId,
        userId: session.user.id,
        buyerEmail,
      });
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: "STRIPE",
          status: "PENDING",
          stripePaymentIntentId: intent.id,
        },
      });
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          paymentMethod: "STRIPE",
          clientSecret: intent.client_secret,
          amount: total,
        },
      });
    }

    if (paymentMethod === "MPESA") {
      if (!buyerPhone) {
        return NextResponse.json(
          { success: false, error: "Phone number required for M-Pesa" },
          { status: 400 },
        );
      }
      const stk = await initiateStkPush({
        phoneNumber: buyerPhone,
        amount: total,
        orderId: order.id,
        description: event.title,
      });
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: "MPESA",
          status: "PENDING",
          mpesaCheckoutRequestId: stk.checkoutRequestId,
          mpesaMerchantRequestId: stk.merchantRequestId,
          mpesaPhoneNumber: buyerPhone,
        },
      });
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          paymentMethod: "MPESA",
          checkoutRequestId: stk.checkoutRequestId,
          customerMessage: stk.customerMessage,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid payment method" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[Checkout]", error);
    return NextResponse.json(
      { success: false, error: "Checkout failed. Please try again." },
      { status: 500 },
    );
  }
}
