import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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
        { status: 500 },
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
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { subscriptionStatus, approvalStatus, rejectionReason } = body;
    const supabase = getSupabase();

    const updates: Record<string, any> = {};
    if (subscriptionStatus !== undefined)
      updates.subscriptionStatus = subscriptionStatus;
    if (approvalStatus !== undefined) {
      updates.approvalStatus = approvalStatus;
      if (approvalStatus === "APPROVED") {
        updates.approvedBy = sessionUser.id;
        updates.approvedAt = new Date().toISOString();
      }
      if (approvalStatus === "REJECTED" && rejectionReason) {
        updates.rejectionReason = rejectionReason;
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, role, approvalStatus, subscriptionStatus")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Admin Patch Organizer]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update" },
      { status: 500 },
    );
  }
}
