import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "event-images";

async function uploadCoverImage(supabase: ReturnType<typeof getSupabase>, coverImageFile: File) {
  const safeFileName = coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `events/${Date.now()}-${safeFileName}`;
  const arrayBuffer = await coverImageFile.arrayBuffer();

  const ensureBucketExists = async () => {
    try {
      const { error: bucketError } = await supabase.storage.createBucket(storageBucket, {
        public: true,
      });

      if (bucketError) {
        const errorMsg = String(bucketError?.message || bucketError || "").toLowerCase();
        if (!errorMsg.includes("bucket already exists") && !errorMsg.includes("already exists")) {
          console.error("[uploadCoverImage] Bucket creation error:", bucketError);
          throw bucketError;
        }
      }
    } catch (e: any) {
      const errorMsg = String(e?.message || e || "").toLowerCase();
      if (!errorMsg.includes("bucket already exists") && !errorMsg.includes("already exists")) {
        throw e;
      }
    }
  };

  await ensureBucketExists();

  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(
    fileName,
    arrayBuffer,
    {
      contentType: coverImageFile.type,
      upsert: false,
    },
  );

  if (uploadError) {
    throw uploadError;
  }

  const publicUrlResult = supabase.storage
    .from(storageBucket)
    .getPublicUrl(fileName);
  const publicData = publicUrlResult.data;

  if (!publicData?.publicUrl) {
    throw new Error("Failed to get public URL");
  }

  return publicData.publicUrl;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const sessionUser = await getSessionUser();
    console.log(`[Events GET by ID] eventId=${eventId} sessionUserEmail=${sessionUser?.email} sessionUserId=${sessionUser?.id}`);

    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Get current user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (userError || !user) {
      console.error("[Events GET by ID] user lookup error:", userError);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get event
    const { data: event, error } = await supabase
      .from("events")
      .select("*, ticket_types(*)")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      console.error("[Events GET by ID] event lookup error:", error);
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is organizer or admin
    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      console.warn(
        `[Events GET by ID] permission denied: user.role=${user.role} user.id=${user.id} event.organizerId=${event.organizerId}`,
      );
      return NextResponse.json(
        { success: false, error: "You don't have access to edit this event" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        ticketTypes: event.ticket_types || [],
      },
    });
  } catch (error) {
    console.error("[Events GET by ID]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const sessionUser = await getSessionUser();

    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Get current user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get event and check ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organizerId")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is organizer or admin
    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const endDate = formData.get("endDate") as string;
    const location = formData.get("location") as string;
    const venue = formData.get("venue") as string;
    const coverImageFile = formData.get("coverImage") as File | null;
    const ticketTypesJson = formData.get("ticketTypes") as string;
    const ticketTypes = JSON.parse(ticketTypesJson || "[]");

    let coverImageUrl: string | null = null;

    // Handle file upload if present
    if (coverImageFile) {
      try {
        const arrayBuffer = await coverImageFile.arrayBuffer();
        const safeFileName = coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `events/${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(fileName, arrayBuffer, {
            contentType: coverImageFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const publicUrlResult = supabase.storage
          .from("event-images")
          .getPublicUrl(fileName);

        coverImageUrl = publicUrlResult.data?.publicUrl || null;
      } catch (uploadErr) {
        console.error("[Events PUT] Upload error:", uploadErr);
        return NextResponse.json(
          { success: false, error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Update event
    const updateData: any = {
      title,
      description: description || null,
      date: new Date(date).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      location,
      venue: venue || null,
    };

    if (coverImageUrl) {
      updateData.coverImage = coverImageUrl;
    }

    const { error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update event" },
        { status: 500 }
      );
    }

    // Update ticket types
    // Delete old ones (except those with IDs that exist in the new list)
    const newTicketTypeIds = ticketTypes
      .filter((tt: any) => tt.id)
      .map((tt: any) => tt.id);

    const { data: existingTickets } = await supabase
      .from("ticket_types")
      .select("id")
      .eq("eventId", eventId);

    const toDelete = existingTickets?.filter(
      (t: any) => !newTicketTypeIds.includes(t.id)
    );

    if (toDelete && toDelete.length > 0) {
      const idsToDelete = toDelete.map((t: any) => t.id);
      await supabase
        .from("ticket_types")
        .delete()
        .in("id", idsToDelete);
    }

    // Insert/update ticket types
    for (const tt of ticketTypes) {
      if (tt.id) {
        // Update existing
        await supabase
          .from("ticket_types")
          .update({
            category: tt.category || "REGULAR",
            name: tt.name,
            description: tt.description || null,
            price: Number(tt.price),
            totalSlots: Number(tt.totalSlots),
            maxPerOrder: Number(tt.maxPerOrder) || 10,
          })
          .eq("id", tt.id);
      } else {
        // Insert new
        await supabase
          .from("ticket_types")
          .insert({
            eventId,
            category: tt.category || "REGULAR",
            name: tt.name,
            description: tt.description || null,
            price: Number(tt.price),
            totalSlots: Number(tt.totalSlots),
            soldCount: 0,
            isActive: true,
            maxPerOrder: Number(tt.maxPerOrder) || 10,
          });
      }
    }

    return NextResponse.json(
      { success: true, message: "Event updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Events PUT]", msg);
    return NextResponse.json(
      { success: false, error: "Server error: " + msg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const sessionUser = await getSessionUser();

    if (!sessionUser?.email) {
      return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (userError || !user) {
      console.error("[Events PATCH] user lookup error:", userError);
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, status } = body as { action?: string; status?: string };

    // Get event and check ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organizerId")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("[Events PATCH] event lookup error:", eventError);
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      return NextResponse.json({ success: false, error: "You don't have permission" }, { status: 403 });
    }

    if (action === "DELETE") {
      const { error: delErr } = await supabase.from("events").delete().eq("id", eventId);
      if (delErr) {
        console.error("[Events PATCH] delete error:", delErr);
        return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (status) {
      const { error: updErr } = await supabase.from("events").update({ status }).eq("id", eventId);
      if (updErr) {
        console.error("[Events PATCH] status update error:", updErr);
        return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Events PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const sessionUser = await getSessionUser();

    if (!sessionUser?.email) {
      return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (userError || !user) {
      console.error("[Events DELETE] user lookup error:", userError);
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organizerId")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("[Events DELETE] event lookup error:", eventError);
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      return NextResponse.json({ success: false, error: "You don't have permission" }, { status: 403 });
    }

    const { error: delErr } = await supabase.from("events").delete().eq("id", eventId);
    if (delErr) {
      const delErrMsg = delErr?.message || JSON.stringify(delErr) || "Unknown error";
      console.error("[Events DELETE] delete error:", delErrMsg);
      return NextResponse.json({ success: false, error: "Failed to delete event: " + delErrMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Events DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}
