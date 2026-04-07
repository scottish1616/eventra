import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "organizer@eventra.app" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in database" });
    }

    const isValid = await compare("password", user.password!);

    return NextResponse.json({
      userFound: true,
      email: user.email,
      role: user.role,
      passwordHashPrefix: user.password?.substring(0, 10),
      passwordMatchResult: isValid,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
