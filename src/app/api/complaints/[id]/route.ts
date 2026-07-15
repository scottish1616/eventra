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

    const { id } = await context.params;
    const body = await req.json();
    const { action, message } = body;
    const supabase = getSupabase();

    const { data: complaint } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", id)
      .single();

    if (!complaint) {
      return NextResponse.json(
        { success: false, error: "Complaint not found" },
        { status: 404 }
      );
    }

    if (action === "reply") {
      const { error: replyError } = await supabase
        .from("complaint_replies")
        .insert({
          complaintId: id,
          message,
          senderName:
            sessionUser.role === "ADMIN"
              ? "Admin"
              : sessionUser.name || "Organizer",
          senderRole: sessionUser.role || "ORGANIZER",
        });

      if (replyError) {
        return NextResponse.json(
          { success: false, error: replyError.message },
          { status: 500 }
        );
      }

      await supabase
        .from("complaints")
        .update({ status: "IN_PROGRESS", updatedAt: new Date().toISOString() })
        .eq("id", id);

      return NextResponse.json({ success: true, message: "Reply sent" });
    }

    if (action === "resolve") {
      await supabase
        .from("complaints")
        .update({
          status: "RESOLVED",
          resolvedBy: sessionUser.role,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        message: "Complaint resolved",
      });
    }

    if (action === "escalate") {
      if (sessionUser.role !== "ORGANIZER") {
        return NextResponse.json(
          { success: false, error: "Only organizers can escalate" },
          { status: 403 }
        );
      }

      await supabase
        .from("complaints")
        .update({
          status: "ESCALATED",
          assignedTo: "ADMIN",
          escalatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);

      await supabase.from("complaint_replies").insert({
        complaintId: id,
        message:
          message ||
          "This complaint has been escalated to admin for further assistance.",
        senderName: sessionUser.name || "Organizer",
        senderRole: "ORGANIZER",
      });

      return NextResponse.json({
        success: true,
        message: "Complaint escalated to admin",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Complaint PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}