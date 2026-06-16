import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initiateStkPush, formatPhone } from "@/lib/mpesa";

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
    const {
      eventId,
      items,
      buyerName,
      buyerPhone,
      buyerEmail,
      paymentMethod,
    } = body;

    if (!eventId || !items || !buyerName || !buyerPhone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const { data: ticketTypes } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("eventId", eventId);

    if (!ticketTypes || ticketTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No ticket types found" },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const validatedItems: {
      tt: {
        id: string;
        name: string;
        price: number;
        soldCount: number;
        totalSlots: number;
      };
      item: { ticketTypeId: string; quantity: number };
    }[] = [];

    for (const item of items) {
      const tt = ticketTypes.find(
        (t: { id: string }) => t.id === item.ticketTypeId
      );

      if (!tt) {
        return NextResponse.json(
          { success: false, error: "Ticket type not found" },
          { status: 400 }
        );
      }

      const available = tt.totalSlots - tt.soldCount;

      if (item.quantity > available) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${available} ${tt.name} tickets remaining`,
          },
          { status: 400 }
        );
      }

      subtotal += tt.price * item.quantity;
      validatedItems.push({ tt, item });
    }

    const platformFee =
      subtotal * ((event.platformFeePercent || 0) / 100) +
      (event.platformFeeFixed || 0);
    const total = subtotal + platformFee;

    const guestEmail =
      buyerEmail ||
      `${buyerPhone.replace(/\s/g, "")}@guest.eventra.com`;

    let userId: string | null = null;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", guestEmail)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          name: buyerName,
          email: guestEmail,
          phone: buyerPhone,
          role: "USER",
          password: null,
        })
        .select("id")
        .single();

      if (userError || !newUser) {
        console.error("[Guest Checkout] User error:", userError);
        return NextResponse.json(
          { success: false, error: "Failed to create guest user" },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Failed to get user" },
        { status: 500 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        userId,
        eventId,
        status: "PENDING",
        subtotal,
        platformFee,
        total,
        buyerName,
        buyerEmail: guestEmail,
        buyerPhone,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Guest Checkout] Order error:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    for (const { tt, item } of validatedItems) {
      await supabase.from("order_items").insert({
        orderId: order.id,
        ticketTypeId: tt.id,
        quantity: item.quantity,
        unitPrice: tt.price,
        subtotal: tt.price * item.quantity,
      });
    }

    // Handle M-Pesa STK push
    if (paymentMethod === "MPESA") {
      try {
        const cleanPhone = formatPhone(buyerPhone);
        console.log("[Guest Checkout] M-Pesa phone:", cleanPhone);
        console.log("[Guest Checkout] M-Pesa amount:", total);

        const stkResult = await initiateStkPush({
          phone: cleanPhone,
          amount: total,
          orderId: order.id,
          description: `Ticket - ${event.title.substring(0, 13)}`,
        });

        await supabase.from("payments").insert({
          orderId: order.id,
          amount: total,
          method: "MPESA",
          status: "PENDING",
          mpesaCheckoutRequestId: stkResult.CheckoutRequestID,
        });

        return NextResponse.json({
          success: true,
          data: {
            orderId: order.id,
            paymentMethod: "MPESA",
            checkoutRequestId: stkResult.CheckoutRequestID,
            message:
              "M-Pesa prompt sent to your phone. Enter your PIN to complete payment.",
            tickets: [],
            awaitingPayment: true,
          },
        });
      } catch (mpesaError) {
        const msg =
          mpesaError instanceof Error
            ? mpesaError.message
            : "M-Pesa error";
        console.error("[M-Pesa STK Error]", msg);

        await supabase.from("orders").delete().eq("id", order.id);

        return NextResponse.json(
          {
            success: false,
            error: `M-Pesa failed: ${msg}`,
          },
          { status: 500 }
        );
      }
    }

    // Simulated payment flow
    await supabase.from("payments").insert({
      orderId: order.id,
      amount: total,
      method: "SIMULATED",
      status: "COMPLETED",
      paidAt: new Date().toISOString(),
    });

    await supabase
      .from("orders")
      .update({ status: "CONFIRMED" })
      .eq("id", order.id);

    const ticketIds: string[] = [];

    for (const { tt, item } of validatedItems) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketId = crypto.randomUUID();
        const ticketNumber = generateTicketNumber(event.title);
        const qrPayload = generateQrPayload(ticketId, eventId);

        const { data: ticket } = await supabase
          .from("tickets")
          .insert({
            id: ticketId,
            ticketNumber,
            userId,
            eventId,
            orderId: order.id,
            ticketTypeId: tt.id,
            attendeeName: buyerName,
            attendeeEmail: guestEmail,
            qrCode: "",
            qrCodeData: qrPayload,
          })
          .select("id")
          .single();

        if (ticket) ticketIds.push((ticket as { id: string }).id);
      }

      await supabase
        .from("ticket_types")
        .update({ soldCount: tt.soldCount + item.quantity })
        .eq("id", tt.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        paymentMethod: "SIMULATED",
        tickets: ticketIds,
        awaitingPayment: false,
      },
    });
  } catch (error) {
    console.error("[Guest Checkout]", error);
    return NextResponse.json(
      { success: false, error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}