import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
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
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("invite_code", parsed.data.inviteCode)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("org_id", org.id)
    .eq("user_id", session.user.id)
    .single();

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
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }

  return NextResponse.json({ id: org.id });
}
