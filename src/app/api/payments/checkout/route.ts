import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Please log in to purchase tickets" },
        { status: 401 }
      );
    }

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

    const resolvedBuyerName = buyerName || sessionUser.name || "Guest";
    const resolvedBuyerEmail =
      buyerEmail || sessionUser.email || `${buyerPhone.replace(/\s/g, "")}@guest.eventra.com`;
    const resolvedBuyerPhone = buyerPhone || "";

    let userId: string | null = null;
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", resolvedBuyerEmail)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          name: resolvedBuyerName,
          email: resolvedBuyerEmail,
          phone: resolvedBuyerPhone,
          role: "USER",
          password: null,
        })
        .select("id")
        .single();

      if (userError || !newUser) {
        console.error("[Checkout] User error:", userError);
        return NextResponse.json(
          { success: false, error: "Failed to create user" },
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
        buyerName: resolvedBuyerName,
        buyerEmail: resolvedBuyerEmail,
        buyerPhone: resolvedBuyerPhone,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Checkout] Order error:", orderError);
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

    if (paymentMethod === "MPESA") {
      try {
        const cleanPhone = formatPhone(resolvedBuyerPhone);

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
          mpesaError instanceof Error ? mpesaError.message : "M-Pesa error";
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
            attendeeName: resolvedBuyerName,
            attendeeEmail: resolvedBuyerEmail,
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

    const totalItems = validatedItems.reduce(
      (sum, v) => sum + v.item.quantity,
      0
    );
    const { data: userRecord } = await supabase
      .from("users")
      .select("role, loyaltyPoints")
      .eq("id", userId)
      .single();

    if (userRecord && ["CUSTOMER", "USER"].includes(userRecord.role)) {
      const pointsToAdd = 5 * totalItems;
      await supabase
        .from("users")
        .update({
          loyaltyPoints: (userRecord.loyaltyPoints || 0) + pointsToAdd,
        })
        .eq("id", userId);

      await supabase.from("loyalty_points").insert({
        userId,
        points: pointsToAdd,
        reason: `Purchased ${totalItems} ticket${totalItems > 1 ? "s" : ""} for ${event.title}`,
        eventId,
      });
    }

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
    console.error("[Checkout]", error);
    return NextResponse.json(
      { success: false, error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}