import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as { role?: string } | undefined;

        if (!session || user?.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from("users")
            .select("id, name, email, phone, organizationName, createdAt")
            .eq("role", "ORGANIZER")
            .order("createdAt", { ascending: false });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[Admin Organizers GET]", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch organizers" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as { role?: string } | undefined;

        if (!session || user?.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, email, phone, organizationName, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: "Name, email and password are required" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { success: false, error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await hash(password, 10);

        const { data: newUser, error } = await supabase
            .from("users")
            .insert({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                phone: phone || null,
                role: "ORGANIZER",
                organizationName: organizationName || null,
            })
            .select("id, name, email, role")
            .single();

        if (error || !newUser) {
            console.error("[Admin Create Organizer]", error);
            return NextResponse.json(
                { success: false, error: error?.message || "Failed to create organizer" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, data: newUser },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Admin Create Organizer]", error);
        return NextResponse.json(
            { success: false, error: "Something went wrong" },
            { status: 500 }
        );
    }
}