import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionUser } from "@/lib/session";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let where: any = {};

    if (sessionUser.role === "ORGANIZER") {
      const user = await prisma.user.findUnique({
        where: { email: sessionUser.email! },
        select: { id: true },
      });
      if (user) {
        where = {
          OR: [
            { organizerId: user.id },
            { complainantEmail: sessionUser.email },
          ],
        };
      }
    } else if (sessionUser.role === "ADMIN") {
      where = {
        OR: [
          { assignedTo: "ADMIN" },
          { type: "ORGANIZER" },
          { complainantEmail: sessionUser.email },
        ],
      };
    } else if (sessionUser.role === "OVERSEER") {
      where = {
        OR: [{ assignedTo: "OVERSEER" }, { type: "ADMIN" }],
      };
    } else {
      // USER / STAFF / CUSTOMER — see only their own
      if (sessionUser.email) {
        where = { complainantEmail: sessionUser.email };
      } else if (sessionUser.name) {
        where = { complainantName: sessionUser.name };
      }
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const normalized = complaints.map((c) => ({
      id: c.id,
      title: c.subject,
      description: c.message,
      category: c.category,
      priority: c.priority,
      status: c.status,
      type: c.type,
      complainantName: c.complainantName,
      complainantPhone: c.complainantPhone,
      complainantEmail: c.complainantEmail,
      eventId: c.eventId,
      organizerId: c.organizerId,
      eventName: c.eventName,
      organizerName: c.organizerName,
      assignedTo: c.assignedTo,
      event: null,
      organizer: null,
      replies: [],
      escalatedAt: null,
      resolvedAt: null,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error("[Complaints GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subject,
      message,
      complainantName,
      complainantPhone,
      complainantEmail,
      category,
      priority,
      eventId,
      organizerId,
      eventName,
      organizerName,
      type,
    } = body;

    if (!subject || !message || !complainantName) {
      return NextResponse.json(
        { success: false, error: "Subject, message and name are required" },
        { status: 400 }
      );
    }

    const complaintType: "ATTENDEE" | "ORGANIZER" | "ADMIN" =
      type === "ORGANIZER" ? "ORGANIZER" : type === "ADMIN" ? "ADMIN" : "ATTENDEE";
    const isInternal = complaintType === "ORGANIZER" || complaintType === "ADMIN";

    if (!isInternal && (!eventId || !organizerId)) {
      return NextResponse.json(
        {
          success: false,
          error: "An event and organizer must be selected to report an issue",
        },
        { status: 400 }
      );
    }

    let assignedTo: string | null = null;
    if (complaintType === "ORGANIZER") assignedTo = "ADMIN";
    if (complaintType === "ADMIN") assignedTo = "OVERSEER";

    const priorityVal: "LOW" | "MEDIUM" | "HIGH" =
      priority === "LOW" ? "LOW" : priority === "HIGH" ? "HIGH" : "MEDIUM";

    const complaint = await prisma.complaint.create({
      data: {
        subject,
        message,
        category: category || "OTHER",
        priority: priorityVal,
        complainantName,
        complainantPhone: complainantPhone || null,
        complainantEmail: complainantEmail || null,
        eventId: eventId || null,
        organizerId: organizerId || null,
        eventName: eventName || null,
        organizerName: organizerName || null,
        type: complaintType,
        assignedTo,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  } catch (error) {
    console.error("[Complaints POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit complaint" },
      { status: 500 }
    );
  }
}
