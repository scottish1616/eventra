import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const SITE_ASSETS_BUCKET = "site-assets";

// GET /api/site-assets/[name] — public, returns the image URL
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await context.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("site_assets")
      .select("imageUrl, updatedAt")
      .eq("name", name)
      .eq("isActive", true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: data.imageUrl,
      updatedAt: data.updatedAt,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/site-assets/[name] — admin/overseer only, upload new image
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "OVERSEER"].includes(sessionUser.role || "")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await context.params;
    const supabase = getSupabase();

    // Check 7-day limit for hero_background
    if (name === "hero_background") {
      const { data: existing } = await supabase
        .from("site_assets")
        .select("updatedAt")
        .eq("name", name)
        .maybeSingle();

      if (existing?.updatedAt) {
        const lastUpdated = new Date(existing.updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - lastUpdated.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (diffDays < 7) {
          const daysLeft = Math.ceil(7 - diffDays);
          return NextResponse.json(
            { success: false, error: `You can only change the homepage image once every 7 days. Please wait ${daysLeft} more day(s).` },
            { status: 403 }
          );
        }
      }
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    // Ensure bucket exists
    try {
      const { error: bucketError } = await supabase.storage.createBucket(SITE_ASSETS_BUCKET, { public: true });
      if (bucketError) {
        const msg = String(bucketError?.message || "").toLowerCase();
        if (!msg.includes("already exists")) throw bucketError;
      }
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();
      if (!msg.includes("already exists")) throw e;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${name}-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(SITE_ASSETS_BUCKET)
      .upload(fileName, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(fileName);
    if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

    const imageUrl = urlData.publicUrl;

    // Upsert into site_assets table
    const { data: asset, error: dbError } = await supabase
      .from("site_assets")
      .upsert(
        {
          name,
          imageUrl,
          updatedBy: sessionUser.id,
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "name" },
      )
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data: asset });
  } catch (e: any) {
    console.error("[SiteAssets POST]", e);
    return NextResponse.json({ success: false, error: e?.message || "Upload failed" }, { status: 500 });
  }
}

// DELETE /api/site-assets/[name] — restore to default (clears the record)
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "OVERSEER"].includes(sessionUser.role || "")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await context.params;
    const supabase = getSupabase();

    await supabase.from("site_assets").delete().eq("name", name);

    return NextResponse.json({ success: true, message: "Restored to default" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
