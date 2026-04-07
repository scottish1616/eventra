import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const hashedPassword = await hash("test123", 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: "Test Organizer",
        email: "testorg@eventra.app",
        password: hashedPassword,
        phone: "0712000000",
        role: "ORGANIZER",
        organizationName: "Test Org",
      })
      .select("id, name, email, role")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, details: error });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
