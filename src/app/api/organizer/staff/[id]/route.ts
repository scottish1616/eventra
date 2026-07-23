import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email || sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const supabase = getSupabase();

    const { data: organizer } = await supabase
      .from("users")
      .select("id")
      .eq("email", sessionUser.email)
      .single();

    if (!organizer) {
      return NextResponse.json(
        { success: false, error: "Organizer not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id)
      .eq("organizerId", organizer.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member removed",
    });
  } catch (error) {
    console.error("[Staff DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove staff" },
      { status: 500 }
    );
  }
}