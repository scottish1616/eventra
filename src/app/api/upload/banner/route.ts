import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/session";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: "File must be under 5MB" },
                { status: 400 }
            );
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Only JPG, PNG, WebP and GIF allowed" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { error: uploadError } = await supabase.storage
            .from("event-banners")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("[Banner Upload]", uploadError);
            return NextResponse.json(
                { success: false, error: uploadError.message },
                { status: 500 }
            );
        }

        const { data: urlData } = supabase.storage
            .from("event-banners")
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
        });
    } catch (error) {
        console.error("[Banner Upload]", error);
        return NextResponse.json(
            { success: false, error: "Upload failed" },
            { status: 500 }
        );
    }
}