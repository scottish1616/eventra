import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const commissionRule = (await prisma.commissionRule.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: "desc" },
    })) || {
      id: "default",
      name: "Standard platform rate",
      feePercent: 5,
      feeFixed: 0,
      minTicketPrice: 0,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: {
        commissionRule,
      },
    });
  } catch (error) {
    console.error("[Settings GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to load platform settings" },
      { status: 500 },
    );
  }
}
