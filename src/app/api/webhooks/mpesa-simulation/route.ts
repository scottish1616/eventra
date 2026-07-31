import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, confirmationCode, paymentType, paybillNumber, tillNumber, recipientPhone } = body;

    if (!amount || !confirmationCode || !paymentType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const tx = await prisma.mpesaTransaction.create({
      data: {
        confirmationCode,
        amount,
        paymentType,
        paybillNumber,
        tillNumber,
        recipientPhone
      }
    });

    return NextResponse.json({ success: true, data: tx });
  } catch (error) {
    console.error("[Mpesa Simulation]", error);
    return NextResponse.json({ success: false, error: "Simulation failed" }, { status: 500 });
  }
}
