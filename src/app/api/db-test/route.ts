// src/app/api/db-test/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$connect();
    const count = await prisma.user.count();
    return NextResponse.json({ 
      success: true, 
      message: "Database connected!", 
      userCount: count 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}