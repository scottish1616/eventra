import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const rules = await prisma.commissionRule.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: {
        rules,
        defaultRule: rules.find((rule) => rule.isDefault) || null,
      },
    });
  } catch (error) {
    console.error("[Admin Settings GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { id, name, feePercent, feeFixed, minTicketPrice, isDefault } = body;

    if (!name || feePercent === undefined || feeFixed === undefined) {
      return NextResponse.json(
        { success: false, error: "Invalid commission rule payload" },
        { status: 400 },
      );
    }

    if (isDefault) {
      await prisma.commissionRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const payload = {
      name,
      feePercent: Number(feePercent),
      feeFixed: Number(feeFixed),
      minTicketPrice: Number(minTicketPrice ?? 0),
      isDefault: Boolean(isDefault),
    };

    const commissionRule = id
      ? await prisma.commissionRule.update({
          where: { id },
          data: payload,
        })
      : await prisma.commissionRule.create({
          data: payload,
        });

    return NextResponse.json({ success: true, data: commissionRule });
  } catch (error) {
    console.error("[Admin Settings POST]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save commission rule",
      },
      { status: 500 },
    );
  }
}
