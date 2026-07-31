import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID missing" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            paymentMethods: {
              where: { isActive: true }
            }
          }
        },
        items: {
          include: { ticketType: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Return the order, event details, and payment methods
    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("[Order GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}
