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
      const { error: resolveError } = await supabase
        .from("complaints")
        .update({
          status: "RESOLVED",
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);

      if (resolveError) {
        return NextResponse.json({ success: false, error: resolveError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Complaint resolved",
      });
    }

    if (action === "escalate") {
      const allowedRoles = ["ORGANIZER", "ADMIN"];
      const isStaff = sessionUser.role && sessionUser.role.startsWith("STAFF_");

      if (!allowedRoles.includes(sessionUser.role) && !isStaff) {
        return NextResponse.json(
          { success: false, error: "Unauthorized to escalate" },
          { status: 403 }
        );
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (sessionUser.role === "ORGANIZER") {
        updateData.status = "ESCALATED";
        updateData.assignedTo = "ADMIN";
        updateData.escalatedAt = new Date().toISOString();
      } else if (sessionUser.role === "ADMIN") {
        updateData.status = "ESCALATED";
        updateData.assignedTo = "OVERSEER";
        updateData.escalatedAt = new Date().toISOString();
      } else {
        updateData.status = "IN_PROGRESS";
      }

      const { error: escalateError } = await supabase
        .from("complaints")
        .update(updateData)
        .eq("id", id);

      if (escalateError) {
        return NextResponse.json({ success: false, error: escalateError.message }, { status: 500 });
      }

      let escalationMessage = "This complaint has been escalated to the organizer.";
      let senderName = "Staff";
      
      if (sessionUser.role === "ORGANIZER") {
        escalationMessage = "This complaint has been escalated to admin for further assistance.";
        senderName = sessionUser.name || "Organizer";
      } else if (sessionUser.role === "ADMIN") {
        escalationMessage = "This complaint has been escalated to the overseer for final review.";
        senderName = "Admin";
      } else {
        senderName = sessionUser.name || "Staff";
      }

      await supabase.from("complaint_replies").insert({
        complaintId: id,
        message: message || escalationMessage,
        senderName,
        senderRole: sessionUser.role,
      });

      let responseMessage = "Complaint escalated to organizer";
      if (sessionUser.role === "ORGANIZER") responseMessage = "Complaint escalated to admin";
      if (sessionUser.role === "ADMIN") responseMessage = "Complaint escalated to overseer";

      return NextResponse.json({
        success: true,
        message: responseMessage,
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