import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const allowedRoles = ["ADMIN", "OVERSEER"];
    if (!allowedRoles.includes(sessionUser.role || "")) {
      return NextResponse.json(
        { success: false, error: "Only admins can manage promotions" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, adminNote } = body;

    const supabase = getSupabase();

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (adminNote) updates.adminNote = adminNote;
    if (status === "APPROVED") {
      updates.status = "ACTIVE";
    }

    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Promotions PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update promotion" },
      { status: 500 }
    );
  }
}