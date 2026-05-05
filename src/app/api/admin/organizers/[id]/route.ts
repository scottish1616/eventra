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
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "ORGANIZER");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Organizer deleted successfully",
    });
  } catch (error) {
    console.error("[Admin Delete Organizer]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("users")
      .update({ subscriptionStatus: body.subscriptionStatus })
      .eq("id", id)
      .select("id, name, email, subscriptionStatus")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Admin Patch Organizer]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update" },
      { status: 500 }
    );
  }
}