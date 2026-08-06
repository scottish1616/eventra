import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function generateQrPayload(ticketId: string, eventId: string): string {
  return `eventra:ticket:${ticketId}:${eventId}:${Date.now()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, code } = body;

    if (!orderId || !code) {
      return NextResponse.json(
        { success: false, error: "Missing orderId or code" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const confirmationCode = String(code).trim().toUpperCase();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, event:events(*), items:order_items(*, ticketType:ticket_types(*))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "CONFIRMED") {
      const { data: existingTickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("orderId", order.id);

      return NextResponse.json({
        success: true,
        tickets: existingTickets?.map((ticket) => ticket.id) || [],
      });
    }

    if (order.sessionExpiresAt && new Date() > new Date(order.sessionExpiresAt)) {
      await supabase
        .from("orders")
        .update({ status: "CANCELLED" })
        .eq("id", order.id);

      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    let { data: paymentRow } = await supabase
      .from("payments")
      .select("id, method, status, amount")
      .eq("orderId", order.id)
      .maybeSingle();

    if (!paymentRow) {
      const fallbackMethod = String(order.paymentMethod || "SIMULATED")
        .toUpperCase()
        .trim();

      const { data: createdPayment, error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
          id: crypto.randomUUID(),
          orderId: order.id,
          amount: order.total,
          method: fallbackMethod,
          status: "PENDING",
          createdAt: now,
          updatedAt: now,
        })
        .select("id, method, status, amount")
        .single();

      if (paymentInsertError || !createdPayment) {
        return NextResponse.json(
          { success: false, error: "Payment record not found" },
          { status: 400 }
        );
      }

      paymentRow = createdPayment;
    }

    if (paymentRow.status === "COMPLETED") {
      return NextResponse.json({ success: true, tickets: [] });
    }

    const ticketIds: string[] = [];

    for (const item of order.items || []) {
      const ticketType = item.ticketType;
      if (!ticketType) continue;

      for (let i = 0; i < item.quantity; i++) {
        const ticketId = crypto.randomUUID();
        const ticketNumber = generateTicketNumber(order.event.title);
        const qrPayload = generateQrPayload(ticketId, order.eventId);

        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            id: ticketId,
            ticketNumber,
            userId: order.userId,
            eventId: order.eventId,
            orderId: order.id,
            ticketTypeId: item.ticketTypeId,
            attendeeName: order.buyerName,
            attendeeEmail: order.buyerEmail,
            qrCode: "",
            qrCodeData: qrPayload,
            createdAt: now,
            updatedAt: now,
          })
          .select("id")
          .single();

        if (ticketError) {
          throw ticketError;
        }

        if (ticket) {
          ticketIds.push(ticket.id);
        }
      }

      await supabase
        .from("ticket_types")
        .update({ soldCount: (ticketType.soldCount || 0) + item.quantity })
        .eq("id", item.ticketTypeId);
    }

    await supabase
      .from("payments")
      .update({
        status: "COMPLETED",
        method: paymentRow.method || "SIMULATED",
        paidAt: now,
        amount: order.total,
        updatedAt: now,
      })
      .eq("id", paymentRow.id);

    await supabase
      .from("orders")
      .update({
        status: "CONFIRMED",
        updatedAt: now,
      })
      .eq("id", order.id);

    await supabase.from("notifications").insert({
      userId: order.userId,
      title: "Payment Successful",
      message: `Your payment of KES ${order.total} for ${order.event.title} was successful.`,
    });

    return NextResponse.json({
      success: true,
      tickets: ticketIds,
      confirmationCode: confirmationCode,
    });
  } catch (error) {
    console.error("[Verify Payment]", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
