import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logApiError } from "@/lib/api-logger";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.termsAccepted || !body?.privacyAccepted) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("users")
    .update({
      terms_accepted_at: now,
      privacy_accepted_at: now,
    })
    .eq("id", session.user.id);

  if (error) {
    logApiError("consent.update", error, { userId: session.user.id });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
