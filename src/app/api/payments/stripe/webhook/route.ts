import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { issueTicketsForOrder } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const rawBody = Buffer.from(await req.arrayBuffer());
    const event = constructWebhookEvent(rawBody, signature);

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as any;
      const orderId = intent.metadata?.orderId;

      if (!orderId) {
        console.error("[Stripe Webhook] No orderId in metadata");
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intent.id as string },
        data: { status: "COMPLETED", paidAt: new Date() },
      });

      await issueTicketsForOrder(orderId);
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as { id: string };
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intent.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
