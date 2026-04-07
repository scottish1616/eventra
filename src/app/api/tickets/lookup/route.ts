import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const number = searchParams.get("number");

        if (!number) {
            return NextResponse.json(
                { success: false, error: "Ticket number required" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        const { data: ticket, error } = await supabase
            .from("tickets")
            .select("id, ticketNumber")
            .eq("ticketNumber", number.trim().toUpperCase())
            .single();

        if (error || !ticket) {
            return NextResponse.json(
                { success: false, error: "Ticket not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: ticket });
    } catch (error) {
        console.error("[Ticket Lookup]", error);
        return NextResponse.json(
            { success: false, error: "Failed to lookup ticket" },
            { status: 500 }
        );
    }
}