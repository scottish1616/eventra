import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";
import { hash } from "bcryptjs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email || sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const { data: staff, error } = await supabase
      .from("staff")
      .select(`
        *,
        users!staff_userId_fkey(id, name, email, phone, role),
        events!staff_eventId_fkey(id, title)
      `)
      .eq("organizerId", organizer.id)
      .order("createdAt", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const formatted = (staff || []).map((s) => ({
      ...s,
      user: s.users || null,
      event: s.events || null,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[Organizer Staff GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email || sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, phone, password, role, eventId, existingUserId } = body;

    if (!role || !["STAFF_GATEKEEPER", "STAFF_LOGISTICS"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Valid role is required (STAFF_GATEKEEPER or STAFF_LOGISTICS)" },
        { status: 400 }
      );
    }

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

    let userId = existingUserId;

    if (!userId) {
      if (!name || !email || !password) {
        return NextResponse.json(
          { success: false, error: "Name, email and password required for new staff" },
          { status: 400 }
        );
      }

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hash(password, 10);

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone || null,
          password: hashedPassword,
          role,
          subscriptionStatus: "active",
        })
        .select("id")
        .single();

      if (userError || !newUser) {
        return NextResponse.json(
          { success: false, error: userError?.message || "Failed to create user" },
          { status: 500 }
        );
      }

      userId = newUser.id;
    } else {
      await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);
    }

    const { data: staffRecord, error: staffError } = await supabase
      .from("staff")
      .insert({
        userId,
        organizerId: organizer.id,
        role,
        eventId: eventId || null,
        status: "active",
      })
      .select()
      .single();

    if (staffError || !staffRecord) {
      return NextResponse.json(
        { success: false, error: staffError?.message || "Failed to create staff record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: staffRecord },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Organizer Staff POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to add staff" },
      { status: 500 }
    );
  }
}