import { NextResponse, type NextRequest } from "next/server";

// Daily Vercel Cron ping. Supabase pauses free projects after ~7 days without database
// requests; the landing page never touches the database, so this keeps the project awake.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // A tiny read through PostgREST counts as database activity; RLS returns no rows to anon.
  const res = await fetch(`${url}/rest/v1/startups?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  return NextResponse.json({ ok: res.ok, status: res.status, at: new Date().toISOString() });
}
