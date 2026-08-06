import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
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
    const { name, email, password, phone, organizationName, role } = body;

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, password, and organization name are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await hash(password, 10);

    // Create organizer account with PENDING approval status
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        role: role || "ORGANIZER",
        organizationName: organizationName.trim(),
        approvalStatus: "PENDING",
      })
      .select("id, name, email, role, approvalStatus")
      .single();

    if (error || !user) {
      console.error("[Organizer Register]", error);
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 },
      );
    }

    // TODO: Send verification email

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: "Account created successfully. Awaiting admin approval.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Organizer Register]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
