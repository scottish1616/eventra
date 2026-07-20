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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";
    const search = searchParams.get("search") ?? "";
    const supabase = getSupabase();

    if (mine) {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.email) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", sessionUser.email)
        .single();

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const { data: events, error } = await supabase
        .from("events")
        .select("*, ticket_types(*), tickets(id), orders(id,total), bannerUrl")
        .eq("organizerId", user.id)
        .order("date", { ascending: true });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: (events || []).map((e) => {
          const { tickets, ticket_types, orders, ...rest } = e as any;
          const bannerUrl = rest.bannerUrl || rest.coverImage || null;
          return {
            ...rest,
            bannerUrl,
            ticketTypes: ticket_types || [],
            organizer: null,
            _count: {
              tickets: tickets?.length || 0,
              orders: orders?.length || 0,
            },
            orders: orders || [],
          };
        }),
      });
    }

    let query = supabase
      .from("events")
      .select("*, ticket_types(*), bannerUrl")
      .eq("status", "PUBLISHED")
      .order("date", { ascending: true });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data: events, error } = await query.select(
      "*, ticket_types(*), tickets(id), orders(id,total), bannerUrl"
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (events || []).map((e) => {
        const { tickets, ticket_types, orders, ...rest } = e as any;
        const bannerUrl = rest.bannerUrl || rest.coverImage || null;
        return {
          ...rest,
          bannerUrl,
          ticketTypes: ticket_types || [],
          organizer: null,
          _count: {
            tickets: tickets?.length || 0,
            orders: orders?.length || 0,
          },
          orders: orders || [],
        };
      }),
    });
  } catch (error) {
    console.error("[Events GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Not logged in — please sign in first" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", sessionUser.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found: " + (userError?.message || "unknown"),
        },
        { status: 404 }
      );
    }

    if (!["ORGANIZER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only organizers can create events. Your role: " + user.role,
        },
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

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Event title is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Event date is required" },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Event location is required" },
        { status: 400 }
      );
    }

    if (!ticketTypes || ticketTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one ticket type is required" },
        { status: 400 }
      );
    }

    let coverImageUrl: string | null = null;

    // Handle file upload if present
    if (coverImageFile) {
      try {
        coverImageUrl = await uploadCoverImage(supabase, coverImageFile);
      } catch (uploadErr) {
        console.error("[Events POST] Upload error:", uploadErr);
        return NextResponse.json(
          { success: false, error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    const slug =
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 8);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title,
        description: description || null,
        date: new Date(date).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        location,
        venue: venue || null,
        coverImage: coverImageUrl || null,
        status: "PUBLISHED",
        slug,
        organizerId: user.id,
        platformFeePercent: 5,
        platformFeeFixed: 0,
      })
      .select()
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Event creation failed: " + (eventError?.message || "unknown"),
        },
        { status: 500 }
      );
    }

    for (const tt of ticketTypes) {
      const { error: ttError } = await supabase
        .from("ticket_types")
        .insert({
          eventId: event.id,
          category: tt.category || "REGULAR",
          name: tt.name,
          description: tt.description || null,
          price: Number(tt.price),
          totalSlots: Number(tt.totalSlots),
          soldCount: 0,
          isActive: true,
          maxPerOrder: Number(tt.maxPerOrder) || 10,
        });

      if (ttError) {
        console.error("[Events POST] Ticket type error:", ttError.message);
      }
    }

    return NextResponse.json(
      { success: true, data: event, message: "Event created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Events POST] Error:", msg);
    return NextResponse.json(
      { success: false, error: "Server error: " + msg },
      { status: 500 }
    );
  }
}