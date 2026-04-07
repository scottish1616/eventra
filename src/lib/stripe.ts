import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export async function createPaymentIntent(
  amountKES: number,
  metadata: {
    orderId: string;
    eventId: string;
    userId: string;
    buyerEmail: string;
  },
) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountKES * 100),
    currency: "kes",
    metadata,
    automatic_payment_methods: { enabled: true },
    receipt_email: metadata.buyerEmail,
  });
}

export function constructWebhookEvent(rawBody: Buffer, signature: string) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
