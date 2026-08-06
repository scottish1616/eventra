import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID missing" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, event:events(*), items:order_items(*, ticketType:ticket_types(*))")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const { data: paymentMethods } = await supabase
      .from("event_payment_methods")
      .select("*")
      .eq("eventId", order.eventId)
      .eq("isActive", true)
      .order("isRecommended", { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        event: {
          ...order.event,
          paymentMethods: paymentMethods || [],
        },
        items: order.items || [],
      },
    });

  } catch (error) {
    console.error("[Order GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}
