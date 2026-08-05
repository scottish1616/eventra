import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
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

async function uploadBase64Image(supabase: ReturnType<typeof getSupabase>, base64: string, mimeType: string, originalName: string) {
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `events/${Date.now()}-${safeFileName}`;
  const buffer = Buffer.from(base64, "base64");

  const ensureBucketExists = async () => {
    try {
      const { error: bucketError } = await supabase.storage.createBucket(storageBucket, { public: true });
      if (bucketError) {
        const errorMsg = String(bucketError?.message || bucketError || "").toLowerCase();
        if (!errorMsg.includes("bucket already exists") && !errorMsg.includes("already exists")) {
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
    buffer,
    {
      contentType: mimeType,
      upsert: false,
    },
  );

  if (uploadError) throw uploadError;

  const publicUrlResult = supabase.storage.from(storageBucket).getPublicUrl(fileName);
  return publicUrlResult.data?.publicUrl;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";
    const search = searchParams.get("search") ?? "";

    if (mine) {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      let user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true },
      });

      if (!user && sessionUser.email) {
        const fallbackUser = await prisma.user.findUnique({
          where: { email: sessionUser.email.toLowerCase() },
          select: { id: true },
        });
        if (fallbackUser) {
          user = fallbackUser;
        }
      }

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const events = await prisma.event.findMany({
        where: { organizerId: user.id },
        orderBy: { date: "asc" },
        include: {
          ticketTypes: true,
          _count: { select: { tickets: true, orders: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: events.map((e) => ({
          ...e,
          bannerUrl: e.coverImage || null,
          organizer: null,
        })),
      });
    }

    const whereClause: any = { status: "PUBLISHED" };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
      include: {
        ticketTypes: true,
        _count: { select: { tickets: true, orders: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        ...e,
        bannerUrl: e.coverImage || null,
        organizer: null,
      })),
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

    const body = await req.json();
    const { title, description, date, endDate, location, venue, bannerBase64, bannerMimeType, bannerFileName, ticketTypes, paymentMethods } = body;

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

    if (bannerBase64 && bannerMimeType && bannerFileName) {
      try {
        const url = await uploadBase64Image(supabase, bannerBase64, bannerMimeType, bannerFileName);
        if (url) coverImageUrl = url;
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

    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        id: eventId,
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
        platformFeePercent: 0,
        platformFeeFixed: 0,
        createdAt: now,
        updatedAt: now,
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
          id: crypto.randomUUID(),
          eventId: event.id,
          category: tt.category || "REGULAR",
          name: tt.name,
          description: tt.description || null,
          price: Number(tt.price),
          totalSlots: Number(tt.totalSlots),
          soldCount: 0,
          isActive: true,
          maxPerOrder: Number(tt.maxPerOrder) || 10,
          createdAt: now,
          updatedAt: now,
        });

      if (ttError) {
        console.error("[Events POST] Ticket type error:", ttError.message);
      }
    }

    if (paymentMethods && Array.isArray(paymentMethods)) {
      for (const pm of paymentMethods) {
        if (pm.isActive) {
          const { error: pmError } = await supabase
            .from("event_payment_methods")
            .insert({
              id: crypto.randomUUID(),
              eventId: event.id,
              type: pm.type,
              isRecommended: pm.isRecommended || false,
              isActive: true,
              phoneNumber: pm.phoneNumber || null,
              recipientName: pm.recipientName || null,
              tillNumber: pm.tillNumber || null,
              businessName: pm.businessName || null,
              paybillNumber: pm.paybillNumber || null,
              accountNumber: pm.accountNumber || null,
              createdAt: now,
              updatedAt: now,
            });
          if (pmError) {
            console.error("[Events POST] Payment method error:", pmError.message);
          }
        }
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