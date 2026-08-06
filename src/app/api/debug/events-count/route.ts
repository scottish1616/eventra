import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Dev-only: returns counts from Prisma (direct DB) and Supabase table
export async function GET() {
  try {
    const totalPrisma = await prisma.event.count();
    const byStatusPrismaRaw = await prisma.$queryRawUnsafe(`
      select status, count(*)::int as count from \"events\" group by status;
    `);

    const supabase = getSupabase();
    const supaRes = await supabase.from("events").select("id,status");

    const supaData = supaRes.data || [];
    const totalSupabase = supaData.length;
    const byStatusSupabase: Record<string, number> = {};
    supaData.forEach((r: any) => {
      const s = String(r.status || "");
      byStatusSupabase[s] = (byStatusSupabase[s] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        prisma: { total: totalPrisma, byStatus: byStatusPrismaRaw },
        supabase: { total: totalSupabase, byStatus: byStatusSupabase },
      },
    });
  } catch (error) {
    console.error("[Debug events-count]", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
