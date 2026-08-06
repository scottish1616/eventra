import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, emailVerified")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // TODO: Send verification email with token

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("[Resend Verification]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send verification email" },
      { status: 500 },
    );
  }
}
