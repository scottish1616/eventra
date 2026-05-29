import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMpesaCallback } from "@/lib/mpesa";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateTicketNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix.substring(0, 3).toUpperCase()}-${year}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[M-Pesa Callback]", JSON.stringify(body, null, 2));

    const result = parseMpesaCallback(body);

    const supabase = getSupabase();

    if (!result.success) {
      console.log("[M-Pesa Callback] Payment failed:", result.resultDesc);

      await supabase
        .from("payments")
        .update({ status: "FAILED" })
        .eq("mpesaCheckoutRequestId", result.checkoutRequestId);

      await supabase
        .from("orders")
        .update({ status: "CANCELLED" })
        .in(
          "id",
          (
            await supabase
              .from("payments")
              .select("orderId")
              .eq("mpesaCheckoutRequestId", result.checkoutRequestId)
          ).data?.map((p: { orderId: string }) => p.orderId) || []
        );

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { data: payment } = await supabase
      .from("payments")
      .select("orderId")
      .eq("mpesaCheckoutRequestId", result.checkoutRequestId)
      .single();

    if (!payment) {
      console.error("[M-Pesa Callback] Payment not found");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await supabase
      .from("payments")
      .update({
        status: "COMPLETED",
        mpesaReceiptNumber: result.mpesaReceiptNumber,
        paidAt: new Date().toISOString(),
      })
      .eq("mpesaCheckoutRequestId", result.checkoutRequestId);

    await supabase
      .from("orders")
      .update({ status: "CONFIRMED" })
      .eq("id", payment.orderId);

    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", payment.orderId)
      .single();

    if (!order) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", order.eventId)
      .single();

    for (const item of order.order_items || []) {
      const { data: tt } = await supabase
        .from("ticket_types")
        .select("soldCount")
        .eq("id", item.ticketTypeId)
        .single();

      for (let i = 0; i < item.quantity; i++) {
        const ticketId = crypto.randomUUID();
        const ticketNumber = generateTicketNumber(event?.title || "EVT");

        await supabase.from("tickets").insert({
          id: ticketId,
          ticketNumber,
          userId: order.userId,
          eventId: order.eventId,
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          attendeeName: order.buyerName,
          attendeeEmail: order.buyerEmail,
          qrCode: "",
          qrCodeData: `eventra:ticket:${ticketId}:${order.eventId}:${Date.now()}`,
        });
      }

      if (tt) {
        await supabase
          .from("ticket_types")
          .update({ soldCount: (tt.soldCount || 0) + item.quantity })
          .eq("id", item.ticketTypeId);
      }
    }

    console.log(
      "[M-Pesa Callback] Tickets issued for order:",
      payment.orderId
    );

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("[M-Pesa Callback Error]", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}