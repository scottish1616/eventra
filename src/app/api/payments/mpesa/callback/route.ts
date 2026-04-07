import { NextRequest, NextResponse } from "next/server";
import { parseMpesaCallback } from "@/lib/mpesa";
import { issueTicketsForOrder } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = parseMpesaCallback(body);

    const payment = await prisma.payment.findFirst({
      where: { mpesaCheckoutRequestId: result.checkoutRequestId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          mpesaReceiptNumber: result.receiptNumber,
          paidAt: new Date(),
        },
      });
      await issueTicketsForOrder(payment.orderId);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("[M-Pesa Callback]", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" });
  }
}
