import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", sessionUser.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[Profile GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { name, phone, organizationName, organizationLogo, mpesaPaybill } =
      body;

    const supabase = getSupabase();

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (organizationName !== undefined)
      updates.organizationName = organizationName
        ? organizationName.trim()
        : null;
    if (organizationLogo !== undefined)
      updates.organizationLogo = organizationLogo || null;
    if (mpesaPaybill !== undefined)
      updates.mpesaPaybill = mpesaPaybill ? mpesaPaybill.trim() : null;

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", sessionUser.id)
      .select()
      .single();

    if (error || !user) {
      console.error("[Profile PATCH]", error);
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[Profile PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
