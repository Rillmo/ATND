import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logApiError } from "@/lib/api-logger";
import { joinOrgSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = joinOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("invite_code", parsed.data.inviteCode)
    .single();

  if (orgError) {
    logApiError("orgs.join.lookup", orgError, { userId: session.user.id });
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }

  if (!org) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("org_id", org.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existingError) {
    logApiError("orgs.join.membership_check", existingError, {
      userId: session.user.id,
      orgId: org.id,
    });
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      org_id: org.id,
      user_id: session.user.id,
      role: "MEMBER",
    });

  if (memberError) {
    logApiError("orgs.join.insert", memberError, {
      userId: session.user.id,
      orgId: org.id,
    });
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }

  return NextResponse.json({ id: org.id });
}
