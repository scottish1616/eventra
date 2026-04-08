import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Please log in to purchase tickets" },
        { status: 401 }
      );
    }

    const body = await req.json();
    return NextResponse.json({ success: false, error: "Use guest checkout instead" }, { status: 400 });
  } catch (error) {
    console.error("[Checkout]", error);
    return NextResponse.json({ success: false, error: "Checkout failed" }, { status: 500 });
  }
}